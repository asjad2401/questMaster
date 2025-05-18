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

// Define schemas directly in the script to avoid import issues
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    enum: ['student', 'admin'],
    default: 'student',
  },
  accountStatus: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active',
  },
  lastLogin: {
    type: Date,
  },
  profileComplete: {
    type: Boolean,
    default: false,
  },
  bio: {
    type: String,
    maxlength: 500,
  },
  preferences: {
    emailNotifications: {
      type: Boolean,
      default: true,
    },
    studyReminders: {
      type: Boolean,
      default: true,
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system',
    },
  }
}, {
  timestamps: true,
});

const TestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Test title is required'],
    trim: true,
    maxlength: [100, 'Test title cannot be more than 100 characters'],
  },
  description: {
    type: String,
    required: [true, 'Test description is required'],
    maxlength: [1000, 'Description cannot be more than 1000 characters'],
  },
  duration: {
    type: Number,
    required: [true, 'Test duration is required'],
    min: [1, 'Duration must be at least 1 minute'],
  },
  totalMarks: {
    type: Number,
    required: [true, 'Total marks are required'],
    min: [1, 'Total marks must be at least 1'],
  },
  passingMarks: {
    type: Number,
    required: [true, 'Passing marks are required'],
    min: [1, 'Passing marks must be at least 1'],
  },
  questions: [{
    question: {
      type: String,
      required: [true, 'Question is required'],
    },
    options: [{
      type: String,
      required: [true, 'Options are required'],
    }],
    correctAnswer: {
      type: String,
      required: [true, 'Correct answer is required'],
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
    },
    explanation: {
      type: String,
      default: ''
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Test creator is required'],
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  difficultyLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  }
}, {
  timestamps: true,
});

const TestResultSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Student is required'],
  },
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: [true, 'Test is required'],
  },
  score: {
    type: Number,
    required: [true, 'Score is required'],
    min: [0, 'Score cannot be negative'],
  },
  answers: [{
    question: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    selectedAnswer: {
      type: String,
      required: true,
    },
    isCorrect: {
      type: Boolean,
      required: true,
    },
  }],
  startTime: {
    type: Date,
    required: [true, 'Start time is required'],
  },
  endTime: {
    type: Date,
    required: [true, 'End time is required'],
  },
  status: {
    type: String,
    enum: ['completed', 'incomplete', 'abandoned'],
    default: 'completed',
  },
}, {
  timestamps: true,
});

// Create models
const User = mongoose.model('User', UserSchema);
const Test = mongoose.model('Test', TestSchema);
const TestResult = mongoose.model('TestResult', TestResultSchema);

// Define new user data
const userData = [
  {
    name: "Aisha Khan",
    email: "aisha.khan@example.com",
    password: "password123",
    role: "student",
    bio: "Computer Science student focusing on machine learning and algorithms.",
    preferences: {
      theme: "dark"
    }
  },
  {
    name: "Ravi Patel",
    email: "ravi.patel@example.com",
    password: "password123",
    role: "student",
    bio: "Physics major with interest in theoretical physics and quantum mechanics.",
    preferences: {
      theme: "light"
    }
  },
  {
    name: "Maria Garcia",
    email: "maria.garcia@example.com",
    password: "password123",
    role: "student",
    bio: "Chemistry student specializing in organic synthesis and medicinal chemistry.",
    preferences: {
      theme: "system"
    }
  },
  {
    name: "James Wilson",
    email: "james.wilson@example.com",
    password: "password123",
    role: "student",
    bio: "Mathematics major focusing on calculus and differential equations.",
    preferences: {
      theme: "dark"
    }
  },
  {
    name: "Sarah Chen",
    email: "sarah.chen@example.com",
    password: "password123",
    role: "student",
    bio: "Biology student interested in genetics and evolutionary biology.",
    preferences: {
      theme: "light"
    }
  }
];

// Function to generate random test results
const generateTestResults = (student, test) => {
  // Determine how many questions to answer correctly based on random performance level
  const performance = Math.random();
  const questionsCount = test.questions.length;
  const correctCount = Math.floor(performance * questionsCount);
  
  // Create a shuffled array of indices to determine which questions will be correct
  let indices = Array.from({ length: questionsCount }, (_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [indices[i], indices[j]] = [indices[j], indices[i]];
  }
  
  const correctIndices = indices.slice(0, correctCount);
  
  // Generate answers
  const answers = test.questions.map((question, index) => {
    const isCorrect = correctIndices.includes(index);
    let selectedAnswer;
    
    if (isCorrect) {
      // Select the correct answer
      selectedAnswer = question.correctAnswer;
    } else {
      // Select a random incorrect answer
      const incorrectOptions = question.options.filter(option => option !== question.correctAnswer);
      const randomIndex = Math.floor(Math.random() * incorrectOptions.length);
      selectedAnswer = incorrectOptions[randomIndex];
    }
    
    return {
      question: question._id,
      selectedAnswer,
      isCorrect
    };
  });
  
  // Calculate score as percentage
  const score = (correctCount / questionsCount) * 100;
  
  // Generate random start and end times
  const now = new Date();
  const hoursAgo = Math.floor(Math.random() * 72); // Random time in the last 3 days
  const startTime = new Date(now.getTime() - (hoursAgo * 60 * 60 * 1000));
  const testDuration = Math.floor((Math.random() * 0.5 + 0.5) * test.duration); // 50-100% of allotted time
  const endTime = new Date(startTime.getTime() + (testDuration * 60 * 1000));
  
  return {
    student: student._id,
    test: test._id,
    score,
    answers,
    startTime,
    endTime,
    status: 'completed'
  };
};

async function createTestResults() {
  try {
    // Get all tests with full data
    const tests = await Test.find().lean();
    if (tests.length === 0) {
      console.log('No tests found in the database. Please run insertTestData.js first.');
      mongoose.connection.close();
      return;
    }
    
    console.log(`Found ${tests.length} tests in the database.`);
    
    // Create users if they don't exist already
    const createdUsers = [];
    for (const user of userData) {
      const existingUser = await User.findOne({ email: user.email });
      if (existingUser) {
        console.log(`User already exists: ${user.name} (${user.email})`);
        createdUsers.push(existingUser);
      } else {
        const newUser = new User(user);
        await newUser.save();
        console.log(`Created user: ${user.name} (${user.email})`);
        createdUsers.push(newUser);
      }
    }
    
    console.log(`Working with ${createdUsers.length} student accounts.`);
    
    // Generate test results
    let totalResults = 0;
    for (const user of createdUsers) {
      // Randomly select 2-4 tests for each user
      const numTests = Math.floor(Math.random() * 3) + 2; // 2-4 tests
      const shuffledTests = [...tests].sort(() => 0.5 - Math.random());
      const selectedTests = shuffledTests.slice(0, numTests);
      
      for (const test of selectedTests) {
        // Check if user already has a result for this test
        const existingResult = await TestResult.findOne({ student: user._id, test: test._id });
        if (existingResult) {
          console.log(`${user.name} already has a result for ${test.title}, skipping.`);
          continue;
        }
        
        // Generate and save test result
        const testResult = generateTestResults(user, test);
        const newTestResult = new TestResult(testResult);
        await newTestResult.save();
        console.log(`Created test result for ${user.name} on test: ${test.title} with score: ${testResult.score.toFixed(2)}%`);
        totalResults++;
      }
    }
    
    console.log(`Created a total of ${totalResults} new test results.`);
    
  } catch (error) {
    console.error('Error creating test results:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

// Run the function
createTestResults(); 