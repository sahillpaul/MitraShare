import mongoose, { Schema, model, Document } from 'mongoose';

export interface IFile extends Document {
  title: string;
  fileUrl: string;
  semester: number;
  subject: string;
  category: 'PYQ' | 'Question Bank' | 'Notes' | 'Syllabus'; // Added Question Bank
  uploaderId: mongoose.Types.ObjectId;
  fileHash: string; 
  fileSize: number;
  status: 'pending' | 'active';
  upvotes: number;
  views: number;
  // NEW: Tracks EXACTLY who clicked the button
  upvotedBy: mongoose.Types.ObjectId[];
  year?: number;
  facultyName?: string;
}

const fileSchema = new Schema<IFile>({
  title: { type: String, required: true, trim: true },
  fileUrl: { type: String, required: true },
  semester: { type: Number, required: true, min: 1, max: 8 },
  subject: { type: String, required: true, trim: true },
  category: { type: String, enum: ['PYQ', 'Question Bank', 'Notes', 'Syllabus'], required: true },
  uploaderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  fileHash: { type: String, required: true }, 
  fileSize: { type: Number, required: true, max: 26214400 },
  status: { type: String, enum: ['pending', 'active'], default: 'pending' },
  upvotes: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  upvotedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  // NEW OPTIONAL FIELDS
  year: { type: Number },
  facultyName: { type: String, trim: true }
}, { timestamps: true });

// High-speed indexing for our search engine later
fileSchema.index({ title: 'text', subject: 'text' });
// Prevents duplicate active files
fileSchema.index({ fileHash: 1, status: 1 }, { unique: true });
// Fast profile page lookups (covers sort by createdAt)
fileSchema.index({ uploaderId: 1, createdAt: -1 });
// Fast semester feed lookups
fileSchema.index({ semester: 1, status: 1, createdAt: -1 });

export const File = model<IFile>('File', fileSchema);