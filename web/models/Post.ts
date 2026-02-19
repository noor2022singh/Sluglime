import { Schema, model, models, Types } from 'mongoose';

type UploadedFile = {
  url: string;
  publicId: string;
  fileName: string;
  fileType: 'image' | 'pdf';
};

export type PostDocument = {
  _id: Types.ObjectId;
  author: Types.ObjectId;
  college: Types.ObjectId;
  content: string;
  files: UploadedFile[];
  isPublic: boolean;
  likes: Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
};

const uploadedFileSchema = new Schema<UploadedFile>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    fileName: { type: String, required: true },
    fileType: { type: String, enum: ['image', 'pdf'], required: true }
  },
  { _id: false }
);

const postSchema = new Schema<PostDocument>(
  {
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    college: { type: Schema.Types.ObjectId, ref: 'College', required: true },
    content: { type: String, required: true, trim: true, maxlength: 2000 },
    files: [uploadedFileSchema],
    isPublic: { type: Boolean, default: false },
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }]
  },
  { timestamps: true }
);

postSchema.index({ college: 1, createdAt: -1 });
postSchema.index({ isPublic: 1, createdAt: -1 });

const Post = models.Post || model<PostDocument>('Post', postSchema);

export default Post;
