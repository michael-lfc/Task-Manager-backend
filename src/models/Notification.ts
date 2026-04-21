import mongoose, { Schema, Model, HydratedDocument } from "mongoose";

export interface INotification {
  user: mongoose.Types.ObjectId;
  type: string;
  message: string;
  isRead: boolean;
  project?: mongoose.Types.ObjectId;
  task?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type NotificationDocument = HydratedDocument<INotification>;

const notificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    project: {
      type: Schema.Types.ObjectId,
      ref: "Project",
    },
    task: {
      type: Schema.Types.ObjectId,
      ref: "Task",
    },
  },
  { timestamps: true }
);

// performance indexes
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, isRead: 1 });

const Notification: Model<INotification> =
  mongoose.model("Notification", notificationSchema);

export default Notification;