import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // Optional! Google users won't have this.
  authProvider: 'google' | 'local'; // Tracks how they signed up
  role: 'student' | 'admin';
  semester: number;
}

const userSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String }, // No 'required: true' here
  authProvider: { type: String, enum: ['google', 'local'], required: true },
  role: { type: String, enum: ['student', 'admin'], default: 'student' },
  semester: { type: Number, required: true }
}, { timestamps: true });

export const User = model<IUser>('User', userSchema);