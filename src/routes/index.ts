import { Router } from "express";

import authRoutes from "./auth.routes.js";
import projectRoutes from "./project.routes.js";
import taskRoutes from "./task.routes.js";
import notificationRoutes from "./notification.routes.js";
import analyticsRoutes   from './analytics.routes.js'

const router = Router();

// ─────────────────────────────────────────────
// ROUTE REGISTRATION
// ─────────────────────────────────────────────
router.use("/auth", authRoutes);
router.use("/projects", projectRoutes);
router.use("/tasks", taskRoutes);
router.use("/notifications", notificationRoutes);
router.use('/analytics', analyticsRoutes)

export default router;