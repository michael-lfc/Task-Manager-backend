import User, { type UserDocument } from "../models/User.js";
import { AppError } from "../utils/appError.js";
import { signToken } from "../utils/jwt.js";
import { createNotification } from "./notificationService.js";

import type {
  RegisterInput,
  LoginInput,
  UpdateMeInput,
} from "../validators/auth.validator.js";

interface AuthResult {
  user: UserDocument;
  token: string;
}

// ─────────────────────────────────────────────
// REGISTER USER
// ─────────────────────────────────────────────
const register = async (body: RegisterInput): Promise<AuthResult> => {
  const { name, email, password } = body;

  // check if user exists
  const existing = await User.findOne({ email });
  if (existing) {
    throw new AppError(
      "Email already in use. Please use a different email.",
      409
    );
  }

  // create user
  const user = await User.create({ name, email, password });

  // 🔔 NOTIFICATION INTEGRATION (WELCOME MESSAGE)
  await createNotification({
    userId: user._id.toString(),
    type: "WELCOME",
    message: `Welcome to Aurum, ${user.name} 🚀`,
  });

  const token = signToken(user._id);

  return { user, token };
};

// ─────────────────────────────────────────────
// LOGIN USER
// ─────────────────────────────────────────────
const login = async (body: LoginInput): Promise<AuthResult> => {
  const { email, password } = body;

  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError("Invalid email or password.", 401);
  }

  if (!user.isActive) {
    throw new AppError(
      "This account has been deactivated. Please contact support.",
      403
    );
  }

  user.lastSeen = new Date();
  await user.save({ validateBeforeSave: false });

  const token = signToken(user._id);

  return { user, token };
};

// ─────────────────────────────────────────────
// GET CURRENT USER
// ─────────────────────────────────────────────
const getMe = async (userId: string): Promise<UserDocument> => {
  const user = await User.findById(userId);

  if (!user) throw new AppError("User not found.", 404);

  return user;
};

// ─────────────────────────────────────────────
// UPDATE CURRENT USER
// ─────────────────────────────────────────────
const updateMe = async (
  userId: string,
  body: UpdateMeInput
): Promise<UserDocument> => {
  const user = await User.findByIdAndUpdate(userId, body, {
    new: true,
    runValidators: true,
  });

  if (!user) throw new AppError("User not found.", 404);

  return user;
};

// ─────────────────────────────────────────────
// EXPORT
// ─────────────────────────────────────────────
export const authService = {
  register,
  login,
  getMe,
  updateMe,
};