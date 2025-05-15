import mongoose, { Document } from 'mongoose';

export interface IAnswer {
  question: mongoose.Types.ObjectId;
  selectedAnswer: string;
  isCorrect: boolean;
}

export interface ITestResult extends Document {
  student: mongoose.Types.ObjectId;
  test: mongoose.Types.ObjectId;
  score: number;
  answers: IAnswer[];
  startTime: Date;
  endTime: Date;
  status: 'completed' | 'incomplete' | 'abandoned';
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date; // Optional TTL field for automatic document expiration
}

const testResultSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required'],
  },
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: [true, 'Test is required'],
  },
  score: {
    type: Number,
    required: [true, 'Score is required'],
    min: [0, 'Score cannot be negative'],
  },
  answers: [{
    question: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    selectedAnswer: {
      type: String,
      required: true,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
  }],
  startTime: {
    type: Date,
    required: [true, 'Start time is required'],
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required'],
  },
  status: {
    type: String,
    enum: ['completed', 'incomplete', 'abandoned'],
    default: 'completed',
  },
  expiresAt: {
    type: Date,
    default: () => {
      const date = new Date();
      date.setFullYear(date.getFullYear() + 1); // Expire after 1 year by default
      return date;
    },
    index: { expires: 0 } // TTL index - documents will be removed when current date > expiresAt
  }
}, {
  timestamps: true,
});

// Create compound indexes for optimized queries
testResultSchema.index({ student: 1, test: 1 }); // Fast lookup of student's test results
testResultSchema.index({ student: 1, createdAt: -1 }); // Fast history queries
testResultSchema.index({ test: 1, score: -1 }); // Fast leaderboard queries
testResultSchema.index({ status: 1, startTime: -1 }); // Fast queries for incomplete tests

export const TestResult = mongoose.model<ITestResult>('TestResult', testResultSchema); 