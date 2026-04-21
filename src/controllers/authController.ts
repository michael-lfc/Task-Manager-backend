import type { Request, Response } from 'express'
import { asyncHandler, AppError } from '../utils/appError.js'
import { authService }            from '../services/authService.js'

// ─── Register ─────────────────────────────────────────
export const register = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.register(req.body)

  res.status(201).json({
    status: 'success',
    data:   result,
  })
})

// ─── Login ────────────────────────────────────────────
export const login = asyncHandler(async (req: Request, res: Response) => {
  const result = await authService.login(req.body)

  res.status(200).json({
    status: 'success',
    data:   result,
  })
})

// ─── Get Me ───────────────────────────────────────────
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError('Not authenticated.', 401)

  const user = await authService.getMe(req.user._id.toString())

  res.status(200).json({
    status: 'success',
    data:   { user },
  })
})

// ─── Update Me ────────────────────────────────────────
export const updateMe = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new AppError('Not authenticated.', 401)

  const user = await authService.updateMe(req.user._id.toString(), req.body)

  res.status(200).json({
    status: 'success',
    data:   { user },
  })
})