import jwt from 'jsonwebtoken'
import type { Types } from 'mongoose'
import type { StringValue } from 'ms'

// ─── Types ────────────────────────────────────────────
export interface JwtPayload {
  id:   string
  iat?: number
  exp?: number
}

// ─── Helpers ──────────────────────────────────────────
const getSecret = (): string => {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET is not defined in environment variables')
  return secret
}

// ─── Sign Token ───────────────────────────────────────
export const signToken = (id: Types.ObjectId): string => {
  const expiresIn = (process.env.JWT_EXPIRES_IN ?? '7d') as StringValue

  return jwt.sign(
    { id: id.toString() },
    getSecret(),
    { expiresIn }
  )
}

// ─── Verify Token ─────────────────────────────────────
export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, getSecret()) as JwtPayload
}