import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

// Permissions matrix
export const PERMISSIONS = {
  admin: ['read_all', 'write_all', 'manage_users'],
  recruiter: ['read_all', 'write_candidates', 'write_notes', 'write_trajectories'],
  viewer: ['read_all']
} as const;

export interface AdminAuthRequest extends Request {
  adminUser?: {
    id: number;
    username: string;
    role: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-key-change-in-production';

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateToken(adminUser: { id: number; username: string; role: string }): string {
  return jwt.sign(
    { id: adminUser.id, username: adminUser.username, role: adminUser.role },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

export async function authenticateAdmin(req: AdminAuthRequest, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Token ontbreekt' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ message: 'Ongeldig token' });
  }

  const adminUser = await storage.getAdminUserById(decoded.id);
  if (!adminUser || !adminUser.isActive) {
    return res.status(401).json({ message: 'Gebruiker niet gevonden of inactief' });
  }

  req.adminUser = {
    id: adminUser.id,
    username: adminUser.username,
    role: adminUser.role
  };

  next();
}

export function requireRole(role: string) {
  return (req: AdminAuthRequest, res: Response, next: NextFunction) => {
    if (!req.adminUser) {
      return res.status(401).json({ message: 'Niet ingelogd' });
    }

    if (req.adminUser.role !== role && req.adminUser.role !== 'admin') {
      return res.status(403).json({ message: 'Onvoldoende rechten' });
    }

    next();
  };
}

export function requirePermission(permission: string) {
  return (req: AdminAuthRequest, res: Response, next: NextFunction) => {
    if (!req.adminUser) {
      return res.status(401).json({ message: 'Niet ingelogd' });
    }

    const userPermissions = PERMISSIONS[req.adminUser.role as keyof typeof PERMISSIONS] || [];
    if (!userPermissions.includes(permission as any)) {
      return res.status(403).json({ message: 'Onvoldoende rechten voor deze actie' });
    }

    next();
  };
}