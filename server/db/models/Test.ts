import mongoose, { Document } from 'mongoose';

export interface IQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  explanation?: string; // Optional explanation for answers
}

export interface ITest extends Document {
  title: string;
  description: string;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  questions: IQuestion[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean; // To control test availability
  tags: string[]; // For better categorization
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced'; // Overall test difficulty
}

const testSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Test title is required'],
    trim: true,
    maxlength: [100, 'Test title cannot be more than 100 characters'],
  },
  description: {
    type: String,
    required: [true, 'Test description is required'],
    maxlength: [1000, 'Description cannot be more than 1000 characters'],
  },
  duration: {
    type: Number,
    required: [true, 'Test duration is required'],
    min: [1, 'Duration must be at least 1 minute'],
  },
  totalMarks: {
    type: Number,
    required: [true, 'Total marks are required'],
    min: [1, 'Total marks must be at least 1'],
  },
  passingMarks: {
    type: Number,
    required: [true, 'Passing marks are required'],
    min: [1, 'Passing marks must be at least 1'],
    validate: {
      validator: function(this: any, value: number) {
        // During updates, this.totalMarks might not be available
        // so we need to check the value exists before comparing
        return this.totalMarks === undefined || value <= this.totalMarks;
      },
      message: 'Passing marks cannot exceed total marks'
    }
  },
  questions: [{
    question: {
      type: String,
      required: [true, 'Question is required'],
    },
    options: [{
      type: String,
      required: [true, 'Options are required'],
    }],
    correctAnswer: {
      type: String,
      required: [true, 'Correct answer is required'],
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
    },
    explanation: {
      type: String,
      default: ''
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Test creator is required'],
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  difficultyLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  }
}, {
  timestamps: true,
});

// Create text index for full-text search
testSchema.index(
  { title: 'text', description: 'text', 'questions.question': 'text' },
  { weights: { title: 10, description: 5, 'questions.question': 1 } }
);

// Create compound indexes for optimized queries
testSchema.index({ createdBy: 1, createdAt: -1 }); // Fast lookup of tests by creator
testSchema.index({ difficultyLevel: 1, isActive: 1 }); // Fast filtering by difficulty and status
testSchema.index({ tags: 1 }); // Fast search by tags

// Create a method to get test statistics
testSchema.methods.getStats = async function() {
  const TestResult = mongoose.model('TestResult');
  
  // Use aggregation pipeline to get statistics
  const stats = await TestResult.aggregate([
    { $match: { test: this._id } },
    { $group: {
        _id: null,
        avgScore: { $avg: '$score' },
        maxScore: { $max: '$score' },
        minScore: { $min: '$score' },
        totalAttempts: { $sum: 1 },
        passCount: { 
          $sum: { 
            $cond: [
              { $gte: ['$score', this.passingMarks] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);
  
  return stats.length > 0 ? stats[0] : {
    avgScore: 0,
    maxScore: 0,
    minScore: 0,
    totalAttempts: 0,
    passCount: 0
  };
};

export const Test = mongoose.model<ITest>('Test', testSchema); 