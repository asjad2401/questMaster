import { body, param } from 'express-validator';

export const createTestValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3 })
    .withMessage('Title must be at least 3 characters long'),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required'),
  
  body('questions')
    .isArray()
    .withMessage('Questions must be an array')
    .notEmpty()
    .withMessage('At least one question is required'),
  
  body('questions.*.question')
    .trim()
    .notEmpty()
    .withMessage('Question text is required'),
  
  body('questions.*.options')
    .isArray({ min: 2 })
    .withMessage('Each question must have at least 2 options'),
  
  body('questions.*.correctAnswer')
    .isInt({ min: 0 })
    .withMessage('Correct answer must be a valid option index'),
  
  body('questions.*.difficulty')
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty must be easy, medium, or hard'),
  
  body('questions.*.category')
    .trim()
    .notEmpty()
    .withMessage('Category is required'),
  
  body('duration')
    .isInt({ min: 1 })
    .withMessage('Duration must be at least 1 minute'),
  
  body('totalMarks')
    .isInt({ min: 1 })
    .withMessage('Total marks must be at least 1'),
  
  body('passingMarks')
    .isInt({ min: 0 })
    .withMessage('Passing marks must be a non-negative number'),
];

export const submitTestValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid test ID'),
  
  body('answers')
    .isArray()
    .withMessage('Answers must be an array')
    .notEmpty()
    .withMessage('At least one answer is required'),
  
  body('answers.*.questionId')
    .isMongoId()
    .withMessage('Invalid question ID'),
  
  body('answers.*.selectedOption')
    .isString()
    .withMessage('Selected option must be a string'),
  
  body('startTime')
    .isISO8601()
    .withMessage('Start time must be a valid date'),
  
  body('duration')
    .isInt({ min: 0 })
    .withMessage('Duration must be a non-negative number'),
]; 