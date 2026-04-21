import Notification from "../models/Notification.js";
import { io } from "../server.js"; // 👈 import socket

interface CreateNotificationInput {
  userId: string;
  type: string;
  message: string;
  projectId?: string;
  taskId?: string;
}

interface NotificationPayload {
  user: string;
  type: string;
  message: string;
  project?: string;
  task?: string;
}

// ─────────────────────────────────────────────
// CREATE NOTIFICATION (WITH REAL-TIME EMIT)
// ─────────────────────────────────────────────
export const createNotification = async (data: CreateNotificationInput) => {
  // ✅ Step 1: strongly typed payload
  const payload: NotificationPayload = {
    user: data.userId,
    type: data.type,
    message: data.message,
  };

  // ✅ Step 2: optional fields
  if (data.projectId) payload.project = data.projectId;
  if (data.taskId) payload.task = data.taskId;

  // ✅ Step 3: save to DB
  const notification = await Notification.create(payload);

  // ✅ Step 4: safe socket emit (only this is wrapped)
  try {
    io.to(data.userId).emit("notification", notification);
  } catch (err) {
    console.error("Socket emit failed:", err);
  }

  // ✅ Step 5: return result
  return notification;
};

// ─────────────────────────────────────────────
// GET USER NOTIFICATIONS
// ─────────────────────────────────────────────
export const getUserNotifications = async (userId: string) => {
  return await Notification.find({ user: userId })
    .sort({ createdAt: -1 })
    .limit(50);
};

// ─────────────────────────────────────────────
// MARK SINGLE NOTIFICATION AS READ
// ─────────────────────────────────────────────
export const markNotificationAsRead = async (
  notificationId: string,
  userId: string
) => {
  return await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { isRead: true },
    { new: true }
  );
};

// ─────────────────────────────────────────────
// MARK ALL AS READ
// ─────────────────────────────────────────────
export const markAllAsRead = async (userId: string) => {
  return await Notification.updateMany(
    { user: userId, isRead: false },
    { isRead: true }
  );
};

// ─────────────────────────────────────────────
// GET UNREAD COUNT
// ─────────────────────────────────────────────
export const getUnreadCount = async (userId: string) => {
  return await Notification.countDocuments({
    user: userId,
    isRead: false,
  });
};