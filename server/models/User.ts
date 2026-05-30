import mongoose, { Schema } from 'mongoose';
import type { UserRole } from '../auth/session.js';

export interface UserDoc {
  id: number;
  username: string;
  password: string;
  role: UserRole;
}

const userSchema = new Schema(
  {
    id: { type: Number, required: true, unique: true },
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ['admin', 'cashier'] },
  },
  { versionKey: false },
);

export const UserModel = mongoose.model('User', userSchema);
