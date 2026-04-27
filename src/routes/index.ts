import { Router }            from 'express'
import authRoutes            from './auth.routes.js'
import projectRoutes         from './project.routes.js'
import taskRoutes            from './task.routes.js'
import analyticsRoutes       from './analytics.routes.js'
import notificationRoutes    from './notification.routes.js'

const router = Router()

// ─── Mount Routes ─────────────────────────────────────
router.use('/auth',          authRoutes)
router.use('/projects',      projectRoutes)
router.use('/tasks',         taskRoutes)
router.use('/analytics',     analyticsRoutes)
router.use('/notifications', notificationRoutes)

export default router