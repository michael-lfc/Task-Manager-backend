import { Request, Response } from "express";
import { asyncHandler, AppError } from "../utils/appError.js";

import {
  getUserNotifications,
  markNotificationAsRead,
  markAllAsRead,
  getUnreadCount,
} from "../services/notificationService.js";

// ─────────────────────────────────────────────
// GET ALL NOTIFICATIONS
// ─────────────────────────────────────────────
export const getMyNotifications = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);

    const notifications = await getUserNotifications(
      req.user._id.toString()
    );

    res.status(200).json({
      status: "success",
      results: notifications.length,
      data: {
        notifications,
      }
    });
  }
);

// ─────────────────────────────────────────────
// MARK SINGLE NOTIFICATION AS READ
// ─────────────────────────────────────────────
export const markNotificationRead = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);

    const notificationId = req.params.id as string;

    if (!notificationId) {
      throw new AppError("Notification ID is required", 400);
    }
    
    const updated = await markNotificationAsRead(
      notificationId,
      req.user._id.toString()
    );

    if (!updated) {
      throw new AppError("Notification not found", 404);
    }

    res.status(200).json({
      status: "success",
      data: updated,
    });
  }
);

// ─────────────────────────────────────────────
// MARK ALL AS READ
// ─────────────────────────────────────────────
export const markAllNotificationsRead = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);

    await markAllAsRead(req.user._id.toString());

    res.status(200).json({
      status: "success",
      message: "All notifications marked as read",
    });
  }
);

// ─────────────────────────────────────────────
// GET UNREAD COUNT
// ─────────────────────────────────────────────
export const getUnreadNotificationCount = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Not authenticated", 401);

    const count = await getUnreadCount(req.user._id.toString());

    res.status(200).json({
      status: "success",
      data: {
        unreadCount: count,
      },
    });
  }
);