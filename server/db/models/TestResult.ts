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
}, {
  timestamps: true,
});

export const TestResult = mongoose.model<ITestResult>('TestResult', testResultSchema); 