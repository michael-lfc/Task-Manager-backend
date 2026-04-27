import mongoose from "mongoose"
import Project from "../models/Project.js"
import { AppError } from "../utils/appError.js"
import { createNotification } from "./notificationService.js"
import User from "../models/User.js"

import type {
  CreateProjectInput,
  UpdateProjectInput,
} from "../validators/project.validator.js"

import type { PaginationQuery } from "../types/index.js"

// ─────────────────────────────────────────────
// SAFE ID HELPER (FIXES "never" ERROR)
// ─────────────────────────────────────────────
const getId = (value: any): string =>
  typeof value === "object" && value?._id
    ? value._id.toString()
    : value.toString()

// ─────────────────────────────────────────────
// CREATE PROJECT
// ─────────────────────────────────────────────
const createProject = async (
  body: CreateProjectInput,
  ownerId: string
) => {
  const members = [
    new mongoose.Types.ObjectId(ownerId),
    ...(body.members?.map(id => new mongoose.Types.ObjectId(id)) ?? []),
  ]

  const uniqueMembers = Array.from(
    new Map(members.map(m => [m.toString(), m])).values()
  )

  const project = await Project.create({
    ...body,
    owner: new mongoose.Types.ObjectId(ownerId),
    members: uniqueMembers,
  })

  await createNotification({
    userId: ownerId,
    type: "PROJECT_CREATED",
    message: `Project "${project.title}" created 🚀`,
    projectId: project._id.toString(),
  })

  return project
}

// ─────────────────────────────────────────────
// GET PROJECTS
// ─────────────────────────────────────────────
const getProjects = async (userId: string, query: PaginationQuery) => {
  const pageNum = Number(query.page || 1)
  const limitNum = Math.min(Number(query.limit || 10), 50)
  const skip = (pageNum - 1) * limitNum

  const filter = {
    $or: [
      { owner: new mongoose.Types.ObjectId(userId) },
      { members: new mongoose.Types.ObjectId(userId) },
    ],
  }

  const [projects, total] = await Promise.all([
    Project.find(filter)
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
const getProject = async (projectId: string, userId: string) => {
  const project = await Project.findById(projectId)
    .populate("owner", "name avatar email")
    .populate("members", "name avatar email")

  if (!project) throw new AppError("Project not found", 404)

  const ownerId = getId(project.owner)

  const isMember =
    ownerId === userId ||
    project.members.some((m: any) => getId(m) === userId)

  if (!isMember) throw new AppError("Access denied", 403)

  return project
}

// ─────────────────────────────────────────────
// UPDATE PROJECT
// ─────────────────────────────────────────────
const updateProject = async (
  projectId: string,
  userId: string,
  body: UpdateProjectInput
) => {
  const project = await Project.findById(projectId)
  if (!project) throw new AppError("Project not found", 404)

  if (project.owner.toString() !== userId) {
    throw new AppError("Only owner can update", 403)
  }

  return await Project.findByIdAndUpdate(projectId, body, {
    new: true,
    runValidators: true,
  })
}

// ─────────────────────────────────────────────
// DELETE PROJECT
// ─────────────────────────────────────────────
const deleteProject = async (projectId: string, userId: string) => {
  const project = await Project.findById(projectId)
  if (!project) throw new AppError("Project not found.", 404)

  if (getId(project.owner) !== userId) {
    throw new AppError("Only owner can delete project.", 403)
  }

  for (const member of project.members as any[]) {
    await createNotification({
      userId: getId(member),
      type: "PROJECT_DELETED",
      message: `Project "${project.title}" was deleted`,
      projectId: project._id.toString(),
    })
  }

  await project.deleteOne()
}

// ─────────────────────────────────────────────
// ADD MEMBER
// ─────────────────────────────────────────────
const addMember = async (
  projectId: string,
  userId: string,
  email: string
) => {
  const project = await Project.findById(projectId)
  if (!project) throw new AppError("Project not found.", 404)

  if (getId(project.owner) !== userId) {
    throw new AppError("Only owner can add members.", 403)
  }

  // ─── FIND USER BY EMAIL ─────────────────────
  const user = await User.findOne({ email })
  if (!user) {
    throw new AppError("User not found with this email.", 404)
  }

  const memberId = user._id.toString()

  // ─── CHECK IF ALREADY MEMBER ────────────────
  const exists = project.members.some(
    (m: any) => getId(m) === memberId
  )

  if (exists) {
    throw new AppError("User already in project.", 409)
  }

  // ─── ADD MEMBER ─────────────────────────────
  project.members.push(new mongoose.Types.ObjectId(memberId))
  await project.save()

  await project.populate("members", "name avatar email")

  // ─── NOTIFICATION ───────────────────────────
  await createNotification({
    userId: memberId,
    type: "PROJECT_MEMBER_ADDED",
    message: `You were added to "${project.title}"`,
    projectId: project._id.toString(),
  })

  return project
}
// ─────────────────────────────────────────────
// REMOVE MEMBER
// ─────────────────────────────────────────────
const removeMember = async (
  projectId: string,
  userId: string,
  memberId: string
) => {
  const project = await Project.findById(projectId)
  if (!project) throw new AppError('Project not found.', 404)

  if (getId(project.owner) !== userId) {
    throw new AppError('Only owner can remove members.', 403)
  }

  if (getId(project.owner) === memberId) {
    throw new AppError('Cannot remove owner.', 400)
  }

  project.members = project.members.filter(
    (m: any) => getId(m) !== memberId
  )

  await project.save()

  // 🔥 IMPORTANT FIX
  const updatedProject = await Project.findById(projectId)
    .populate('members', 'name avatar email')
    .populate('owner', 'name avatar email')

  await createNotification({
    userId: memberId,
    type: 'PROJECT_MEMBER_REMOVED',
    message: `You were removed from "${project.title}"`,
    projectId: project._id.toString(),
  })

  return updatedProject
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