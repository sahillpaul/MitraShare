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
app.use(cors({ 
  origin: [
    'http://localhost:5173',
    'https://mitrashare.vercel.app',
    'https://mitrashare-sahilpaul046-1342s-projects.vercel.app'
  ], 
  credentials: true 
})); // Allows your Vite frontend to talk to this backend with cookies
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

// Health check endpoint (used by the self-ping keep-alive below)
app.get('/api/health', (_req, res) => {
  res.status(200).json({ status: 'alive', timestamp: new Date().toISOString() });
});


// Start Database & Server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 MitraShare Server running on port ${PORT}`);

    // KEEP-ALIVE: Ping ourselves every 14 minutes to prevent Render free-tier spin-down
    const RENDER_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`;
    setInterval(async () => {
      try {
        const res = await fetch(`${RENDER_URL}/api/health`);
        console.log(`🏓 Keep-alive ping: ${res.status}`);
      } catch (err) {
        console.error('🏓 Keep-alive ping failed:', err);
      }
    }, 14 * 60 * 1000); // Every 14 minutes (Render sleeps at 15)
  });
});