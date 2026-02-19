import { Schema, model, models, Types } from 'mongoose';

export type CollegeDocument = {
  _id: Types.ObjectId;
  name: string;
  code: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
};

const collegeSchema = new Schema<CollegeDocument>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    description: { type: String }
  },
  { timestamps: true }
);

const College = models.College || model<CollegeDocument>('College', collegeSchema);

export default College;
