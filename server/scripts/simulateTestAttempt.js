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

// Define schemas
const TestSchema = new mongoose.Schema({
  title: String,
  questions: [{
    _id: mongoose.Schema.Types.ObjectId,
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
  startTime: Date,
  endTime: Date,
  status: {
    type: String,
    default: 'completed'
  }
}, {
  timestamps: true
});

const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String
});

// Create models
const Test = mongoose.model('Test', TestSchema);
const TestResult = mongoose.model('TestResult', TestResultSchema);
const User = mongoose.model('User', UserSchema);

// This function simulates a "perfect" test attempt by a student
async function simulatePerfectTestAttempt() {
  try {
    // Get a test and student
    const tests = await Test.find().lean();
    if (tests.length === 0) {
      console.log('No tests found. Please run insertTestData.js first.');
      return;
    }
    
    // List all tests
    console.log('Available tests:');
    tests.forEach((test, i) => {
      console.log(`${i + 1}. ${test.title} (${test.questions.length} questions)`);
    });
    
    // Use the first test for this example (or pick a specific one)
    const selectedTestIndex = 0; // Change this to select a different test
    const test = tests[selectedTestIndex];
    console.log(`\nSelected test: ${test.title}`);
    
    // Get a student user
    const student = await User.findOne({ role: 'student' }).lean();
    if (!student) {
      console.log('No student users found. Please run insertUserTestResults.js first.');
      return;
    }
    console.log(`Student: ${student.name} (${student.email})\n`);
    
    // Check if this student already has a result for this test
    const existingResult = await TestResult.findOne({ 
      student: student._id, 
      test: test._id 
    });
    
    if (existingResult) {
      console.log(`This student already has a result for this test. Deleting previous result...`);
      await TestResult.deleteOne({ _id: existingResult._id });
    }
    
    // Create a perfect test result - all answers correct
    const startTime = new Date(Date.now() - (30 * 60 * 1000)); // 30 minutes ago
    const endTime = new Date(); // Now
    
    // Create answers with all correct selections
    const answers = test.questions.map(question => ({
      question: question._id,
      selectedAnswer: question.correctAnswer,
      isCorrect: true
    }));
    
    // Create the test result
    const testResult = new TestResult({
      student: student._id,
      test: test._id,
      score: 100, // Perfect score
      answers,
      startTime,
      endTime,
      status: 'completed'
    });
    
    await testResult.save();
    console.log('Perfect test result created successfully!');
    console.log(`Test: ${test.title}`);
    console.log(`Student: ${student.name}`);
    console.log(`Score: 100%`);
    console.log(`Correct answers: ${answers.length}/${test.questions.length}`);
    
    // Display the first few questions and answers
    console.log('\nSample questions and answers:');
    for (let i = 0; i < Math.min(3, test.questions.length); i++) {
      const question = test.questions[i];
      console.log(`\nQ${i+1}: ${question.question}`);
      console.log(`Options: ${question.options.join(' | ')}`);
      console.log(`Correct Answer: ${question.correctAnswer}`);
      console.log(`Selected Answer: ${answers[i].selectedAnswer}`);
      console.log(`Is Correct: ${answers[i].isCorrect}`);
    }
    
    // Show API format for test submission
    console.log('\n===== API SUBMISSION FORMAT =====');
    const apiSubmissionFormat = {
      answers: answers.map(a => ({
        questionId: a.question,
        selectedOption: a.selectedAnswer
      })),
      startTime: startTime.toISOString(),
      duration: Math.floor((endTime - startTime) / 1000 / 60) // in minutes
    };
    
    console.log(JSON.stringify(apiSubmissionFormat, null, 2));
    console.log('\nYou can use this format when submitting test results through the API endpoint.');
    
  } catch (error) {
    console.error('Error simulating test attempt:', error);
  } finally {
    mongoose.connection.close();
    console.log('\nDatabase connection closed.');
  }
}

// Run the simulation
simulatePerfectTestAttempt(); 