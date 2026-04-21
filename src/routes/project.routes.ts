import { Router }          from 'express'
import {
  createProject,
  getProjects,
  getProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
}                          from '../controllers/projectController.js'
import { protect }         from '../middleware/auth.js'
import { validate }        from '../middleware/validate.js'
import {
  createProjectSchema,
  updateProjectSchema,
  projectIdSchema,
}                          from '../validators/project.validator.js'

const router = Router()

// ─── All Project Routes Require Authentication ────────
router.use(protect)

// ─── Collection Routes ────────────────────────────────
router
  .route('/')
  .get(getProjects)
  .post(validate(createProjectSchema), createProject)

// ─── Member Routes ────────────────────────────────────
// Must be registered BEFORE /:id to avoid routing conflict
router.post(
  '/:id/members/:memberId',
  validate(projectIdSchema),
  addMember
)

router.delete(
  '/:id/members/:memberId',
  validate(projectIdSchema),
  removeMember
)

// ─── Single Resource Routes ───────────────────────────
router
  .route('/:id')
  .get(validate(projectIdSchema), getProject)
  .patch(validate(projectIdSchema), validate(updateProjectSchema), updateProject)
  .delete(validate(projectIdSchema), deleteProject)

export default router