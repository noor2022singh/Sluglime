import { Schema, model, models, Types } from 'mongoose';

export type UserRole = 'student' | 'teacher';

export type UserDocument = {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  college: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

const userSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['student', 'teacher'], required: true },
    college: { type: Schema.Types.ObjectId, ref: 'College', required: true }
  },
  { timestamps: true }
);

const User = models.User || model<UserDocument>('User', userSchema);

export default User;
