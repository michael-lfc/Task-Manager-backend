import { Response, NextFunction } from 'express';
import type { AuthRequest } from '../types/index.js';
import { AppError, asyncHandler } from '../utils/appError.js';
import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';

// ─── Protect: verify JWT ──────────────────────────────────────────────────────
export const protect = asyncHandler(async (req: AuthRequest, _res: Response, next: NextFunction) => {
  let token: string | undefined;

  if (req.headers.authorization?.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError('You are not logged in. Please log in to get access.', 401));
  }

  const decoded = verifyToken(token);

  const currentUser = await User.findById(decoded.id).select('+isActive');
  if (!currentUser) {
    return next(new AppError('The user belonging to this token no longer exists.', 401));
  }

  if (!currentUser.isActive) {
    return next(new AppError('This account has been deactivated.', 403));
  }

  // req.user = currentUser;
  // next();

  req.user = {
   _id: currentUser._id.toString(),
   role: currentUser.role,
  };
});

// ─── Restrict: role-based access ──────────────────────────────────────────────
export const restrictTo = (...roles: string[]) =>
  (req: AuthRequest, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action.', 403));
    }
    next();
  };