import type { Request, Response }  from 'express'
import { asyncHandler, AppError }  from '../utils/appError.js'
import { projectService }          from '../services/projectService.js'

// ─── Create Project ───────────────────────────────────
export const createProject = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new AppError('Not authenticated.', 401)

    const project = await projectService.createProject(
      req.body,
      req.user._id.toString()
    )

    res.status(201).json({
      status: 'success',
      data:   { project },
    })
  }
)

// ─── Get All Projects ─────────────────────────────────
export const getProjects = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new AppError('Not authenticated.', 401)

    const { projects, meta } = await projectService.getProjects(
      req.user._id.toString(),
      req.query
    )

    res.status(200).json({
      status: 'success',
      meta,
      data:   { projects },
    })
  }
)

// ─── Get Single Project ───────────────────────────────
export const getProject = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new AppError('Not authenticated.', 401)

    const projectId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    
    const project = await projectService.getProject(
      projectId,
      req.user._id.toString()
    )
    
    res.status(200).json({
      status: 'success',
      data:   { project },
    })
  }
)

// ─── Update Project ───────────────────────────────────
export const updateProject = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new AppError('Not authenticated.', 401)

    const projectId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id

    const project = await projectService.updateProject(
      projectId,
      req.user._id.toString(),
      req.body
    )

    res.status(200).json({
      status: 'success',
      data:   { project },
    })
  }
)

// ─── Delete Project ───────────────────────────────────
export const deleteProject = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new AppError('Not authenticated.', 401)

    const projectId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id

    await projectService.deleteProject(
      projectId,
      req.user._id.toString()
    )

    res.status(204).json({
      status: 'success',
      data:   null,
    })
  }
)

// ─── Add Member ───────────────────────────────────────
export const addMember = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new AppError('Not authenticated.', 401)

    const projectId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    const memberId = Array.isArray(req.params.memberId) ? req.params.memberId[0] : req.params.memberId

    const project = await projectService.addMember(
      projectId,
      req.user._id.toString(),
      memberId
    )

    res.status(200).json({
      status:  'success',
      message: 'Member added successfully.',
      data:    { project },
    })
  }
)

// ─── Remove Member ────────────────────────────────────
export const removeMember = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new AppError('Not authenticated.', 401)

    const projectId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
    const memberId = Array.isArray(req.params.memberId) ? req.params.memberId[0] : req.params.memberId

    const project = await projectService.removeMember(
      projectId,
      req.user._id.toString(),
      memberId
    )

    res.status(200).json({
      status:  'success',
      message: 'Member removed successfully.',
      data:    { project },
    })
  }
)