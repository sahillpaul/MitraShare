import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env.MONGO_URI;
    
    if (!mongoURI) {
      throw new Error("MONGO_URI environment variable is missing in .env");
    }

    const conn = await mongoose.connect(mongoURI);
    console.log(`📡 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Database connection error: ${(error as Error).message}`);
    process.exit(1); // Kill the server if the database fails
  }
};