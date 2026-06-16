import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client } from '../config/s3.js';
import { File } from '../models/file.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import { redis } from '../config/redis.js';
import { profileCacheKey, publicProfileCacheKey } from '../middleware/cacheMiddleware.js';

export const getUploadUrl = async (req: Request, res: Response): Promise<any> => {
  try {
    const { title, semester, subject, category, fileHash, fileType, fileSize, year, facultyName } = req.body;
    const uploaderId = (req as any).user?.userId; // Read directly from verified token session
    if (fileSize > 25 * 1024 * 1024) return res.status(400).json({ error: "File exceeds 25MB limit." });

    const existingFile = await File.findOne({ fileHash, status: 'active' });
    if (existingFile) return res.status(409).json({ error: "Document already exists!" });

    const fileKey = `sem${semester}/${subject.replace(/\s+/g, '_')}/${Date.now()}-${fileHash.substring(0, 8)}.pdf`;

    // Create a pending invisible record
    const newFile = await File.findOneAndUpdate(
      { fileHash, status: 'pending' },
      {
        title,
        fileUrl: fileKey,
        semester,
        subject,
        category,
        uploaderId,
        fileSize,
        status: 'pending',
        year, // NEW
        facultyName // NEW
      },
      { upsert: true, returnDocument: 'after' }
    );

    const command = new PutObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: fileKey,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 minute expiry

    return res.status(200).json({ uploadUrl, fileId: newFile._id });
  } catch (error) {
    console.error("Failed to create upload URL:", error);
    return res.status(500).json({ error: "Storage node integration error." });
  }
};

export const confirmUpload = async (req: Request, res: Response): Promise<any> => {
  try {
    const { fileId } = req.body;
    const finalizedFile = await File.findByIdAndUpdate(fileId, { status: 'active' }, { returnDocument: 'after' });

    // Invalidate the uploader's cached profile so their uploads list refreshes
    if (finalizedFile?.uploaderId) {
      const uploaderId = finalizedFile.uploaderId.toString();
      await redis.del(profileCacheKey(uploaderId));
      await redis.del(publicProfileCacheKey(uploaderId));
    }

    return res.status(200).json({ message: "File active!", file: finalizedFile });
  } catch (error) {
    console.error("Failed to confirm upload:", error);
    return res.status(500).json({ error: "Failed to finalize file." });
  }
};

export const getSecureViewUrl = async (req: Request, res: Response): Promise<any> => {
  try {
    const { fileId } = req.params;

    // We change findById to findByIdAndUpdate to increment views instantly
    const file = await File.findByIdAndUpdate(
      fileId,
      { $inc: { views: 1 } },
      { returnDocument: 'after' }
    );

    if (!file || file.status !== 'active') return res.status(404).json({ error: "File not found." });

    const command = new GetObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: file.fileUrl,
    });

    const viewUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
    return res.status(200).json({ viewUrl });
  } catch (error) {
    return res.status(500).json({ error: "Failed to generate secure link." });
  }
};

// Fetch files based on filters (Semester, Subject, Category)
export const getLibraryFiles = async (req: Request, res: Response): Promise<any> => {
  try {
    const { semester, subject, category } = req.query;
    const userId = (req as AuthRequest).user?.userId;

    // Build the query dynamically. Only ever return 'active' files!
    const query: any = { status: 'active' };
    if (semester) query.semester = Number(semester);
    if (subject) query.subject = subject;
    if (category) query.category = category;

    // .lean() strips heavy Mongoose wrappers for maximum read speed
    const files = await File.find(query)
      .sort({ createdAt: -1 }) // Newest first
      .limit(50) // Pagination baseline
      .populate('uploaderId', 'name')
      .lean();

    const personalizedFiles = files.map((file: any) => {
      const hasUpvoted = Boolean(userId) && Array.isArray(file.upvotedBy) && file.upvotedBy.some(
        (id: any) => id.toString() === userId
      );

      delete file.upvotedBy;
      return { ...file, hasUpvoted };
    });

    return res.status(200).json(personalizedFiles);
  } catch (error) {
    return res.status(500).json({ error: "Failed to retrieve library data." });
  }
};

// The High-Speed Search Engine
export const searchFiles = async (req: Request, res: Response): Promise<any> => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: "Search query required." });

    // Uses the high-speed B-Tree text index we built in Sprint 3
    const files = await File.find(
      { $text: { $search: q as string }, status: 'active' },
      { score: { $meta: "textScore" } } // Ask Mongo to score the relevance
    )
      .sort({ score: { $meta: "textScore" } }) // Sort by best match
      .limit(20)
      .populate('uploaderId', 'name')
      .lean();

    return res.status(200).json(files);
  } catch (error) {
    return res.status(500).json({ error: "Search engine failure." });
  }
};

export const deleteFile = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { fileId } = req.params;
    const userId = req.user?.userId;

    // 1. Find the file in the database
    const file = await File.findById(fileId);
    if (!file) return res.status(404).json({ error: "File not found." });

    // 2. Strict Authorization Check: Does this user own this file?
    if (file.uploaderId.toString() !== userId) {
      return res.status(403).json({ error: "Unauthorized. You can only delete your own uploads." });
    }

    // 3. Destroy the physical file in Backblaze B2
    const command = new DeleteObjectCommand({
      Bucket: process.env.B2_BUCKET_NAME,
      Key: file.fileUrl, // This holds our internal storage key
    });
    await s3Client.send(command);

    // 4. Destroy the database record
    await file.deleteOne();

    // 5. Invalidate the uploader's cached profile so their uploads list refreshes
    await redis.del(profileCacheKey(userId!));
    await redis.del(publicProfileCacheKey(userId!));

    return res.status(200).json({ message: "File permanently eradicated." });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to execute destruction sequence." });
  }
};

export const toggleUpvote = async (req: AuthRequest, res: Response) => {
  try {
    const fileId = (req.params.fileId ?? req.params.id) as string;
    const userId = req.user?.userId;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    if (!mongoose.Types.ObjectId.isValid(fileId)) return res.status(400).json({ error: 'Invalid file id' });

    const voterId = new mongoose.Types.ObjectId(userId);

    const removedVote: any = await File.findOneAndUpdate(
      { _id: fileId, upvotedBy: voterId } as any,
      { $pull: { upvotedBy: voterId }, $inc: { upvotes: -1 } } as any,
      { returnDocument: 'after' } as any
    );

    if (removedVote) {
      const upvotes = Math.max(0, removedVote.upvotes || 0);
      if ((removedVote.upvotes || 0) < 0) {
        await File.findByIdAndUpdate(fileId, { $set: { upvotes } });
      }

      return res.json({ success: true, upvotes, hasUpvoted: false });
    }

    const addedVote: any = await File.findOneAndUpdate(
      { _id: fileId, upvotedBy: { $ne: voterId } } as any,
      { $addToSet: { upvotedBy: voterId }, $inc: { upvotes: 1 } } as any,
      { returnDocument: 'after' } as any
    );

    if (!addedVote) return res.status(404).json({ error: "File not found" });

    return res.json({ success: true, upvotes: addedVote.upvotes || 0, hasUpvoted: true });

  } catch (error) {
    console.error("Upvote Error:", error);
    return res.status(500).json({ error: "Failed to process upvote" });
  }
};
