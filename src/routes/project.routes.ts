import { Router } from 'express'
import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
} from '../controllers/projectController.js'

import { protect } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

import {
  createProjectSchema,
  updateProjectSchema,
  projectIdSchema,
  addMemberSchema,
  removeMemberSchema,
} from '../validators/project.validator.js'

const router = Router()

router.use(protect)

// ─── PROJECT COLLECTION ─────────────────────
router
  .route('/')
  .get(getProjects)
  .post(validate(createProjectSchema), createProject)

// ─── MEMBERS ────────────────────────────────
router.post(
  '/:id/members',
  validate(addMemberSchema),
  addMember
)

router.delete(
  '/:id/members',
  validate(removeMemberSchema),
  removeMember
)

// ─── SINGLE PROJECT ─────────────────────────
router
  .route('/:id')
  .get(validate(projectIdSchema), getProject)
  .patch(
    validate(projectIdSchema),
    validate(updateProjectSchema),
    updateProject
  )
  .delete(validate(projectIdSchema), deleteProject)

export default router