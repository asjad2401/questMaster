import mongoose, { Document } from 'mongoose';

export interface IQuestion {
  question: string;
  options: string[];
  correctAnswer: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
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
}

const testSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Test title is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Test description is required'],
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
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Test creator is required'],
  },
}, {
  timestamps: true,
});

export const Test = mongoose.model<ITest>('Test', testSchema); 