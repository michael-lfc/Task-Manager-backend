// ─── AppError ─────────────────────────────────────────
export class AppError extends Error {
  public readonly statusCode: number
  public readonly status:     string
  public readonly isOperational: boolean

  constructor(message: string, statusCode: number) {
    super(message)

    this.statusCode    = statusCode
    this.status        = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

// ─── asyncHandler ─────────────────────────────────────
import type { Request, Response, NextFunction, RequestHandler } from 'express'

type AsyncFn = (
  req:  Request,
  res:  Response,
  next: NextFunction
) => Promise<unknown>

export const asyncHandler = (fn: AsyncFn): RequestHandler =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }