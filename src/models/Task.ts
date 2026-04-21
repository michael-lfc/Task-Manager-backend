import mongoose, { Schema, Model, HydratedDocument } from 'mongoose'
import type { TaskStatus, Priority }                  from '../types/index.js'

// ─── Comment Interface ────────────────────────────────
export interface IComment {
  _id:       mongoose.Types.ObjectId
  author:    mongoose.Types.ObjectId
  body:      string
  createdAt: Date
}

// ─── Task Interface ───────────────────────────────────
export interface ITask {
  title:           string
  description?:    string
  status:          TaskStatus
  priority:        Priority
  project:         mongoose.Types.ObjectId
  assignee?:       mongoose.Types.ObjectId
  reporter:        mongoose.Types.ObjectId
  tags:            string[]
  dueDate?:        Date
  estimatedHours?: number
  loggedHours:     number
  comments:        IComment[]
  position:        number
  createdAt:       Date
  updatedAt:       Date
}

// ─── Hydrated Types ───────────────────────────────────
export type TaskDocument    = HydratedDocument<ITask>
export type CommentDocument = HydratedDocument<IComment>

// ─── Comment Schema ───────────────────────────────────
const commentSchema = new Schema<IComment>(
  {
    author: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Comment author is required'],
    },
    body: {
      type:      String,
      required:  [true, 'Comment body is required'],
      maxlength: [2000, 'Comment must be under 2000 characters'],
      trim:      true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        // delete ret.__v
        // return ret
        const { __v, ...rest } = ret
        return rest
      },
    },
  }
)

// ─── Task Schema ──────────────────────────────────────
const taskSchema = new Schema<ITask>(
  {
    title: {
      type:      String,
      required:  [true, 'Task title is required'],
      trim:      true,
      maxlength: [200, 'Title must be under 200 characters'],
    },
    description: {
      type:      String,
      maxlength: [5000, 'Description must be under 5000 characters'],
    },
    status: {
      type:    String,
      enum:    ['todo', 'in-progress', 'in-review', 'done'],
      default: 'todo',
    },
    priority: {
      type:    String,
      enum:    ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    project: {
      type:     Schema.Types.ObjectId,
      ref:      'Project',
      required: [true, 'Task must belong to a project'],
    },
    assignee: {
      type: Schema.Types.ObjectId,
      ref:  'User',
    },
    reporter: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Task must have a reporter'],
    },
    tags: [
      {
        type:      String,
        trim:      true,
        lowercase: true,
      },
    ],
    dueDate: {
      type: Date,
    },
    estimatedHours: {
      type: Number,
      min:  [0, 'Estimated hours cannot be negative'],
    },
    loggedHours: {
      type:    Number,
      min:     [0, 'Logged hours cannot be negative'],
      default: 0,
    },
    comments: [commentSchema],
    position: {
      type:    Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        // delete ret.__v
        // return ret
        const { __v, ...rest } = ret
        return rest
      },
    },
  }
)

// ─── Virtuals ─────────────────────────────────────────
taskSchema.virtual('isOverdue').get(function (this: TaskDocument) {
  if (!this.dueDate) return false
  return this.dueDate < new Date() && this.status !== 'done'
})

taskSchema.virtual('commentCount').get(function (this: TaskDocument) {
  return this.comments.length
})

// ─── Indexes ──────────────────────────────────────────
taskSchema.index({ project: 1, status: 1, position: 1 })
taskSchema.index({ assignee: 1, status: 1 })
taskSchema.index({ reporter: 1 })
taskSchema.index({ title: 'text', description: 'text' })

// ─── Model ────────────────────────────────────────────
const Task: Model<ITask> = mongoose.model<ITask>('Task', taskSchema)

export default Task