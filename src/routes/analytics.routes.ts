import { Router } from 'express'
import {
  getDashboardAnalytics,
  getProjectAnalytics,
  getTeamAnalytics,
  getTaskAnalytics,
} from '../controllers/analyticsController.js'
import { protect } from '../middleware/auth.js'

const router = Router()

// ─── Middleware ───────────────────────────────────────
router.use(protect)

// ─── Routes ───────────────────────────────────────────
router.get('/dashboard', getDashboardAnalytics)
router.get('/projects', getProjectAnalytics)
router.get('/team', getTeamAnalytics)
router.get('/tasks', getTaskAnalytics)

// ─── Health Check ─────────────────────────────────────
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Analytics service is running',
  })
})

export default router