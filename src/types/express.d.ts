// src/types/express.d.ts
// Augments Express's Request interface globally so req.user is
// available on the standard Request type without importing AuthRequest.

import { IUser } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

// This file has no exports — it is a pure ambient declaration.
export {};