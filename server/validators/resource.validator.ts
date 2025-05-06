import { body, param } from 'express-validator';

export const createResourceValidator = [
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
  
  body('type')
    .isIn(['document', 'video', 'link', 'quiz'])
    .withMessage('Type must be document, video, link, or quiz'),
  
  body('url')
    .trim()
    .notEmpty()
    .withMessage('URL is required')
    .isURL()
    .withMessage('Please provide a valid URL'),
  
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required'),
  
  body('tags')
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('tags.*')
    .trim()
    .notEmpty()
    .withMessage('Tag cannot be empty'),
];

export const updateResourceValidator = [
  param('id')
    .isMongoId()
    .withMessage('Invalid resource ID'),
  
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3 })
    .withMessage('Title must be at least 3 characters long'),
  
  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Description cannot be empty'),
  
  body('type')
    .optional()
    .isIn(['document', 'video', 'link', 'quiz'])
    .withMessage('Type must be document, video, link, or quiz'),
  
  body('url')
    .optional()
    .trim()
    .isURL()
    .withMessage('Please provide a valid URL'),
  
  body('category')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Category cannot be empty'),
  
  body('tags')
    .optional()
    .isArray()
    .withMessage('Tags must be an array'),
  
  body('tags.*')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Tag cannot be empty'),
]; 