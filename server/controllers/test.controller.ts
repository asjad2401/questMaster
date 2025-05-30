import { Request, Response, NextFunction } from 'express';
import { Test, TestResult } from '../db/models';
import { AppError } from '../middleware/error.middleware';
import { catchAsync } from '../utils/catchAsync';
import { runInTransaction } from '../utils/transactions';

export const createTest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Map over the questions to sanitize any potential issues
    const sanitizedData = {
      ...req.body,
      questions: req.body.questions.map((question: any) => {
        // Ensure the correctAnswer is properly formatted
        // If it's a numeric string like "0" or "1", convert it to the actual option value
        const correctAnswerIndex = parseInt(question.correctAnswer, 10);
        
        // Check if correctAnswer is a valid index
        if (!isNaN(correctAnswerIndex) && correctAnswerIndex >= 0 && correctAnswerIndex < question.options.length) {
          // Use the option at that index
          return {
            ...question,
            correctAnswer: question.options[correctAnswerIndex]
          };
        }
        
        // Otherwise keep as is (might already be the actual option)
        return question;
      })
    };

    const test = await Test.create({
      ...sanitizedData,
      createdBy: req.user._id,
    });

    res.status(201).json({
      status: 'success',
      data: {
        test,
      },
    });
  } catch (error) {
    console.error('Test creation error:', error);
    next(error);
  }
};

export const getAllTests = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const tests = await Test.find()
      .populate('createdBy', 'name')
      .select('-questions.correctAnswer');

    res.status(200).json({
      status: 'success',
      results: tests.length,
      data: {
        tests,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getTest = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const test = await Test.findById(req.params.id)
      .populate('createdBy', 'name')
      .select('-questions.correctAnswer');

    if (!test) {
      return next(new AppError('No test found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        test,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const submitTest = catchAsync(async (req: Request, res: Response) => {
  const test = await Test.findById(req.params.id);
  if (!test) {
    throw new AppError('No test found with that ID', 404);
  }

  const { answers, startTime, duration } = req.body;
  let marksObtained = 0;

  // Calculate marks and prepare detailed answers
  const detailedAnswers = answers.map((answer: any) => {
    const question = test.questions.find(q => (q as any)._id.toString() === answer.questionId);
    const isCorrect = question?.correctAnswer === answer.selectedOption;
    if (isCorrect) marksObtained += 1;
    
    return {
      questionId: answer.questionId,
      question: question?.question,
      correctAnswer: question?.correctAnswer,
      selectedOption: answer.selectedOption,
      isCorrect,
      options: question?.options
    };
  });

  const percentage = (marksObtained / test.questions.length) * 100;
  const passed = percentage >= test.passingMarks;

  const testResult = await TestResult.create({
    student: req.user._id,
    test: test._id,
    score: percentage,
    answers: answers.map((answer: any) => ({
      question: answer.questionId,
      selectedAnswer: answer.selectedOption,
      isCorrect: test.questions.find(q => (q as any)._id.toString() === answer.questionId)?.correctAnswer === answer.selectedOption
    })),
    startTime: new Date(startTime),
    endTime: new Date(),
    status: 'completed'
  });

  res.status(201).json({
    status: 'success',
    data: {
      testResult,
      testDetails: {
        title: test.title,
        description: test.description,
        totalQuestions: test.questions.length,
        marksObtained,
        percentage,
        passed,
        answers: detailedAnswers
      }
    },
  });
});

export const getTestResults = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const results = await TestResult.find({ user: req.user._id })
      .populate('test', 'title')
      .sort('-createdAt');

    res.status(200).json({
      status: 'success',
      results: results.length,
      data: {
        results,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateTest = catchAsync(async (req: Request, res: Response) => {
  const test = await Test.findById(req.params.id);
  
  if (!test) {
    throw new AppError('No test found with that ID', 404);
  }
  
  // Check if the user is the creator of the test or an admin
  if (req.user.role !== 'admin' && test.createdBy.toString() !== req.user._id.toString()) {
    throw new AppError('You do not have permission to update this test', 403);
  }
  
  // Validate totalMarks and passingMarks relationship
  if (req.body.passingMarks && req.body.totalMarks) {
    if (req.body.passingMarks > req.body.totalMarks) {
      throw new AppError('Passing marks cannot exceed total marks', 400);
    }
  } else if (req.body.passingMarks && !req.body.totalMarks) {
    // If updating only passingMarks, check against existing totalMarks
    if (req.body.passingMarks > test.totalMarks) {
      throw new AppError('Passing marks cannot exceed total marks', 400);
    }
  }
  
  const updatedTest = await Test.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  );
  
  res.status(200).json({
    status: 'success',
    data: {
      test: updatedTest
    }
  });
});

export const deleteTest = catchAsync(async (req: Request, res: Response) => {
  const test = await Test.findById(req.params.id);
  
  if (!test) {
    throw new AppError('No test found with that ID', 404);
  }
  
  // Check if the user is the creator of the test or an admin
  if (req.user.role !== 'admin' && test.createdBy.toString() !== req.user._id.toString()) {
    throw new AppError('You do not have permission to delete this test', 403);
  }
  
  // Also delete all test results associated with this test
  await TestResult.deleteMany({ test: req.params.id });
  
  // Delete the test
  await Test.findByIdAndDelete(req.params.id);
  
  res.status(204).json({
    status: 'success',
    data: null
  });
}); 