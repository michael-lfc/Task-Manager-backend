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