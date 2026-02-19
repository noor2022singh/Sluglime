import { Schema, model, models, Types } from 'mongoose';

export type CommentDocument = {
  _id: Types.ObjectId;
  post: Types.ObjectId;
  author: Types.ObjectId;
  content: string;
  parentCommentId?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
};

const commentSchema = new Schema<CommentDocument>(
  {
    post: { type: Schema.Types.ObjectId, ref: 'Post', required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true, trim: true, maxlength: 1000 },
    parentCommentId: { type: Schema.Types.ObjectId, ref: 'Comment', default: null }
  },
  { timestamps: true }
);

commentSchema.index({ post: 1, createdAt: 1 });
commentSchema.index({ parentCommentId: 1 });

const Comment = models.Comment || model<CommentDocument>('Comment', commentSchema);

export default Comment;
