import mongoose, { Schema, Model, HydratedDocument } from 'mongoose'
import type { ProjectStatus, Priority }               from '../types/index.js'

// ─── Interface ────────────────────────────────────────
export interface IProject {
  title:       string
  description?: string
  status:      ProjectStatus
  priority:    Priority
  color:       string
  owner:       mongoose.Types.ObjectId
  members:     mongoose.Types.ObjectId[]
  tags:        string[]
  dueDate?:    Date
  progress:    number
  budget?:     number
  spent:       number
  createdAt:   Date
  updatedAt:   Date
}

// ─── Hydrated Type ────────────────────────────────────
export type ProjectDocument = HydratedDocument<IProject>

// ─── Schema ───────────────────────────────────────────
const projectSchema = new Schema<IProject>(
  {
    title: {
      type:      String,
      required:  [true, 'Project title is required'],
      trim:      true,
      maxlength: [120, 'Title must be under 120 characters'],
    },
    description: {
      type:      String,
      maxlength: [1000, 'Description must be under 1000 characters'],
    },
    status: {
      type:    String,
      enum:    ['planning', 'active', 'on-hold', 'completed', 'archived'],
      default: 'planning',
    },
    priority: {
      type:    String,
      enum:    ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    color: {
      type:    String,
      default: '#c9a84c',
      match:   [/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex code'],
    },
    owner: {
      type:     Schema.Types.ObjectId,
      ref:      'User',
      required: [true, 'Project owner is required'],
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref:  'User',
      },
    ],
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
    progress: {
      type:    Number,
      min:     [0,   'Progress cannot be less than 0'],
      max:     [100, 'Progress cannot exceed 100'],
      default: 0,
    },
    budget: {
      type: Number,
      min:  [0, 'Budget cannot be negative'],
    },
    spent: {
      type:    Number,
      min:     [0, 'Spent cannot be negative'],
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Record<string, any>) => {
        delete ret.__v
        return ret
      },
    },
  }
)

// ─── Virtuals ─────────────────────────────────────────
projectSchema.virtual('budgetUtilization').get(function (this: ProjectDocument) {
  if (!this.budget || this.budget === 0) return null
  return Math.round(((this.spent ?? 0) / this.budget) * 100)
})

projectSchema.virtual('isOverdue').get(function (this: ProjectDocument) {
  if (!this.dueDate) return false
  return this.dueDate < new Date() && this.status !== 'completed'
})

// ─── Indexes ──────────────────────────────────────────
projectSchema.index({ owner: 1, status: 1 })
projectSchema.index({ members: 1 })
projectSchema.index({ title: 'text', description: 'text' })

// ─── Model ────────────────────────────────────────────
const Project: Model<IProject> = mongoose.model<IProject>('Project', projectSchema)

export default Project