import mongoose, { Document, Schema } from 'mongoose';

export interface IResource extends Document {
  title: string;
  description: string;
  type: 'document' | 'video' | 'link' | 'quiz';
  url: string;
  category: string;
  tags: string[];
  createdBy: mongoose.Types.ObjectId;
  isPublic: boolean;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const resourceSchema = new Schema<IResource>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['document', 'video', 'link', 'quiz'],
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
resourceSchema.index({ category: 1, type: 1 });
resourceSchema.index({ tags: 1 });
resourceSchema.index({ createdBy: 1 });

export const Resource = mongoose.model<IResource>('Resource', resourceSchema); 