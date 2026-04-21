import { z } from 'zod'

// ─── Register ─────────────────────────────────────────
export const registerSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, 'Name is required')  // This gives the required error message
      .min(2, 'Name must be at least 2 characters')
      .max(60, 'Name must be under 60 characters'),

    email: z
      .string()
      .min(1, 'Email is required')  // Custom required message
      .email('Please enter a valid email'),

    password: z
      .string()
      .min(1, 'Password is required')  // Custom required message
      .min(8, 'Password must be at least 8 characters'),
  }),
})

// ─── Login ────────────────────────────────────────────
export const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .min(1, 'Email is required')
      .email('Please enter a valid email'),

    password: z
      .string()
      .min(1, 'Password is required'),
  }),
})

// ─── Update Me ────────────────────────────────────────
export const updateMeSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(60, 'Name must be under 60 characters')
      .optional(),  // Optional fields don't need min(1)

    avatar: z
      .string()
      .url('Avatar must be a valid URL')
      .optional(),
  }),
})

// ─── Inferred Types ───────────────────────────────────
export type RegisterInput = z.infer<typeof registerSchema>['body']
export type LoginInput    = z.infer<typeof loginSchema>['body']
export type UpdateMeInput = z.infer<typeof updateMeSchema>['body']