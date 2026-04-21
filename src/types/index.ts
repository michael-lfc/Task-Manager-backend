import type { Request } from 'express';
// import { Request } from 'express';
import { IUser } from '../models/User.js'; // Import your User model interface

// ─── Project Status ───────────────────────────────────
export type ProjectStatus =
  | 'planning'
  | 'active'
  | 'on-hold'
  | 'completed'
  | 'archived'

// ─── Priority ─────────────────────────────────────────
export type Priority =
  | 'low'
  | 'medium'
  | 'high'
  | 'critical'

// ─── Task Status ──────────────────────────────────────
export type TaskStatus =
  | 'todo'
  | 'in-progress'
  | 'in-review'
  | 'done'

// ─── User Role ────────────────────────────────────────
export type UserRole =
  | 'admin'
  | 'member'
  | 'viewer'

// ─── API Response ─────────────────────────────────────
export interface ApiResponse<T = unknown> {
  status:   'success' | 'fail' | 'error'
  message?: string
  data?:    T
  meta?:    PaginationMeta
}

// ─── Pagination ───────────────────────────────────────
export interface PaginationMeta {
  page:       number
  limit:      number
  total:      number
  totalPages: number
}

export interface PaginationQuery {
  page?:   string
  limit?:  string
  sort?:   string
  search?: string
}

// ─── Auth Request (add this) ──────────────────────────
// export interface AuthRequest extends Request {
//   user?: IUser; // or whatever your User interface is called
// }

export interface AuthRequest extends Request {
  user?: {
    _id: string;
    role: 'admin' | 'member' | 'viewer';
  };
}