import type { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.js';
import bcrypt from 'bcryptjs';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleLogin = async (req: Request, res: Response): Promise<any> => {
  try {
    const { token } = req.body;

    // 1. Verify Google Token is real
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID!,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) return res.status(400).json({ error: "Invalid Google Token" });

    // 2. Check if user already exists in MongoDB
    let user = await User.findOne({ email: payload.email });

    // 3. If user DOES NOT exist, check for the invite code
    if (!user) {
      // Create the new user.
      user = await User.create({
        name: payload.name || payload.email,
        email: payload.email,
        authProvider: 'google', // Fix: Added required field
        semester: 1, // Defaulting to 1, user can update later in Profile
        role: 'student'
      });
    }

    // 4. Generate MitraShare JWT
    const customJwt = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' } // Keeps them logged in for a week
    );

    // 5. Send success response with HTTP-only cookie
    res.cookie('jwt', customJwt, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    return res.status(200).json({ message: "Login successful" });

  } catch (error) {
    console.error("Auth Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
// --- 1. LOCAL SIGNUP ---
export const localSignup = async (req: Request, res: Response): Promise<any> => {
  try {
    const { name, email, password, semester } = req.body;

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already registered. Please log in." });
    }

    // 3. Hash the password (Salt rounds = 10)
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create the User
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      authProvider: 'local',
      semester: semester || 1,
      role: 'student'
    });

    // 5. Generate JWT
    const jwtToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    res.cookie('jwt', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(201).json({ message: "Account created!" });
  } catch (error) {
    return res.status(500).json({ error: "Signup failed." });
  }
};

// --- 2. LOCAL LOGIN ---
export const localLogin = async (req: Request, res: Response): Promise<any> => {
  try {
    const { email, password } = req.body;

    // 1. Find user by email
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: "Account not found." });

    // 2. Prevent Google users from logging in with a blank password
    if (user.authProvider === 'google' || !user.password) {
      return res.status(400).json({ error: "Please log in using Google." });
    }

    // 3. Verify cryptographic password hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials." });

    // 4. Generate JWT
    const jwtToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    res.cookie('jwt', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({ message: "Login successful!" });
  } catch (error) {
    return res.status(500).json({ error: "Login failed." });
  }
};

// --- 3. LOGOUT ---
export const logout = (req: Request, res: Response): any => {
  res.clearCookie('jwt');
  return res.status(200).json({ message: "Logged out successfully" });
};