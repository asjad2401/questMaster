import mongoose from 'mongoose';
import { Test, TestResult, User, Resource } from '../db/models';

/**
 * Advanced DB utility functions using MongoDB aggregation pipelines
 */

export interface PerformanceByCategory {
  category: string;
  avgScore: number;
  totalQuestions: number;
  correctAnswers: number;
  difficultyBreakdown: {
    easy: number;
    medium: number;
    hard: number;
  };
}

export interface TimeAnalysis {
  averageTimePerQuestion: number; // in seconds
  fastestCategory: string;
  slowestCategory: string;
  timeByDifficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
  timeByCategory?: Record<string, number>;
}

/**
 * Get detailed performance breakdown by category for a student
 */
export const getCategoryPerformance = async (studentId: mongoose.Types.ObjectId): Promise<PerformanceByCategory[]> => {
  const results = await TestResult.aggregate([
    // Match only the specific student's results
    { $match: { student: studentId } },
    
    // Lookup test details
    { $lookup: {
      from: 'tests',
      localField: 'test',
      foreignField: '_id',
      as: 'testDetails'
    }},
    { $unwind: '$testDetails' },
    
    // Unwind answers to process each answer separately
    { $unwind: {
      path: '$answers',
      includeArrayIndex: 'answerIndex'
    }},
    
    // Match answer with corresponding question in the test
    { $addFields: {
      questionDetails: {
        $arrayElemAt: ['$testDetails.questions', '$answerIndex']
      }
    }},
    
    // Group by category and calculate stats
    { $group: {
      _id: '$questionDetails.category',
      totalQuestions: { $sum: 1 },
      correctAnswers: { 
        $sum: { $cond: ['$answers.isCorrect', 1, 0] }
      },
      easyQuestions: {
        $sum: { $cond: [{ $eq: ['$questionDetails.difficulty', 'easy'] }, 1, 0] }
      },
      mediumQuestions: {
        $sum: { $cond: [{ $eq: ['$questionDetails.difficulty', 'medium'] }, 1, 0] }
      },
      hardQuestions: {
        $sum: { $cond: [{ $eq: ['$questionDetails.difficulty', 'hard'] }, 1, 0] }
      },
      easyCorrect: {
        $sum: { 
          $cond: [
            { $and: [
              { $eq: ['$questionDetails.difficulty', 'easy'] },
              '$answers.isCorrect'
            ]},
            1, 0
          ]
        }
      },
      mediumCorrect: {
        $sum: { 
          $cond: [
            { $and: [
              { $eq: ['$questionDetails.difficulty', 'medium'] },
              '$answers.isCorrect'
            ]},
            1, 0
          ]
        }
      },
      hardCorrect: {
        $sum: { 
          $cond: [
            { $and: [
              { $eq: ['$questionDetails.difficulty', 'hard'] },
              '$answers.isCorrect'
            ]},
            1, 0
          ]
        }
      }
    }},
    
    // Calculate final metrics
    { $project: {
      _id: 0,
      category: '$_id',
      totalQuestions: 1,
      correctAnswers: 1,
      avgScore: { 
        $multiply: [
          { $divide: ['$correctAnswers', '$totalQuestions'] },
          100
        ]
      },
      difficultyBreakdown: {
        easy: { 
          $cond: [
            { $gt: ['$easyQuestions', 0] },
            { $multiply: [
              { $divide: ['$easyCorrect', '$easyQuestions'] },
              100
            ]},
            0
          ]
        },
        medium: { 
          $cond: [
            { $gt: ['$mediumQuestions', 0] },
            { $multiply: [
              { $divide: ['$mediumCorrect', '$mediumQuestions'] },
              100
            ]},
            0
          ]
        },
        hard: { 
          $cond: [
            { $gt: ['$hardQuestions', 0] },
            { $multiply: [
              { $divide: ['$hardCorrect', '$hardQuestions'] },
              100
            ]},
            0
          ]
        }
      }
    }},
    
    // Sort by performance, descending
    { $sort: { avgScore: -1 } }
  ]);
  
  return results;
};

/**
 * Analyze time spent on tests per category and question difficulty
 */
export const getTimeAnalysis = async (studentId: mongoose.Types.ObjectId): Promise<TimeAnalysis> => {
  const timeResults = await TestResult.aggregate([
    // Match only the specific student's results
    { $match: { student: studentId } },
    
    // Calculate test duration
    { $addFields: {
      testDuration: { 
        $divide: [
          { $subtract: ['$endTime', '$startTime'] },
          1000 // Convert to seconds
        ]
      }
    }},
    
    // Lookup test details
    { $lookup: {
      from: 'tests',
      localField: 'test',
      foreignField: '_id',
      as: 'testDetails'
    }},
    { $unwind: '$testDetails' },
    
    // Calculate average time per question
    { $addFields: {
      avgTimePerQuestion: { 
        $divide: [
          '$testDuration', 
          { $size: '$testDetails.questions' }
        ]
      },
      // Add question details
      questions: '$testDetails.questions'
    }},
    
    // Group to calculate overall statistics
    { $group: {
      _id: null,
      totalTests: { $sum: 1 },
      totalTime: { $sum: '$testDuration' },
      totalQuestions: { 
        $sum: { $size: '$questions' }
      },
      // Track difficulty breakdown using map-reduce style
      easyQuestions: {
        $sum: {
          $size: {
            $filter: {
              input: '$questions',
              as: 'question',
              cond: { $eq: ['$$question.difficulty', 'easy'] }
            }
          }
        }
      },
      mediumQuestions: {
        $sum: {
          $size: {
            $filter: {
              input: '$questions',
              as: 'question',
              cond: { $eq: ['$$question.difficulty', 'medium'] }
            }
          }
        }
      },
      hardQuestions: {
        $sum: {
          $size: {
            $filter: {
              input: '$questions',
              as: 'question',
              cond: { $eq: ['$$question.difficulty', 'hard'] }
            }
          }
        }
      },
      // Track time by category to find fastest/slowest
      categoryTimes: {
        $push: {
          k: {
            $map: {
              input: '$questions',
              as: 'q',
              in: '$$q.category'
            }
          },
          v: '$avgTimePerQuestion'
        }
      }
    }},
    
    // Project final results
    { $project: {
      _id: 0,
      averageTimePerQuestion: { 
        $divide: ['$totalTime', '$totalQuestions'] 
      },
      timeByDifficulty: {
        easy: { 
          $cond: [
            { $gt: ['$easyQuestions', 0] },
            { $multiply: [
              { $divide: ['$easyQuestions', '$totalQuestions'] },
              { $divide: ['$totalTime', '$totalQuestions'] }
            ]},
            0
          ]
        },
        medium: { 
          $cond: [
            { $gt: ['$mediumQuestions', 0] },
            { $multiply: [
              { $divide: ['$mediumQuestions', '$totalQuestions'] },
              { $divide: ['$totalTime', '$totalQuestions'] }
            ]},
            0
          ]
        },
        hard: { 
          $cond: [
            { $gt: ['$hardQuestions', 0] },
            { $multiply: [
              { $divide: ['$hardQuestions', '$totalQuestions'] },
              { $divide: ['$totalTime', '$totalQuestions'] }
            ]},
            0
          ]
        }
      }
    }}
  ]);
  
  // Process to find fastest/slowest categories
  let result: TimeAnalysis = {
    averageTimePerQuestion: 0,
    fastestCategory: 'None',
    slowestCategory: 'None',
    timeByDifficulty: {
      easy: 0,
      medium: 0,
      hard: 0
    }
  };
  
  if (timeResults.length > 0) {
    const timeData = timeResults[0];
    result.averageTimePerQuestion = timeData.averageTimePerQuestion;
    result.timeByDifficulty = timeData.timeByDifficulty;
    
    // Process category times from the aggregation results
    const categoryTimes: Record<string, number> = {};
    
    // If categoryTimes data is available, process it
    if (timeData.categoryTimes && Array.isArray(timeData.categoryTimes)) {
      timeData.categoryTimes.forEach((item: any) => {
        if (item.k && Array.isArray(item.k)) {
          item.k.forEach((category: string) => {
            if (!categoryTimes[category]) {
              categoryTimes[category] = 0;
            }
            categoryTimes[category] += item.v || 0;
          });
        }
      });
      
      // Find fastest and slowest categories
      if (Object.keys(categoryTimes).length > 0) {
        result.timeByCategory = categoryTimes;
        const categories = Object.entries(categoryTimes);
        categories.sort((a, b) => a[1] - b[1]);
        
        result.fastestCategory = categories[0][0];
        result.slowestCategory = categories[categories.length - 1][0];
      } else {
        result.fastestCategory = 'N/A';
        result.slowestCategory = 'N/A';
      }
    } else {
      result.fastestCategory = 'N/A';
      result.slowestCategory = 'N/A';
    }
  }
  
  return result;
};

/**
 * Get recommendations for resources based on student performance
 */
export const getRecommendedResources = async (studentId: mongoose.Types.ObjectId, limit = 5): Promise<any[]> => {
  // Get student's performance data to identify weak areas
  const performance = await getCategoryPerformance(studentId);
  
  // Extract categories where performance is below 70%
  const weakCategories = performance
    .filter(p => p.avgScore < 70)
    .map(p => p.category);
  
  // If no weak categories, use the lowest performing ones
  const targetCategories = weakCategories.length > 0 
    ? weakCategories 
    : performance
        .sort((a, b) => a.avgScore - b.avgScore)
        .slice(0, 2)
        .map(p => p.category);
  
  // Find resources in weak categories that haven't been viewed by the student yet
  const recommendations = await Resource.aggregate([
    // Match resources in weak categories
    { $match: { 
      category: { $in: targetCategories },
      isPublic: true 
    }},
    
    // Sort by relevance (using view count as a proxy for quality)
    { $sort: { viewCount: -1 } },
    
    // Limit results
    { $limit: limit },
    
    // Project only relevant fields
    { $project: {
      _id: 1,
      title: 1,
      description: 1,
      type: 1,
      url: 1,
      category: 1,
      tags: 1
    }}
  ]);
  
  return recommendations;
};

/**
 * Generate admin dashboard statistics using multiple aggregation pipelines
 */
export const getAdminDashboardStats = async () => {
  // This uses promise.all to run multiple aggregations in parallel
  const [userStats, testStats, resourceStats] = await Promise.all([
    // User statistics
    User.aggregate([
      { $group: {
        _id: '$role',
        count: { $sum: 1 },
        // Count active users (based on account status)
        active: { 
          $sum: { $cond: [{ $eq: ['$accountStatus', 'active'] }, 1, 0] }
        }
      }},
      // Reshape for easier client consumption
      { $project: {
        _id: 0,
        role: '$_id',
        count: 1,
        active: 1,
        inactive: { $subtract: ['$count', '$active'] }
      }}
    ]),
    
    // Test statistics with OLAP cube-like multidimensional analysis
    TestResult.aggregate([
      // Group by test and calculate performance metrics
      { $group: {
        _id: '$test',
        attempts: { $sum: 1 },
        avgScore: { $avg: '$score' },
        highScore: { $max: '$score' },
        lowScore: { $min: '$score' }
      }},
      
      // Lookup test details
      { $lookup: {
        from: 'tests',
        localField: '_id',
        foreignField: '_id',
        as: 'testDetails'
      }},
      { $unwind: '$testDetails' },
      
      // Group by test difficulty for OLAP-style analysis
      { $group: {
        _id: '$testDetails.difficultyLevel',
        testCount: { $sum: 1 },
        totalAttempts: { $sum: '$attempts' },
        avgScoreByDifficulty: { $avg: '$avgScore' }
      }},
      
      // Reshape for client consumption
      { $project: {
        _id: 0,
        difficulty: '$_id',
        testCount: 1,
        totalAttempts: 1,
        attemptsPerTest: { $divide: ['$totalAttempts', '$testCount'] },
        avgScore: '$avgScoreByDifficulty'
      }}
    ]),
    
    // Resource statistics grouped by type
    Resource.aggregate([
      { $group: {
        _id: '$type',
        count: { $sum: 1 },
        avgViews: { $avg: '$viewCount' },
        totalViews: { $sum: '$viewCount' }
      }},
      { $sort: { count: -1 } },
      { $project: {
        _id: 0,
        type: '$_id',
        count: 1,
        avgViews: 1,
        totalViews: 1
      }}
    ])
  ]);
  
  return {
    users: userStats,
    tests: testStats,
    resources: resourceStats
  };
};

/**
 * Create a heatmap of student activity based on test taking time
 */
export const getActivityHeatmap = async () => {
  const results = await TestResult.aggregate([
    // Extract hour of day and day of week from test start times
    { $project: {
      dayOfWeek: { $dayOfWeek: '$startTime' }, // 1 for Sunday, 7 for Saturday
      hourOfDay: { $hour: '$startTime' },
      student: 1
    }},
    
    // Group by day and hour to count activity
    { $group: {
      _id: {
        day: '$dayOfWeek',
        hour: '$hourOfDay',
      },
      count: { $sum: 1 },
      uniqueStudents: { $addToSet: '$student' }
    }},
    
    // Calculate unique student count
    { $addFields: {
      studentCount: { $size: '$uniqueStudents' }
    }},
    
    // Project final structure
    { $project: {
      _id: 0,
      day: '$_id.day',
      hour: '$_id.hour',
      count: 1,
      studentCount: 1
    }},
    
    // Sort by day and hour
    { $sort: { day: 1, hour: 1 } }
  ]);
  
  // Convert to a 7x24 matrix for heatmap visualization
  const heatmapData = Array(7).fill(0).map(() => Array(24).fill(0));
  
  results.forEach(item => {
    // Convert to 0-based indices (day 0 = Sunday)
    const dayIndex = item.day - 1;
    const hourIndex = item.hour;
    heatmapData[dayIndex][hourIndex] = item.count;
  });
  
  return {
    heatmap: heatmapData,
    raw: results
  };
};

export default {
  getCategoryPerformance,
  getTimeAnalysis,
  getRecommendedResources,
  getAdminDashboardStats,
  getActivityHeatmap
}; 