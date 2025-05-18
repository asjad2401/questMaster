const mongoose = require('mongoose');
require('dotenv').config();

// Define MongoDB connection URI
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quest-guide';

// MongoDB connection
mongoose.connect(MONGODB_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Define full schemas to ensure we have all fields
const TestSchema = new mongoose.Schema({
  title: String,
  questions: [{
    _id: mongoose.Schema.Types.ObjectId,
    question: String,
    options: [String],
    correctAnswer: String,
    difficulty: String,
    category: String,
    explanation: String
  }]
});

const TestResultSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
  },
  score: Number,
  answers: [{
    question: mongoose.Schema.Types.ObjectId,
    selectedAnswer: String,
    isCorrect: Boolean,
  }],
  startTime: Date,
  endTime: Date,
  status: String
});

// Create models
const Test = mongoose.model('Test', TestSchema);
const TestResult = mongoose.model('TestResult', TestResultSchema);

async function checkAndFixTests() {
  try {
    // Get all tests
    const tests = await Test.find();
    console.log(`Found ${tests.length} tests`);
    
    // Check test structure
    for (const test of tests) {
      console.log(`\nChecking test: ${test.title}`);
      
      let hasChanges = false;
      
      // Check each question's correctAnswer
      for (const question of test.questions) {
        console.log(`Question: ${question.question.substring(0, 50)}...`);
        console.log(`Current correctAnswer: "${question.correctAnswer}"`);
        
        if (!question.options.includes(question.correctAnswer)) {
          console.log(`⚠️ Correct answer doesn't match any option!`);
          
          // Try to detect if it's an index
          const possibleIndex = parseInt(question.correctAnswer, 10);
          if (!isNaN(possibleIndex) && possibleIndex >= 0 && possibleIndex < question.options.length) {
            const newCorrectAnswer = question.options[possibleIndex];
            console.log(`Fixing: Setting correctAnswer to "${newCorrectAnswer}" (index ${possibleIndex})`);
            question.correctAnswer = newCorrectAnswer;
            hasChanges = true;
          } else {
            // If it's not an index, set it to the first option
            console.log(`Unable to determine correct answer format. Setting to first option: "${question.options[0]}"`);
            question.correctAnswer = question.options[0];
            hasChanges = true;
          }
        } else {
          console.log(`✅ Correct answer is valid`);
        }
      }
      
      // Save the test if changes were made
      if (hasChanges) {
        await test.save();
        console.log(`Updated test: ${test.title}`);
      } else {
        console.log(`No changes needed for test: ${test.title}`);
      }
    }
    
    // Fix test results
    await fixTestResults();
    
  } catch (error) {
    console.error('Error checking tests:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

async function fixTestResults() {
  try {
    // Get all test results
    const testResults = await TestResult.find();
    console.log(`\nFound ${testResults.length} test results`);
    
    // Process each test result
    for (const result of testResults) {
      console.log(`\nProcessing result for test ID: ${result.test}`);
      
      const test = await Test.findById(result.test);
      if (!test) {
        console.log(`⚠️ Test not found for this result! Skipping...`);
        continue;
      }
      
      // Create a map of question IDs to their correct answers
      const correctAnswersMap = {};
      test.questions.forEach(q => {
        correctAnswersMap[q._id.toString()] = q.correctAnswer;
      });
      
      let resultUpdated = false;
      let correctCount = 0;
      
      // Check and fix each answer
      for (const answer of result.answers) {
        const questionId = answer.question.toString();
        const correctAnswer = correctAnswersMap[questionId];
        
        if (!correctAnswer) {
          console.log(`⚠️ No matching question found for answer. Question ID: ${questionId}`);
          continue;
        }
        
        // Check if isCorrect flag matches the actual correctness
        const shouldBeCorrect = answer.selectedAnswer === correctAnswer;
        
        if (answer.isCorrect !== shouldBeCorrect) {
          console.log(`Fixing answer isCorrect flag: ${answer.isCorrect} -> ${shouldBeCorrect}`);
          answer.isCorrect = shouldBeCorrect;
          resultUpdated = true;
        }
        
        if (shouldBeCorrect) {
          correctCount++;
        }
      }
      
      // Update score if needed
      const totalQuestions = test.questions.length;
      const newScore = (correctCount / totalQuestions) * 100;
      
      if (Math.abs(result.score - newScore) > 0.1) { // Allow small floating point differences
        console.log(`Updating score: ${result.score.toFixed(2)}% -> ${newScore.toFixed(2)}%`);
        result.score = newScore;
        resultUpdated = true;
      }
      
      // Save the result if changes were made
      if (resultUpdated) {
        await result.save();
        console.log(`Updated test result for test: ${test.title}`);
      } else {
        console.log(`No changes needed for this result`);
      }
    }
    
    console.log('\nAll test results processed');
    
  } catch (error) {
    console.error('Error fixing test results:', error);
  }
}

// Run the function
checkAndFixTests(); 