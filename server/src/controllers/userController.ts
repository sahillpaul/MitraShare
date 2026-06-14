import type { Response } from 'express';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import { User } from '../models/user.js';
import { File } from '../models/file.js';
import { Types } from 'mongoose';

// 1. The Profile Engine (Fetches user stats and their personal uploads)
export const getMyProfile = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized." });

    const user = await User.findById(userId).select('-__v');
    if (!user) return res.status(404).json({ error: "User profile not found." });

    const uploaderObjectId = new Types.ObjectId(userId);
    const myUploads = await File.find({ uploaderId: uploaderObjectId }).sort({ createdAt: -1 });

    return res.status(200).json({
      user,
      uploads: myUploads
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to retrieve profile data." });
  }
};

// 2. The Social Feed Engine (Fetches recent files locked to their exact semester)
export const getMyFeed = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId;
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User context lost." });

    const feed = await File.find({ 
      semester: user.semester, 
      status: 'active' 
    })
      .sort({ createdAt: -1 }) 
      .limit(20) 
      .populate('uploaderId', 'name') 
      .lean();

    return res.status(200).json(feed);
  } catch (error) {
    return res.status(500).json({ error: "Failed to generate personalized feed." });
  }
};

export const getStrictFeed = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

    // Load the user's semester from DB to avoid trusting the token payload
    const user = await User.findById(userId).select('semester');
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const userSemester = user.semester;

    // 1. Fetch the newest files for their semester
    const files = await File.find({ semester: userSemester, status: 'active' })
                            .populate('uploaderId', 'name')
                            .sort({ createdAt: -1 });

    // 2. Loop through the files and inject the personal 'hasUpvoted' boolean
    const personalizedFeed = files.map(file => {
      const fileObj: any = file.toObject();

      fileObj.hasUpvoted = Array.isArray(fileObj.upvotedBy) && fileObj.upvotedBy.some(
        (id: any) => id.toString() === userId.toString()
      );

      delete fileObj.upvotedBy;

      return fileObj;
    });

    return res.status(200).json(personalizedFeed);

  } catch (error) {
    return res.status(500).json({ error: 'Failed to load feed' });
  }
};

// 3. Update Profile
export const updateMyProfile = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user?.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized.' });

    const { name, semester } = req.body;
    
    const updateData: any = {};
    if (name) updateData.name = name;
    if (semester !== undefined) updateData.semester = semester;

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true } // Returns the updated document, and bypasses document-level full validation if old data is invalid
    );

    if (!user) return res.status(404).json({ error: 'User not found.' });

    return res.status(200).json({ message: 'Profile updated successfully', user });
  } catch (error) {
    console.error("Profile update error:", error);
    return res.status(500).json({ error: 'Failed to update profile.', details: error instanceof Error ? error.message : String(error) });
  }
};

// 4. Public Profile
export const getPublicProfile = async (req: AuthRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('name semester email');
    if (!user) return res.status(404).json({ error: "User profile not found." });

    const uploaderObjectId = new Types.ObjectId(id as string);
    const uploads = await File.find({ uploaderId: uploaderObjectId, status: 'active' }).sort({ createdAt: -1 });

    return res.status(200).json({
      user,
      uploads
    });
  } catch (error) {
    return res.status(500).json({ error: "Failed to retrieve public profile data." });
  }
};