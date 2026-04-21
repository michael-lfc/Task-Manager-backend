import { Router }                               from 'express'
import { register, login, getMe, updateMe }     from '../controllers/authController.js'
import { protect }                              from '../middleware/auth.js'
import { validate }                             from '../middleware/validate.js'
import { registerSchema, loginSchema, updateMeSchema } from '../validators/auth.validator.js'

const router = Router()

// ─── Public Routes ────────────────────────────────────
router.post('/register', validate(registerSchema), register)
router.post('/login',    validate(loginSchema),    login)

// ─── Protected Routes ─────────────────────────────────
router.get('/me',   protect,                        getMe)
router.patch('/me', protect, validate(updateMeSchema), updateMe)

export default router