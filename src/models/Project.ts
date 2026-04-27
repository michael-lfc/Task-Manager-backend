import mongoose, { Schema, Model, Types } from 'mongoose'
import type { ProjectStatus, Priority } from '../types/index.js'

// ─────────────────────────────────────────────
// Interface
// ─────────────────────────────────────────────
export interface IProject {
  title: string
  description?: string
  status: ProjectStatus
  priority: Priority
  color: string

  owner: Types.ObjectId
  members: Types.ObjectId[]

  tags: string[]
  dueDate?: Date
  progress: number
  budget?: number
  spent: number

  createdAt: Date
  updatedAt: Date
}

// ─────────────────────────────────────────────
// Schema
// ─────────────────────────────────────────────
const projectSchema = new Schema<IProject>(
  {
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      maxlength: [120, 'Title must be under 120 characters'],
    },

    description: {
      type: String,
      maxlength: [1000, 'Description must be under 1000 characters'],
    },

    status: {
      type: String,
      enum: ['planning', 'active', 'on-hold', 'completed', 'archived'],
      default: 'planning',
    },

    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },

    color: {
      type: String,
      default: '#c9a84c',
    },

    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    members: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    tags: [String],

    dueDate: Date,

    progress: {
      type: Number,
      default: 0,
    },

    budget: Number,

    spent: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  }
)

// ─────────────────────────────────────────────
// Model type (IMPORTANT FIX)
// ─────────────────────────────────────────────
export type ProjectDocument = mongoose.Document<unknown, {}, IProject> & IProject

const Project: Model<IProject> = mongoose.model<IProject>(
  'Project',
  projectSchema
)

export default Project