import { Request, Response, NextFunction } from 'express';
import { User, Test, TestResult } from '../db/models';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../middleware/error.middleware';
import { getCategoryPerformance, getTimeAnalysis, getRecommendedResources } from '../utils/aggregations';

export const getStudents = catchAsync(async (req: Request, res: Response) => {
  // Get all students with their basic info
  const students = await User.find({ role: 'student' })
    .select('name email createdAt')
    .sort({ createdAt: -1 })
    .lean();

  // Get test statistics for each student
  const studentsWithStats = await Promise.all(
    students.map(async (student) => {
      // Get all test results for this student
      const testResults = await TestResult.find({ student: student._id })
        .sort({ createdAt: -1 })
        .lean();

      // Calculate statistics
      const testsTaken = testResults.length;
      const averageScore = testsTaken > 0
        ? testResults.reduce((acc, result) => acc + result.score, 0) / testsTaken
        : 0;

      // Get the most recent test result for last active date
      const lastActive = testsTaken > 0
        ? testResults[0].createdAt
        : student.createdAt;

      // Get test categories and their scores
      const testCategories = await Promise.all(
        testResults.map(async (result) => {
          const test = await Test.findById(result.test).select('questions.category').lean();
          return test?.questions[0]?.category || 'Uncategorized';
        })
      );

      // Calculate category-wise performance
      const categoryScores = testCategories.reduce((acc, category, index) => {
        if (!acc[category]) {
          acc[category] = {
            total: 0,
            count: 0,
          };
        }
        acc[category].total += testResults[index].score;
        acc[category].count += 1;
        return acc;
      }, {} as Record<string, { total: number; count: number }>);

      const categoryPerformance = Object.entries(categoryScores).map(([category, { total, count }]) => ({
        category,
        averageScore: Math.round(total / count),
      }));

      return {
        _id: student._id,
        name: student.name,
        email: student.email,
        testsTaken,
        averageScore: Math.round(averageScore),
        lastActive,
        categoryPerformance,
      };
    })
  );

  res.status(200).json({
    status: 'success',
    data: {
      students: studentsWithStats,
    },
  });
});

export const getAdminStats = catchAsync(async (req: Request, res: Response) => {
  // Get total counts
  const totalStudents = await User.countDocuments({ role: 'student' });
  const totalTests = await Test.countDocuments();
  
  // Get all test results
  const testResults = await TestResult.find().lean();
  
  // Calculate average score
  const averageScore = testResults.length > 0
    ? testResults.reduce((acc, result) => acc + result.score, 0) / testResults.length
    : 0;

  // Count active students (those who have taken a test in the last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const activeStudents = await TestResult.distinct('student', {
    createdAt: { $gte: thirtyDaysAgo }
  });
  const activeStudentCount = activeStudents.length;

  // Get category-wise statistics
  const testCategories = await Test.find().select('questions.category').lean();
  const categoryStats = testCategories.reduce((acc, test) => {
    test.questions.forEach(question => {
      const category = question.category || 'Uncategorized';
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category]++;
    });
    return acc;
  }, {} as Record<string, number>);

  res.status(200).json({
    status: 'success',
    data: {
      totalStudents,
      totalTests,
      averageScore: Math.round(averageScore),
      activeStudents,
      categoryStats,
    },
  });
});

export const getUserPerformance = catchAsync(async (req: Request, res: Response) => {
  // Using our advanced aggregation pipeline utility
  const [categoryPerformance, timeAnalysis, recommendedResources] = await Promise.all([
    getCategoryPerformance(req.user._id),
    getTimeAnalysis(req.user._id),
    getRecommendedResources(req.user._id, 3)
  ]);
  
  // Calculate overall statistics from the detailed category performance
  const testsAttempted = await TestResult.countDocuments({ student: req.user._id });
  
  // Calculate average score across all categories
  const totalQuestionsAnswered = categoryPerformance.reduce((acc, cat) => acc + cat.totalQuestions, 0);
  const totalCorrectAnswers = categoryPerformance.reduce((acc, cat) => acc + cat.correctAnswers, 0);
  const averageScore = totalQuestionsAnswered > 0
    ? Math.round((totalCorrectAnswers / totalQuestionsAnswered) * 100)
    : 0;
  
  // Format category performance for the expected response format
  const formattedCategoryPerformance = categoryPerformance.map(category => ({
    category: category.category,
    score: Math.round(category.avgScore)
  }));
  
  // Calculate time spent
  const testResults = await TestResult.find({ student: req.user._id });
  const totalTimeSpent = testResults.reduce((acc, result) => {
    const duration = new Date(result.endTime).getTime() - new Date(result.startTime).getTime();
    return acc + duration;
  }, 0);
  const hours = Math.floor(totalTimeSpent / (1000 * 60 * 60));
  const minutes = Math.floor((totalTimeSpent % (1000 * 60 * 60)) / (1000 * 60));
  const timeSpent = `${hours}h ${minutes}m`;

  // Sort categories to identify strengths and weaknesses
  const sortedCategories = [...formattedCategoryPerformance].sort((a, b) => b.score - a.score);
  
  // Get top 2 strongest subjects (with fallback logic if there aren't enough categories)
  const strongSubjects = sortedCategories.filter(cat => cat.score === 100).slice(0, 2).map(cat => cat.category);
  if (strongSubjects.length < 2) {
    const additionalStrong = sortedCategories
      .filter(cat => cat.score < 100)
      .slice(0, 2 - strongSubjects.length)
      .map(cat => cat.category);
    strongSubjects.push(...additionalStrong);
  }
  
  // Get weak subjects (only where score < 100%)
  const weakCategories = sortedCategories.filter(cat => cat.score < 100);
  const weakSubjects = weakCategories.length > 0 
    ? weakCategories.slice(-Math.min(2, weakCategories.length)).map(cat => cat.category)
    : [];
  
  // Return the response in the same format as before
  res.status(200).json({
    status: 'success',
    data: {
      testsAttempted,
      averageScore,
      timeSpent,
      categoryPerformance: formattedCategoryPerformance,
      strongSubjects,
      weakSubjects,
      timeAnalysis,
      // New data that can be used by the frontend if needed
      recommendedResources
    },
  });
});

// Calculate and return performance analytics for a user
export const getPerformance = catchAsync(async (req: Request, res: Response) => {
  // Get user's completed test results
  const testResults = await TestResult.find({ 
    student: req.user._id,
    status: 'completed' 
  }).populate({
    path: 'test',
    select: 'title description questions duration totalMarks passingMarks'
  });

  if (testResults.length === 0) {
    return res.status(200).json({
      status: 'success',
      data: {
        name: req.user.name,
        testsAttempted: 0,
        averageScore: 0,
        timeSpent: '0h 0m',
        strongSubjects: [],
        weakSubjects: [],
        recentTests: [],
        categoryPerformance: [],
        topicBreakdown: [],
        answerDistribution: {
          correct: 0,
          incorrect: 0,
          unattempted: 0
        },
        improvementAreas: []
      }
    });
  }

  // Calculate basic stats
  const testsAttempted = testResults.length;
  const averageScore = testResults.reduce((acc, result) => acc + result.score, 0) / testsAttempted;
  
  // Calculate time spent (in minutes)
  const totalMinutes = testResults.reduce((acc, result) => {
    const startTime = new Date(result.startTime).getTime();
    const endTime = new Date(result.endTime).getTime();
    return acc + (endTime - startTime) / (1000 * 60);
  }, 0);
  
  const hours = Math.floor(totalMinutes / 60);
  const minutes = Math.floor(totalMinutes % 60);
  const timeSpent = `${hours}h ${minutes}m`;

  // Get recent tests (last 5)
  const recentTests = testResults
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map(result => ({
      id: result._id ? result._id.toString() : '',
      name: result.test && typeof result.test === 'object' && 'title' in result.test ? 
        result.test.title : 'Unknown Test',
      score: result.score,
      date: result.createdAt.toISOString().split('T')[0],
      timeSpent: Math.round((new Date(result.endTime).getTime() - new Date(result.startTime).getTime()) / (1000 * 60)) + 'm'
    }));

  // Calculate category performance
  const categoryScores: Record<string, {correct: number, total: number}> = {};
  let totalCorrect = 0;
  let totalIncorrect = 0;
  let totalQuestions = 0;
  
  // Gather topic performance data
  const topicPerformance: Record<string, {correct: number, total: number}> = {};
  
  testResults.forEach(result => {
    // Access populated test data with proper typing
    const test = result.test as any;
    
    result.answers.forEach((answer, index) => {
      if (!test || !test.questions || index >= test.questions.length) return;
      
      const question = test.questions[index];
      if (!question) return; // Skip if question not found
      
      const category = question.category;
      
      // Update category scores
      if (!categoryScores[category]) {
        categoryScores[category] = { correct: 0, total: 0 };
      }
      
      if (answer.isCorrect) {
        categoryScores[category].correct += 1;
        totalCorrect += 1;
      } else {
        totalIncorrect += 1;
      }
      
      categoryScores[category].total += 1;
      totalQuestions += 1;
      
      // Update topic performance
      if (!topicPerformance[category]) {
        topicPerformance[category] = { correct: 0, total: 0 };
      }
      
      topicPerformance[category].total += 1;
      if (answer.isCorrect) {
        topicPerformance[category].correct += 1;
      }
    });
  });
  
  // Format category performance for charts
  const categoryPerformance = Object.entries(categoryScores).map(([category, data]) => ({
    category,
    score: Math.round((data.correct / data.total) * 100)
  }));
  
  // Format topic breakdown for pie chart
  const topicBreakdown = Object.entries(topicPerformance).map(([name, data]) => ({
    name,
    value: Math.round((data.correct / data.total) * 100)
  }));
  
  // Calculate answer distribution for pie chart
  const answerDistribution = [
    { name: 'Correct Answers', value: totalCorrect },
    { name: 'Incorrect Answers', value: totalIncorrect },
    { name: 'Unattempted', value: totalQuestions - (totalCorrect + totalIncorrect) }
  ];
  
  // Identify strengths and weaknesses
  const topicScores = Object.entries(topicPerformance).map(([topic, data]) => ({
    topic,
    accuracy: Math.round((data.correct / data.total) * 100)
  }));
  
  const sortedTopics = [...topicScores].sort((a, b) => b.accuracy - a.accuracy);
  
  // Get topics with 100% accuracy for strength
  const strongSubjects = sortedTopics.filter(item => item.accuracy === 100).slice(0, 3).map(item => item.topic);
  
  // If there aren't enough 100% topics, add the next best ones
  if (strongSubjects.length < 3) {
    const additionalStrong = sortedTopics
      .filter(item => item.accuracy < 100)
      .slice(0, 3 - strongSubjects.length)
      .map(item => item.topic);
    
    strongSubjects.push(...additionalStrong);
  }
  
  // Only include topics with accuracy < 100% as weak subjects
  const weakTopics = sortedTopics.filter(item => item.accuracy < 100);
  
  // Take the 3 lowest scoring topics as weak subjects, but only if they have accuracy < 100%
  const weakSubjects = weakTopics.length > 0 
    ? weakTopics.slice(-Math.min(3, weakTopics.length)).map(item => item.topic)
    : []; // Empty array if all topics have 100% accuracy
  
  // Generate improvement areas (directly from weakSubjects to ensure consistency)
  const improvementAreas = weakSubjects.map(topic => {
    const topicData = topicScores.find(item => item.topic === topic);
    return {
      topic,
      performance: topicData ? topicData.accuracy : 0,
      tips: `Focus on improving your understanding of ${topic} concepts.`
    };
  });

  res.status(200).json({
    status: 'success',
    data: {
      name: req.user.name,
      testsAttempted,
      averageScore: Math.round(averageScore),
      timeSpent,
      strongSubjects,
      weakSubjects,
      recentTests,
      categoryPerformance,
      topicBreakdown,
      answerDistribution,
      improvementAreas
    }
  });
}); 