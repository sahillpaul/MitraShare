import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { connectDB } from './config/db.js';
import { googleLogin } from './controllers/authController.js';
import fileRoutes from './routes/fileRoutes.js';
import userRoutes from './routes/userRoutes.js';
import authRoutes from './routes/authRoutes.js';
// Load environment variables first
dotenv.config();

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true })); // Allows your Vite frontend to talk to this backend with cookies
app.use(helmet({
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }, // Allow Google Sign-In postMessage
  crossOriginEmbedderPolicy: false,
})); // Secures HTTP headers
app.use(express.json()); // Allows server to read JSON data
app.use(cookieParser()); // Parse Cookie header and populate req.cookies
app.use('/api/files', fileRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.post('/api/auth/google', googleLogin);


// Start Database & Server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 MitraShare Server running on port ${PORT}`);
  });
});