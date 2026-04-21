import mongoose from "mongoose"
import Project, { type ProjectDocument } from "../models/Project.js"
import { AppError } from "../utils/appError.js"
import { createNotification } from "./notificationService.js"

import type {
  CreateProjectInput,
  UpdateProjectInput,
} from "../validators/project.validator.js"

import type { PaginationQuery } from "../types/index.js"

// ─────────────────────────────────────────────
// CREATE PROJECT
// ─────────────────────────────────────────────
const createProject = async (
  body: CreateProjectInput,
  ownerId: string
): Promise<ProjectDocument> => {
  const members = [
    new mongoose.Types.ObjectId(ownerId),
    ...(body.members?.map(id => new mongoose.Types.ObjectId(id)) ?? []),
  ]

  const uniqueMembers = [
    ...new Map(members.map(m => [m.toString(), m])).values(),
  ]

  const project = await Project.create({
    ...body,
    owner: ownerId,
    members: uniqueMembers,
  })

  // 🔔 NOTIFICATION: PROJECT CREATED
  await createNotification({
    userId: ownerId,
    type: "PROJECT_CREATED",
    message: `Project "${project.title}" created successfully 🚀`,
    projectId: project._id.toString(),
  })

  return project
}

// ─────────────────────────────────────────────
// GET PROJECTS
// ─────────────────────────────────────────────
const getProjects = async (userId: string, query: PaginationQuery) => {
  const {
    page = "1",
    limit = "10",
    sort = "-createdAt",
    search,
  } = query

  const pageNum = Math.max(1, parseInt(page, 10))
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)))
  const skip = (pageNum - 1) * limitNum

  const filter: any = {
    $or: [
      { owner: new mongoose.Types.ObjectId(userId) },
      { members: new mongoose.Types.ObjectId(userId) },
    ],
  }

  if (search) {
    filter.$text = { $search: search }
  }

  const [projects, total] = await Promise.all([
    Project.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .populate("owner", "name avatar")
      .populate("members", "name avatar"),

    Project.countDocuments(filter),
  ])

  return {
    projects,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  }
}

// ─────────────────────────────────────────────
// GET SINGLE PROJECT
// ─────────────────────────────────────────────
const getProject = async (
  projectId: string,
  userId: string
): Promise<ProjectDocument> => {
  const project = await Project.findById(projectId)
    .populate("owner", "name avatar email")
    .populate("members", "name avatar email role")

  if (!project) throw new AppError("Project not found.", 404)

  const isMember =
    project.owner.toString() === userId ||
    project.members.some((m: any) => m.toString() === userId)

  if (!isMember) {
    throw new AppError("Access denied.", 403)
  }

  return project
}

// ─────────────────────────────────────────────
// UPDATE PROJECT (FIXED PATTERN)
// ─────────────────────────────────────────────
const updateProject = async (
  projectId: string,
  userId: string,
  body: UpdateProjectInput
): Promise<ProjectDocument> => {
  const project = await Project.findById(projectId)

  if (!project) throw new AppError("Project not found.", 404)

  if (project.owner.toString() !== userId) {
    throw new AppError("Only owner can update project.", 403)
  }

  const oldTitle = project.title

  // ✅ UPDATED DOCUMENT
  const updated = await Project.findByIdAndUpdate(
    projectId,
    body,
    { new: true, runValidators: true }
  ).populate("members", "name avatar email")

  if (updated) {
    // 🔔 NOTIFY ALL MEMBERS (use updated, NOT old project)
    for (const member of updated.members as any[]) {
      await createNotification({
        userId: member.toString(),
        type: "PROJECT_UPDATED",
        message: `Project "${updated.title}" was updated`,
        projectId: updated._id.toString(),
      })
    }
  }

  return updated as ProjectDocument
}

// ─────────────────────────────────────────────
// DELETE PROJECT (FIXED)
// ─────────────────────────────────────────────
const deleteProject = async (
  projectId: string,
  userId: string
): Promise<void> => {
  const project = await Project.findById(projectId)

  if (!project) throw new AppError("Project not found.", 404)

  if (project.owner.toString() !== userId) {
    throw new AppError("Only owner can delete project.", 403)
  }

  // 🔔 NOTIFY BEFORE DELETE (SAFE: using original document)
  for (const member of project.members as any[]) {
    await createNotification({
      userId: member.toString(),
      type: "PROJECT_DELETED",
      message: `Project "${project.title}" was deleted`,
      projectId: project._id.toString(),
    })
  }

  await project.deleteOne()
}

// ─────────────────────────────────────────────
// ADD MEMBER (FIXED)
// ─────────────────────────────────────────────
const addMember = async (
  projectId: string,
  userId: string,
  memberId: string
): Promise<ProjectDocument> => {
  const project = await Project.findById(projectId)

  if (!project) throw new AppError("Project not found.", 404)

  if (project.owner.toString() !== userId) {
    throw new AppError("Only owner can add members.", 403)
  }

  const exists = project.members.some(
    (m: any) => m.toString() === memberId
  )

  if (exists) {
    throw new AppError("User already in project.", 409)
  }

  project.members.push(new mongoose.Types.ObjectId(memberId))
  await project.save()

  await project.populate("members", "name avatar email")

  // 🔔 NOTIFICATION
  await createNotification({
    userId: memberId,
    type: "PROJECT_MEMBER_ADDED",
    message: `You were added to "${project.title}"`,
    projectId: project._id.toString(),
  })

  return project
}

// ─────────────────────────────────────────────
// REMOVE MEMBER (FIXED)
// ─────────────────────────────────────────────
const removeMember = async (
  projectId: string,
  userId: string,
  memberId: string
): Promise<ProjectDocument> => {
  const project = await Project.findById(projectId)

  if (!project) throw new AppError("Project not found.", 404)

  if (project.owner.toString() !== userId) {
    throw new AppError("Only owner can remove members.", 403)
  }

  if (project.owner.toString() === memberId) {
    throw new AppError("Cannot remove owner.", 400)
  }

  project.members = project.members.filter(
    (m: any) => m.toString() !== memberId
  )

  await project.save()

  // 🔔 NOTIFICATION
  await createNotification({
    userId: memberId,
    type: "PROJECT_MEMBER_REMOVED",
    message: `You were removed from "${project.title}"`,
    projectId: project._id.toString(),
  })

  return project
}

// ─────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────
export const projectService = {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
}