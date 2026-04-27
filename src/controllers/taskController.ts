import type { Request, Response } from 'express'
import { asyncHandler, AppError } from '../utils/appError.js'
import { taskService } from '../services/taskService.js'

// ─── helper: safely handle params ─────────────────────
const toStringParam = (value: string | string[]): string =>
  Array.isArray(value) ? value[0] : value

// ─── Create Task ──────────────────────────────────────
export const createTask = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new AppError('Not authenticated.', 401)

    const task = await taskService.createTask(
      req.body,
      req.user._id.toString()
    )

    res.status(201).json({
      status: 'success',
      data: { task },
    })
  }
)

// ─── Get Tasks by Project ─────────────────────────────
export const getTasksByProject = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new AppError('Not authenticated.', 401)

    const { tasks, grouped } = await taskService.getTasksByProject(
      toStringParam(req.params.projectId),
      req.user._id.toString(),
      req.query
    )

    res.status(200).json({
      status: 'success',
      data: { tasks, grouped },
    })
  }
)

// ─── Get Single Task ──────────────────────────────────
export const getTask = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new AppError('Not authenticated.', 401)

    const task = await taskService.getTask(
      toStringParam(req.params.id),
      req.user._id.toString()
    )

    res.status(200).json({
      status: 'success',
      data: { task },
    })
  }
)

// ─── Update Task ──────────────────────────────────────
export const updateTask = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new AppError('Not authenticated.', 401)

    const task = await taskService.updateTask(
      toStringParam(req.params.id),
      req.user._id.toString(),
      req.body
    )

    res.status(200).json({
      status: 'success',
      data: { task },
    })
  }
)

// ─── Delete Task ──────────────────────────────────────
export const deleteTask = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new AppError('Not authenticated.', 401)

    await taskService.deleteTask(
      toStringParam(req.params.id),
      req.user._id.toString()
    )

    res.status(204).json({
      status: 'success',
      data: null,
    })
  }
)

// ─── Add Comment (FIXED - Returns populated comment) ──
export const addComment = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new AppError('Not authenticated.', 401)

    const updatedTask = await taskService.addComment(
      toStringParam(req.params.id),
      req.user._id.toString(),
      req.body
    )

    // 🔥 FIXED: Get the last comment from the POPULATED task
    const populatedTask = updatedTask as any
    const newComment = populatedTask.comments[populatedTask.comments.length - 1]

    res.status(201).json({
      status: 'success',
      data: {
        comment: newComment,
      },
    })
  }
)

// ─── Delete Comment ───────────────────────────────────
export const deleteComment = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new AppError('Not authenticated.', 401)

    await taskService.deleteComment(
      toStringParam(req.params.id),
      toStringParam(req.params.commentId),
      req.user._id.toString()
    )

    res.status(204).json({
      status: 'success',
      data: null,
    })
  }
)

// ─── Reorder Tasks ────────────────────────────────────
export const reorderTasks = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new AppError('Not authenticated.', 401)

    await taskService.reorderTasks(
      toStringParam(req.body.projectId),
      req.user._id.toString(),
      toStringParam(req.params.id),
      req.body.status,
      req.body.position
    )

    res.status(200).json({
      status: 'success',
      message: 'Task reordered successfully.',
    })
  }
)