import mongoose from 'mongoose';
import { AppError } from '../middleware/error.middleware';

/**
 * Helper function to run multiple database operations in a transaction
 * This ensures all operations either succeed or fail together
 * @param operations Function containing the operations to run in a transaction
 * @returns Result of the transaction operations
 */
export const runInTransaction = async <T>(
  operations: (session: mongoose.mongo.ClientSession) => Promise<T>
): Promise<T> => {
  // Start a session
  const session = await mongoose.startSession();
  
  try {
    let result: T;
    
    // Start a transaction
    await session.withTransaction(async () => {
      // Run the operations
      result = await operations(session);
    });
    
    // Return the result
    return result!;
  } catch (error) {
    console.error('Transaction failed:', error);
    throw new AppError(
      error instanceof Error ? error.message : 'Transaction failed',
      500
    );
  } finally {
    // End the session
    await session.endSession();
  }
};

/**
 * Example usage:
 * 
 * // Delete a test and all its results in a transaction
 * export const deleteTest = catchAsync(async (req: Request, res: Response) => {
 *   const testId = req.params.id;
 * 
 *   const result = await runInTransaction(async (session) => {
 *     // Delete all test results
 *     const testResultsDeleted = await TestResult.deleteMany(
 *       { test: testId },
 *       { session }
 *     );
 * 
 *     // Delete the test itself
 *     const testDeleted = await Test.findByIdAndDelete(testId, { session });
 * 
 *     if (!testDeleted) {
 *       throw new AppError('Test not found', 404);
 *     }
 * 
 *     return { testDeleted, testResultsDeleted };
 *   });
 * 
 *   res.status(200).json({
 *     status: 'success',
 *     data: result
 *   });
 * });
 */

export default {
  runInTransaction
}; 