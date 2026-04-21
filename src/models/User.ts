import mongoose, { Schema, Model, HydratedDocument } from 'mongoose'
import bcrypt from 'bcryptjs'
import type { UserRole } from '../types/index.js'

// ─── Interface ────────────────────────────────────────
export interface IUser {
  name:      string
  email:     string
  password:  string
  avatar?:   string
  role:      UserRole
  isActive:  boolean
  lastSeen:  Date
  createdAt: Date
  updatedAt: Date

  comparePassword(candidatePassword: string): Promise<boolean>
}

// ─── Hydrated Type ────────────────────────────────────
// Use this type everywhere you need _id and Mongoose methods
export type UserDocument = HydratedDocument<IUser>

// ─── Schema ───────────────────────────────────────────
const userSchema = new Schema<IUser>(
  {
    name: {
      type:      String,
      required:  [true, 'Name is required'],
      trim:      true,
      minlength: [2,  'Name must be at least 2 characters'],
      maxlength: [60, 'Name must be under 60 characters'],
    },
    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
      match:     [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    password: {
      type:      String,
      required:  [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select:    false,
    },
    avatar: {
      type: String,
    },
    role: {
      type:    String,
      enum:    ['admin', 'member', 'viewer'],
      default: 'member',
    },
    isActive: {
      type:    Boolean,
      default: true,
    },
    lastSeen: {
      type:    Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret: Partial<IUser> & { __v?: number }) => {
        delete ret.password
        delete ret.__v
        return ret
      },
    },
  }
)

// ─── Hash Password Before Save ────────────────────────
userSchema.pre('save', async function (this: UserDocument) {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, 12)
})

// ─── Compare Password Method ──────────────────────────
userSchema.methods.comparePassword = async function (
  this: UserDocument,
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password)
}

// ─── Indexes ──────────────────────────────────────────
userSchema.index({ role: 1, isActive: 1 })

// ─── Model ────────────────────────────────────────────
const User: Model<IUser> = mongoose.model<IUser>('User', userSchema)

export default User