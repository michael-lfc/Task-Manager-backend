import { Router }             from 'express'
import {
  createTask,
  getTasksByProject,
  getTask,
  updateTask,
  deleteTask,
  addComment,
  deleteComment,
  reorderTasks,
}                             from '../controllers/taskController.js'
import { protect }            from '../middleware/auth.js'
import { validate }           from '../middleware/validate.js'
import {
  createTaskSchema,
  updateTaskSchema,
  taskIdSchema,
  tasksByProjectSchema,
  addCommentSchema,
}                             from '../validators/task.validator.js'

const router = Router()

// ─── All Task Routes Require Authentication ───────────
router.use(protect)

// ─── Collection Routes ────────────────────────────────
router.post(
  '/',
  validate(createTaskSchema),
  createTask
)

// ─── Get Tasks by Project ─────────────────────────────
// Must be before /:id to avoid routing conflict
router.get(
  '/project/:projectId',
  validate(tasksByProjectSchema),
  getTasksByProject
)

// ─── Reorder Task ─────────────────────────────────────
// Must be before /:id to avoid routing conflict
router.patch(
  '/:id/reorder',
  validate(taskIdSchema),
  reorderTasks
)

// ─── Comment Routes ───────────────────────────────────
// Must be before /:id to avoid routing conflict
router.post(
  '/:id/comments',
  validate(taskIdSchema),
  validate(addCommentSchema),
  addComment
)

router.delete(
  '/:id/comments/:commentId',
  validate(taskIdSchema),
  deleteComment
)

// ─── Single Resource Routes ───────────────────────────
router
  .route('/:id')
  .get(validate(taskIdSchema),    getTask)
  .patch(
    validate(taskIdSchema),
    validate(updateTaskSchema),
    updateTask
  )
  .delete(validate(taskIdSchema), deleteTask)

export default router