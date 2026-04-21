import { z } from 'zod'

// ─── Reusable MongoDB ID ───────────────────────────────
const mongoId = (field: string) =>
  z.string().regex(/^[a-f\d]{24}$/i, `${field} must be a valid ID`)

// ─── Create Task ──────────────────────────────────────
export const createTaskSchema = z.object({
  body: z.object({
    title: z
      .string()
      .trim()
      .min(1, 'Task title cannot be empty')
      .max(200, 'Title must be under 200 characters'),

    description: z
      .string()
      .max(5000, 'Description must be under 5000 characters')
      .optional(),

    status: z
      .enum(['todo', 'in-progress', 'in-review', 'done'])
      .optional(),

    priority: z
      .enum(['low', 'medium', 'high', 'critical'])
      .optional(),

    project: mongoId('Project ID'),

    assignee: mongoId('Assignee ID').optional(),

    tags: z
      .array(
        z.string().trim().toLowerCase().max(30, 'Tag must be under 30 characters')
      )
      .optional(),

    dueDate: z
      .string()
      .datetime({ message: 'Due date must be a valid ISO date string' })
      .optional(),

    estimatedHours: z
      .number()
      .min(0, 'Estimated hours cannot be negative')
      .optional(),
  }),
})

// ─── Update Task ──────────────────────────────────────
export const updateTaskSchema = z.object({
  body: z.object({
    title: z
      .string()
      .trim()
      .min(1, 'Task title cannot be empty')
      .max(200, 'Title must be under 200 characters')
      .optional(),

    description: z
      .string()
      .max(5000, 'Description must be under 5000 characters')
      .optional(),

    status: z
      .enum(['todo', 'in-progress', 'in-review', 'done'])
      .optional(),

    priority: z
      .enum(['low', 'medium', 'high', 'critical'])
      .optional(),

    assignee: mongoId('Assignee ID').optional(),

    tags: z
      .array(
        z.string().trim().toLowerCase().max(30, 'Tag must be under 30 characters')
      )
      .optional(),

    dueDate: z
      .string()
      .datetime({ message: 'Due date must be a valid ISO date string' })
      .optional(),

    estimatedHours: z
      .number()
      .min(0, 'Estimated hours cannot be negative')
      .optional(),

    loggedHours: z
      .number()
      .min(0, 'Logged hours cannot be negative')
      .optional(),

    position: z
      .number()
      .min(0, 'Position cannot be negative')
      .optional(),
  }),
})

// ─── Task ID Param ────────────────────────────────────
export const taskIdSchema = z.object({
  params: z.object({
    id: mongoId('Task ID'),
  }),
})

// ─── Project ID Param (for get tasks by project) ──────
export const tasksByProjectSchema = z.object({
  params: z.object({
    projectId: mongoId('Project ID'),
  }),
})

// ─── Add Comment ──────────────────────────────────────
export const addCommentSchema = z.object({
  body: z.object({
    body: z
      .string()
      .trim()
      .min(1, 'Comment cannot be empty')
      .max(2000, 'Comment must be under 2000 characters'),
  }),
})

// ─── Inferred Types ───────────────────────────────────
export type CreateTaskInput = z.infer<typeof createTaskSchema>['body']
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>['body']
export type AddCommentInput = z.infer<typeof addCommentSchema>['body']