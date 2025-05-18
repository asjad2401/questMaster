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

// Define simplified schemas
const TestSchema = new mongoose.Schema({
  title: String,
  questions: [{
    question: String,
    options: [String],
    correctAnswer: String,
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
});

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
});

// Create models
const Test = mongoose.model('Test', TestSchema);
const TestResult = mongoose.model('TestResult', TestResultSchema);
const User = mongoose.model('User', UserSchema);

async function analyzeTestResults() {
  try {
    // Get all tests
    const tests = await Test.find().lean();
    console.log(`Found ${tests.length} tests`);

    // Get all test results
    const testResults = await TestResult.find().lean();
    console.log(`Found ${testResults.length} test results`);

    // Get users for reference
    const users = await User.find().lean();
    const userMap = {};
    users.forEach(user => {
      userMap[user._id.toString()] = user;
    });

    // Check for correctAnswer issues
    for (const test of tests) {
      console.log(`\nAnalyzing test: ${test.title}`);
      
      // Check if any questions have incorrect correctAnswer format
      const potentialIssues = test.questions.filter(q => 
        !q.options.includes(q.correctAnswer)
      );
      
      if (potentialIssues.length > 0) {
        console.log(`⚠️ Found ${potentialIssues.length} questions with correctAnswer not matching any option:`);
        potentialIssues.forEach((q, i) => {
          console.log(`\n  Issue #${i+1}:`);
          console.log(`  Question: ${q.question}`);
          console.log(`  Options: ${q.options.join(' | ')}`);
          console.log(`  Correct Answer: ${q.correctAnswer}`);
          
          // Check if correctAnswer might be an index
          const possibleIndex = parseInt(q.correctAnswer, 10);
          if (!isNaN(possibleIndex) && possibleIndex >= 0 && possibleIndex < q.options.length) {
            console.log(`  This appears to be an index (${possibleIndex}) referring to: ${q.options[possibleIndex]}`);
          }
        });
      } else {
        console.log(`✅ All questions have valid correctAnswer values`);
      }

      // Find results for this test
      const resultsForTest = testResults.filter(r => r.test.toString() === test._id.toString());
      if (resultsForTest.length === 0) {
        console.log(`No test results found for this test`);
        continue;
      }

      // Calculate average score
      const avgScore = resultsForTest.reduce((sum, r) => sum + r.score, 0) / resultsForTest.length;
      console.log(`Average score: ${avgScore.toFixed(2)}%`);

      // Calculate score distribution
      console.log(`Score distribution:`);
      const ranges = {
        "0-20%": 0,
        "21-40%": 0,
        "41-60%": 0,
        "61-80%": 0,
        "81-100%": 0
      };

      resultsForTest.forEach(r => {
        if (r.score <= 20) ranges["0-20%"]++;
        else if (r.score <= 40) ranges["21-40%"]++;
        else if (r.score <= 60) ranges["41-60%"]++;
        else if (r.score <= 80) ranges["61-80%"]++;
        else ranges["81-100%"]++;
      });

      for (const [range, count] of Object.entries(ranges)) {
        const percent = (count / resultsForTest.length) * 100;
        console.log(`  ${range}: ${count} (${percent.toFixed(1)}%)`);
      }

      // Show student performances
      console.log(`\nStudent performances:`);
      resultsForTest.forEach(result => {
        const user = userMap[result.student.toString()];
        console.log(`  ${user ? user.name : 'Unknown'}: ${result.score.toFixed(2)}%`);
      });
    }

  } catch (error) {
    console.error('Error analyzing test results:', error);
  } finally {
    mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
}

// Run the function
analyzeTestResults(); 