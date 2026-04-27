import mongoose from 'mongoose'
import Task, { type TaskDocument } from '../models/Task.js'
import Project from '../models/Project.js'
import { AppError } from '../utils/appError.js'
import { createNotification } from './notificationService.js'
import { io } from '../server.js'

import type {
  CreateTaskInput,
  UpdateTaskInput,
  AddCommentInput,
} from '../validators/task.validator.js'

import type { PaginationQuery, TaskStatus } from '../types/index.js'

//
// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
//
const assertProjectAccess = async (projectId: string, userId: string) => {
  const project = await Project.findById(projectId)

  if (!project) throw new AppError('Project not found.', 404)

  const isMember =
    project.owner.toString() === userId ||
    project.members.some(m => m.toString() === userId)

  if (!isMember) throw new AppError('Access denied.', 403)
}

// 🔥 CENTRALIZED POPULATE FUNCTION
const populateTask = (taskId: string) => {
  return Task.findById(taskId)
    .populate('assignee', 'name avatar email')
    .populate('reporter', 'name avatar email')
    .populate('comments.author', 'name avatar email')
}

const recalculateProgress = async (projectId: mongoose.Types.ObjectId) => {
  const tasks = await Task.find({ project: projectId })

  if (tasks.length === 0) {
    await Project.findByIdAndUpdate(projectId, { progress: 0 })
    return
  }

  const done = tasks.filter(t => t.status === 'done').length
  const progress = Math.round((done / tasks.length) * 100)

  await Project.findByIdAndUpdate(projectId, { progress })
}

//
// ─────────────────────────────────────────────
// CREATE TASK
// ─────────────────────────────────────────────
//
const createTask = async (
  body: CreateTaskInput,
  userId: string
): Promise<TaskDocument> => {
  await assertProjectAccess(body.project, userId)

  const task = await Task.create({
    ...body,
    reporter: userId,
  })

  // 🔔 Notify assignee if one was set (and it's not the creator)
  if (body.assignee && body.assignee !== userId) {
    createNotification({
      userId: body.assignee,
      type: 'TASK_ASSIGNED',
      message: `You were assigned to "${task.title}"`,
      projectId: body.project,
      taskId: task._id.toString(),
    }).catch(console.error)
  }

  // Return populated task
  const populatedTask = await populateTask(task._id.toString())
  return populatedTask as TaskDocument
}

//
// ─────────────────────────────────────────────
// GET TASKS BY PROJECT
// ─────────────────────────────────────────────
//
const getTasksByProject = async (
  projectId: string,
  userId: string,
  query: PaginationQuery
) => {
  await assertProjectAccess(projectId, userId)

  const { sort = 'position', search } = query

  const filter: any = {
    project: new mongoose.Types.ObjectId(projectId),
  }

  if (search) {
    filter.$text = { $search: search }
  }

  const tasks = await Task.find(filter)
    .sort(sort)
    .populate('assignee', 'name avatar')
    .populate('reporter', 'name avatar')
    .populate('comments.author', 'name avatar email')

  const grouped: Record<TaskStatus, TaskDocument[]> = {
    todo: [],
    'in-progress': [],
    'in-review': [],
    done: [],
  }

  tasks.forEach(task => {
    grouped[task.status as TaskStatus].push(task)
  })

  return { tasks, grouped }
}

//
// ─────────────────────────────────────────────
// GET SINGLE TASK
// ─────────────────────────────────────────────
//
const getTask = async (taskId: string, userId: string) => {
  const task = await populateTask(taskId)

  if (!task) throw new AppError('Task not found.', 404)

  await assertProjectAccess(task.project.toString(), userId)

  return task
}

//
// ─────────────────────────────────────────────
// ADD COMMENT
// ─────────────────────────────────────────────
//
const addComment = async (
  taskId: string,
  userId: string,
  body: AddCommentInput
): Promise<TaskDocument> => {
  const task = await Task.findById(taskId)

  if (!task) throw new AppError('Task not found.', 404)

  await assertProjectAccess(task.project.toString(), userId)

  task.comments.push({
    _id: new mongoose.Types.ObjectId(),
    author: new mongoose.Types.ObjectId(userId),
    body: body.body,
    createdAt: new Date(),
  })

  await task.save()

  const updatedTask = await populateTask(taskId)

  if (!updatedTask) {
    throw new AppError('Task not found.', 404)
  }

  io.to(updatedTask.project.toString()).emit('task:updated', updatedTask)

  // 🔔 Notify assignee AND reporter (excluding the commenter)
  const recipients = new Set<string>()

  if (updatedTask.assignee) {
    recipients.add(updatedTask.assignee._id.toString())
  }
  if (updatedTask.reporter) {
    recipients.add(updatedTask.reporter._id.toString())
  }

  recipients.delete(userId)

  for (const recipientId of recipients) {
    createNotification({
      userId: recipientId,
      type: 'TASK_COMMENT',
      message: `New comment on task "${updatedTask.title}"`,
      projectId: updatedTask.project.toString(),
      taskId: updatedTask._id.toString(),
    }).catch(console.error)
  }

  return updatedTask as TaskDocument
}

//
// ─────────────────────────────────────────────
// UPDATE TASK
// ─────────────────────────────────────────────
//
const updateTask = async (
  taskId: string,
  userId: string,
  body: UpdateTaskInput
): Promise<TaskDocument> => {
  const task = await Task.findById(taskId)

  if (!task) throw new AppError('Task not found.', 404)

  await assertProjectAccess(task.project.toString(), userId)

  const oldStatus = task.status
  const oldAssignee = task.assignee?.toString()

  const updated = await Task.findByIdAndUpdate(taskId, body, {
    new: true,
    runValidators: true,
  })

  if (!updated) throw new AppError('Task not found.', 404)

  // 🔔 TASK_UPDATED — status changed and task has an assignee
  if (body.status && body.status !== oldStatus && updated.assignee) {
    const assigneeId = updated.assignee.toString()
    if (assigneeId !== userId) {
      createNotification({
        userId: assigneeId,
        type: 'TASK_UPDATED',
        message: `Task "${updated.title}" moved to ${body.status.replace(/-/g, ' ')}`,
        projectId: updated.project.toString(),
        taskId: updated._id.toString(),
      }).catch(console.error)
    }
  }

  // 🔔 TASK_ASSIGNED — assignee changed to someone new
  if (body.assignee && body.assignee !== oldAssignee && body.assignee !== userId) {
    createNotification({
      userId: body.assignee,
      type: 'TASK_ASSIGNED',
      message: `You were assigned to "${updated.title}"`,
      projectId: updated.project.toString(),
      taskId: updated._id.toString(),
    }).catch(console.error)
  }

  if (body.status) {
    await recalculateProgress(task.project)
  }

  const populatedTask = await populateTask(taskId)
  return populatedTask as TaskDocument
}

//
// ─────────────────────────────────────────────
// DELETE TASK
// ─────────────────────────────────────────────
//
const deleteTask = async (taskId: string, userId: string) => {
  const task = await Task.findById(taskId)

  if (!task) throw new AppError('Task not found.', 404)

  await assertProjectAccess(task.project.toString(), userId)

  const projectId = task.project

  if (task.assignee && task.assignee.toString() !== userId) {
    await createNotification({
      userId: task.assignee.toString(),
      type: 'TASK_DELETED',
      message: `Task "${task.title}" was deleted`,
      projectId: task.project.toString(),
      taskId: task._id.toString(),
    })
  }

  await task.deleteOne()

  await recalculateProgress(projectId)
}

//
// ─────────────────────────────────────────────
// DELETE COMMENT
// ─────────────────────────────────────────────
//
const deleteComment = async (
  taskId: string,
  commentId: string,
  userId: string
): Promise<TaskDocument> => {
  const task = await Task.findById(taskId)

  if (!task) throw new AppError('Task not found.', 404)

  await assertProjectAccess(task.project.toString(), userId)

  const comment = task.comments.find(
    c => c._id.toString() === commentId
  )

  if (!comment) throw new AppError('Comment not found.', 404)

  if (comment.author.toString() !== userId) {
    throw new AppError('You can only delete your own comments.', 403)
  }

  task.comments = task.comments.filter(
    c => c._id.toString() !== commentId
  )

  await task.save()

  const updatedTask = await populateTask(taskId)

  if (!updatedTask) throw new AppError('Task not found.', 404)

  io.to(updatedTask.project.toString()).emit('task:updated', updatedTask)

  return updatedTask as TaskDocument
}

//
// ─────────────────────────────────────────────
// REORDER TASKS
// ─────────────────────────────────────────────
//
const reorderTasks = async (
  projectId: string,
  userId: string,
  taskId: string,
  newStatus: TaskStatus,
  newPosition: number
) => {
  await assertProjectAccess(projectId, userId)

  const task = await Task.findById(taskId)

  if (!task) throw new AppError('Task not found.', 404)

  await Task.updateMany(
    {
      project: new mongoose.Types.ObjectId(projectId),
      status: newStatus,
      position: { $gte: newPosition },
      _id: { $ne: task._id },
    },
    { $inc: { position: 1 } }
  )

  task.status = newStatus
  task.position = newPosition
  await task.save()

  await recalculateProgress(task.project)
}

//
// ─────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────
//
export const taskService = {
  createTask,
  getTasksByProject,
  getTask,
  updateTask,
  deleteTask,
  addComment,
  deleteComment,
  reorderTasks,
}