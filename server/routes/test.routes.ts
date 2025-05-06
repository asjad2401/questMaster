import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import {
  createTest,
  getAllTests,
  getTest,
  submitTest,
  getTestResults,
  updateTest,
  deleteTest
} from '../controllers/test.controller';
import { protect, restrictTo } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createTestValidator, submitTestValidator } from '../validators/test.validator';
import { Test, TestResult } from '../db/models';

const router = express.Router();

// Protect all routes after this middleware
router.use(protect);

// Test routes
router.route('/')
  .get(getAllTests)
  .post(restrictTo('admin'), createTestValidator, validate, createTest);

router.route('/:id')
  .get(getTest)
  .put(restrictTo('admin'), createTestValidator, validate, updateTest)
  .delete(restrictTo('admin'), deleteTest);

// Define a separate controller function for test stats
const getTestStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const testId = req.params.id;
    
    // Get all test results for this test
    const testResults = await TestResult.find({ test: testId });
    
    // Calculate statistics
    const attempts = testResults.length;
    let totalScore = 0;
    let passCount = 0;
    
    if (attempts > 0) {
      // Get the test to determine passing marks
      const test = await Test.findById(testId);
      
      if (!test) {
        return res.status(404).json({
          status: 'error',
          message: 'No test found with that ID'
        });
      }
      
      // Calculate total score and pass count
      for (const result of testResults) {
        totalScore += result.score;
        
        if (result.score >= test.passingMarks) {
          passCount += 1;
        }
      }
    }
    
    // Calculate averages
    const averageScore = attempts > 0 ? totalScore / attempts : 0;
    const passRate = attempts > 0 ? (passCount / attempts) * 100 : 0;
    
    return res.status(200).json({
      status: 'success',
      data: {
        attempts,
        averageScore,
        passRate
      }
    });
  } catch (error) {
    next(error);
    // return res.status(500).json({
    //   status: 'error',
    //   message: 'Failed to get test stats'
    // });
  }
};

// Add test stats endpoint with extracted controller function
router.get('/:id/stats', restrictTo('admin'), getTestStats as any);   

router.post('/:id/submit', submitTestValidator, validate, submitTest);
router.get('/results', getTestResults);

export default router; 