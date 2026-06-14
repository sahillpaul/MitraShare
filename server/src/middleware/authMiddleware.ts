import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend the Express Request type so we can attach our custom user data to it
export interface AuthRequest extends Request {
  user?: { userId: string; role: string };
}

export const protect = (req: AuthRequest, res: Response, next: NextFunction): any => {
  try {
    const token = req.cookies.jwt;
    if (!token) {
      return res.status(401).json({ error: "Unauthorized access. No token provided." });
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) return res.status(500).json({ error: 'Server misconfiguration: JWT_SECRET missing.' });

    const decodedRaw = jwt.verify(token, secret) as unknown;
    // jwt.verify can return a string or an object; normalize to our expected object shape
    let payload: { userId: string; role: string };
    if (typeof decodedRaw === 'string') {
      payload = JSON.parse(decodedRaw) as { userId: string; role: string };
    } else {
      payload = decodedRaw as { userId: string; role: string };
    }

    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: "Session expired or invalid token." });
  }
};