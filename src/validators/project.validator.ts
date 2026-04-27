import { z } from 'zod'

// ─── Create Project ───────────────────────────────────
export const createProjectSchema = z.object({
  body: z.object({
    title: z
      .string({ message: 'Project title is required' })
      .trim()
      .min(1, 'Project title cannot be empty')
      .max(120, 'Title must be under 120 characters'),

    description: z
      .string()
      .max(1000, 'Description must be under 1000 characters')
      .optional(),

    status: z
      .enum(['planning', 'active', 'on-hold', 'completed', 'archived'])
      .optional(),

    priority: z
      .enum(['low', 'medium', 'high', 'critical'])
      .optional(),

    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex code e.g. #c9a84c')
      .optional(),

    members: z
      .array(
        z.string().regex(/^[a-f\d]{24}$/i, 'Each member must be a valid user ID')
      )
      .optional(),

    tags: z
      .array(
        z.string().trim().toLowerCase().max(30, 'Tag must be under 30 characters')
      )
      .optional(),

    dueDate: z
      .string()
      .datetime({ message: 'Due date must be a valid ISO date string' })
      .optional(),

    budget: z
      .number({ message: 'Budget must be a number' })
      .min(0, 'Budget cannot be negative')
      .optional(),
  }),
})

// ─── Update Project ───────────────────────────────────
export const updateProjectSchema = z.object({
  body: z.object({
    title: z
      .string()
      .trim()
      .min(1, 'Project title cannot be empty')
      .max(120, 'Title must be under 120 characters')
      .optional(),

    description: z
      .string()
      .max(1000, 'Description must be under 1000 characters')
      .optional(),

    status: z
      .enum(['planning', 'active', 'on-hold', 'completed', 'archived'])
      .optional(),

    priority: z
      .enum(['low', 'medium', 'high', 'critical'])
      .optional(),

    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex code e.g. #c9a84c')
      .optional(),

    members: z
      .array(
        z.string().regex(/^[a-f\d]{24}$/i, 'Each member must be a valid user ID')
      )
      .optional(),

    tags: z
      .array(
        z.string().trim().toLowerCase().max(30, 'Tag must be under 30 characters')
      )
      .optional(),

    dueDate: z
      .string()
      .datetime({ message: 'Due date must be a valid ISO date string' })
      .optional(),

    budget: z
      .number({ message: 'Budget must be a number' })
      .min(0, 'Budget cannot be negative')
      .optional(),

    spent: z
      .number({ message: 'Spent must be a number' })
      .min(0, 'Spent cannot be negative')
      .optional(),

    progress: z
      .number({ message: 'Progress must be a number' })
      .min(0, 'Progress cannot be less than 0')
      .max(100, 'Progress cannot exceed 100')
      .optional(),
  }),
})

// ─── Project ID Param ─────────────────────────────────
export const projectIdSchema = z.object({
  params: z.object({
    id: z
      .string()
      .regex(/^[a-f\d]{24}$/i, 'Invalid project ID'),
  }),
})

export const addMemberSchema = z.object({
  body: z.object({
    email: z
      .string({ message: 'Email is required' })
      .email('Invalid email format')
      .toLowerCase()
      .trim(),
  }),
})

export const removeMemberSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    memberId: z.string().min(1),
  }),
})

// ─── Inferred Types ───────────────────────────────────
export type CreateProjectInput = z.infer<typeof createProjectSchema>['body']
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>['body']