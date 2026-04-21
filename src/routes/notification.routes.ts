// import { Router } from "express";

// import authRoutes from "./auth.routes.js";
// // import projectRoutes from "./project.routes.js";
// // import taskRoutes from "./task.routes.js";
// import notificationRoutes from "./notification.routes.js";

// const router = Router();

// // ─────────────────────────────────────────────
// // ROUTE REGISTRATION
// // ─────────────────────────────────────────────
// router.use("/auth", authRoutes);
// // router.use("/projects", projectRoutes);
// // router.use("/tasks", taskRoutes);
// router.use("/notifications", notificationRoutes);

// export default router;

import { Router } from "express";
import { protect } from "../middleware/auth.js";

import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadNotificationCount,
} from "../controllers/notificationController.js";

const router = Router();

// ✅ middleware
router.use(protect);

// ✅ routes
router.get("/", getMyNotifications);
router.get("/unread-count", getUnreadNotificationCount);
router.patch("/read-all", markAllNotificationsRead);
router.patch("/:id/read", markNotificationRead);

export default router;