import type { Request, Response, NextFunction } from 'express'
import { z, ZodError } from 'zod'

export const validate =
  (schema: z.ZodTypeAny) =>
  (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        params: req.params,
        query: req.query,
      })
      next()
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.issues.map(e => ({
          field: e.path.join('.'),
          message: e.message,
        }))

        return res.status(400).json({
          status: 'fail',
          message: 'Validation failed',
          errors,
        })
      }
      next(err)
    }
  }