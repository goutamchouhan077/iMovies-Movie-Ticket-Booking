import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import { Users, IUser } from '../models/index.ts';
import { JWT_SECRET, AuthRequest } from '../middleware/auth.ts';

export async function register(req: Request, res: Response) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await Users.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await Users.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: role === 'admin' ? 'admin' : 'user',
    });

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userSafe } = user;
    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: userSafe,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Registration failed.' });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await Users.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userSafe } = user;
    return res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: userSafe,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message || 'Login failed.' });
  }
}

export async function getMe(req: AuthRequest, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    const { password: _, ...userSafe } = req.user;
    return res.json({ success: true, user: userSafe });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}

export async function quickDemoLogin(req: Request, res: Response) {
  try {
    const { role } = req.body; // 'admin' | 'user'
    const targetEmail = role === 'admin' ? 'admin@imovies.com' : 'user@imovies.com';
    const user = await Users.findOne({ email: targetEmail });

    if (!user) {
      return res.status(404).json({ success: false, message: `Demo ${role} user not found.` });
    }

    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userSafe } = user;
    return res.json({
      success: true,
      message: `Signed in as Demo ${role === 'admin' ? 'Administrator' : 'User'}.`,
      token,
      user: userSafe,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, message: err.message });
  }
}
