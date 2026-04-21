import type { Request, Response } from 'express'
import { asyncHandler, AppError } from '../utils/appError.js'
import { analyticsService } from '../services/analyticsService.js'

// ─── Helpers ───────────────────────────────────────────
const getUserId = (req: Request): string => {
  if (!req.user) throw new AppError('Not authenticated.', 401)
  return req.user._id.toString()
}

const sendResponse = (res: Response, data: unknown, statusCode = 200) => {
  res.status(statusCode).json({
    status: 'success',
    data,
  })
}

// ─── Controllers ───────────────────────────────────────
export const getDashboardAnalytics = asyncHandler(async (req, res) => {
  const userId = getUserId(req)
  const data = await analyticsService.getDashboardAnalytics(userId)
  sendResponse(res, data)
})

export const getProjectAnalytics = asyncHandler(async (req, res) => {
  const userId = getUserId(req)
  const data = await analyticsService.getProjectAnalytics(userId)
  sendResponse(res, data)
})

export const getTeamAnalytics = asyncHandler(async (req, res) => {
  const userId = getUserId(req)
  const data = await analyticsService.getTeamAnalytics(userId)
  sendResponse(res, data)
})

export const getTaskAnalytics = asyncHandler(async (req, res) => {
  const userId = getUserId(req)
  const data = await analyticsService.getTaskAnalytics(userId)
  sendResponse(res, data)
})