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
  likes: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  metadata: {
    duration?: number; // For video content
    fileSize?: number; // For documents
    pageCount?: number; // For documents
    author?: string; // For external content
    publishedDate?: Date; // For external content
    language?: string;
  };
  relatedResources?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
  lastAccessed?: Date;
}

const resourceSchema = new Schema<IResource>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: true,
      maxlength: 2000,
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
      index: true,
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
      index: true, // Index for public/private filtering
    },
    viewCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    likes: {
      type: Number,
      default: 0,
      min: 0,
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate',
      index: true, // Index for difficulty filtering
    },
    metadata: {
      duration: Number, // in seconds
      fileSize: Number, // in bytes
      pageCount: Number,
      author: String,
      publishedDate: Date,
      language: {
        type: String,
        default: 'en',
      },
    },
    relatedResources: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource'
    }],
    lastAccessed: {
      type: Date,
    }
  },
  {
    timestamps: true,
  }
);

// Create full-text search index with weighted fields
resourceSchema.index(
  { title: 'text', description: 'text', tags: 'text' }, 
  { 
    weights: { title: 10, tags: 5, description: 3 },
    name: 'resource_text_index'
  }
);

// Create compound indexes for common query patterns
resourceSchema.index({ category: 1, type: 1, difficulty: 1 }); // For filtered searches
resourceSchema.index({ tags: 1 }); // For tag-based searches
resourceSchema.index({ createdBy: 1, createdAt: -1 }); // For user's resources, sorted by date
resourceSchema.index({ viewCount: -1, isPublic: 1 }); // For popular resources
resourceSchema.index({ lastAccessed: -1 }); // For recently accessed resources

// Middleware to update lastAccessed timestamp
resourceSchema.pre('findOne', function(next) {
  // When a specific resource is fetched, update its lastAccessed timestamp
  if (!this.getOptions().skipLastAccessed) {
    const resourceId = this.getFilter()._id;
    if (resourceId) {
      mongoose.model('Resource').updateOne(
        { _id: resourceId },
        { $set: { lastAccessed: new Date() } }
      ).exec();
    }
  }
  next();
});

// Method to find similar resources based on tags and category
resourceSchema.methods.findSimilar = async function(limit = 5) {
  const Resource = mongoose.model('Resource');
  
  // Use aggregation pipeline to find similar resources
  const similarResources = await Resource.aggregate([
    // Match resources with same category or tags, but not the same resource
    { $match: { 
      $and: [
        { _id: { $ne: this._id } },
        { isPublic: true },
        { $or: [
          { category: this.category },
          { tags: { $in: this.tags } }
        ]}
      ]
    }},
    // Add a similarity score based on matching tags
    { $addFields: {
      similarityScore: {
        $sum: [
          // Match on category = 3 points
          { $cond: [{ $eq: ["$category", this.category] }, 3, 0] },
          // Match on difficulty = 2 points
          { $cond: [{ $eq: ["$difficulty", this.difficulty] }, 2, 0] },
          // Each matching tag = 1 point
          { $size: { 
            $setIntersection: ["$tags", this.tags] 
          }}
        ]
      }
    }},
    // Sort by similarity score, descending
    { $sort: { similarityScore: -1, viewCount: -1 } },
    // Limit results
    { $limit: limit },
    // Project only necessary fields
    { $project: {
      _id: 1,
      title: 1,
      description: 1,
      type: 1,
      category: 1,
      tags: 1,
      similarityScore: 1
    }}
  ]);
  
  return similarResources;
};

export const Resource = mongoose.model<IResource>('Resource', resourceSchema); 