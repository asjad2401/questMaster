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
  }
}, {
  timestamps: true,
});

// Create models
const Test = mongoose.model('Test', TestSchema);
const User = mongoose.model('User', UserSchema);

// Define test data
const testData = [
  // Test 1: Physics Mechanics
  {
    title: "Physics Mechanics Fundamentals",
    description: "A comprehensive test covering Newton's laws, kinematics, and conservation principles in mechanics.",
    duration: 45,
    totalMarks: 100,
    passingMarks: 50,
    difficultyLevel: "intermediate",
    tags: ["Physics", "Mechanics", "Newton's Laws", "Kinematics"],
    isActive: true,
    questions: [
      {
        question: "What is Newton's First Law of Motion?",
        options: [
          "An object at rest stays at rest unless acted upon by an external force",
          "Force equals mass times acceleration",
          "For every action, there is an equal and opposite reaction",
          "The acceleration of an object is directly proportional to its mass"
        ],
        correctAnswer: "An object at rest stays at rest unless acted upon by an external force",
        difficulty: "easy",
        category: "Physics - Mechanics",
        explanation: "Newton's First Law states that an object will remain at rest or in uniform motion in a straight line unless acted upon by an external force. It's also known as the law of inertia."
      },
      {
        question: "A ball is thrown upward. At the highest point, what is its velocity?",
        options: [
          "Zero",
          "Maximum",
          "Half of its initial velocity",
          "Equal to gravitational acceleration"
        ],
        correctAnswer: "Zero",
        difficulty: "medium",
        category: "Physics - Mechanics",
        explanation: "At the highest point of a projectile's trajectory, its vertical velocity component is zero, as it transitions from moving upward to moving downward."
      },
      {
        question: "Which law of motion states that 'for every action, there is an equal and opposite reaction'?",
        options: [
          "Newton's First Law",
          "Newton's Second Law",
          "Newton's Third Law",
          "Law of Conservation of Momentum"
        ],
        correctAnswer: "Newton's Third Law",
        difficulty: "easy",
        category: "Physics - Mechanics",
        explanation: "Newton's Third Law states that when one body exerts a force on a second body, the second body simultaneously exerts a force equal in magnitude and opposite in direction on the first body."
      },
      {
        question: "Which of the following is a scalar quantity?",
        options: [
          "Displacement",
          "Velocity",
          "Acceleration",
          "Speed"
        ],
        correctAnswer: "Speed",
        difficulty: "medium",
        category: "Physics - Mechanics",
        explanation: "Speed is a scalar quantity as it only has magnitude, while displacement, velocity, and acceleration are vector quantities having both magnitude and direction."
      },
      {
        question: "Calculate the work done when a force of 10N moves an object by 5m in the direction of the force.",
        options: [
          "2 Joules",
          "15 Joules",
          "50 Joules",
          "100 Joules"
        ],
        correctAnswer: "50 Joules",
        difficulty: "medium",
        category: "Physics - Mechanics",
        explanation: "Work done is calculated as W = F×d×cosθ. When the force and displacement are in the same direction, θ=0 and cos(0)=1, so W = 10N × 5m = 50 Joules."
      }
    ]
  },
  // Test 2: Chemistry Organic
  {
    title: "Organic Chemistry Principles",
    description: "Test your knowledge of organic compounds, functional groups, and reaction mechanisms.",
    duration: 60,
    totalMarks: 100,
    passingMarks: 60,
    difficultyLevel: "advanced",
    tags: ["Chemistry", "Organic", "Functional Groups", "Reactions"],
    isActive: true,
    questions: [
      {
        question: "Which functional group is characterized by the carbonyl group (-C=O) attached to a hydroxyl group (-OH)?",
        options: [
          "Alcohol",
          "Aldehyde",
          "Ketone",
          "Carboxylic acid"
        ],
        correctAnswer: "Carboxylic acid",
        difficulty: "medium",
        category: "Chemistry - Organic",
        explanation: "Carboxylic acids have the functional group -COOH, which consists of a carbonyl group (C=O) attached to a hydroxyl group (-OH)."
      },
      {
        question: "What type of reaction is represented by CH₃CH₂Br + OH⁻ → CH₃CH₂OH + Br⁻?",
        options: [
          "Elimination",
          "Substitution",
          "Addition",
          "Oxidation"
        ],
        correctAnswer: "Substitution",
        difficulty: "hard",
        category: "Chemistry - Organic",
        explanation: "This is a nucleophilic substitution reaction (SN2), where the OH⁻ nucleophile substitutes the Br⁻ leaving group."
      },
      {
        question: "Which of the following compounds is aromatic?",
        options: [
          "Cyclohexane",
          "Cyclobutadiene",
          "Pyridine",
          "Cyclooctatetraene"
        ],
        correctAnswer: "Pyridine",
        difficulty: "hard",
        category: "Chemistry - Organic",
        explanation: "Pyridine is aromatic as it has a planar ring with 6 π electrons (follows Hückel's rule of 4n+2 π electrons, where n=1)."
      },
      {
        question: "What is the IUPAC name for CH₃-CH₂-CH(CH₃)-CH₂-CH₃?",
        options: [
          "3-methylpentane",
          "2-methylpentane",
          "Hexane",
          "3-ethylbutane"
        ],
        correctAnswer: "3-methylpentane",
        difficulty: "medium",
        category: "Chemistry - Organic",
        explanation: "The longest carbon chain has 5 carbons (pentane) with a methyl group at the 3-position, hence 3-methylpentane."
      },
      {
        question: "Which reagent would you use to convert a primary alcohol to an aldehyde?",
        options: [
          "KMnO₄",
          "PCC (Pyridinium chlorochromate)",
          "LiAlH₄",
          "NaBH₄"
        ],
        correctAnswer: "PCC (Pyridinium chlorochromate)",
        difficulty: "hard",
        category: "Chemistry - Organic",
        explanation: "PCC is a mild oxidizing agent that can convert primary alcohols to aldehydes without further oxidation to carboxylic acids."
      }
    ]
  },
  // Test 3: Computer Science - Data Structures
  {
    title: "Data Structures Fundamentals",
    description: "Test covering essential data structures including arrays, linked lists, stacks, queues, trees, and graphs.",
    duration: 50,
    totalMarks: 100,
    passingMarks: 60,
    difficultyLevel: "intermediate",
    tags: ["Computer Science", "Data Structures", "Algorithms", "Programming"],
    isActive: true,
    questions: [
      {
        question: "What is the time complexity of searching for an element in a binary search tree in the worst case?",
        options: [
          "O(1)",
          "O(log n)",
          "O(n)",
          "O(n²)"
        ],
        correctAnswer: "O(n)",
        difficulty: "medium",
        category: "CS - Data Structures",
        explanation: "In the worst case (when the tree is completely unbalanced, like a linked list), searching in a binary search tree is O(n)."
      },
      {
        question: "Which data structure follows the First-In-First-Out (FIFO) principle?",
        options: [
          "Stack",
          "Queue",
          "Heap",
          "Binary Search Tree"
        ],
        correctAnswer: "Queue",
        difficulty: "easy",
        category: "CS - Data Structures",
        explanation: "A queue follows the FIFO principle where the first element added is the first one to be removed, like a line of people waiting."
      },
      {
        question: "What is the space complexity of storing a graph with V vertices and E edges using an adjacency matrix?",
        options: [
          "O(V)",
          "O(E)",
          "O(V + E)",
          "O(V²)"
        ],
        correctAnswer: "O(V²)",
        difficulty: "hard",
        category: "CS - Data Structures",
        explanation: "An adjacency matrix for a graph with V vertices requires a V×V matrix, resulting in O(V²) space complexity regardless of the number of edges."
      },
      {
        question: "Which of the following data structures would be most efficient for implementing a priority queue?",
        options: [
          "Array",
          "Linked List",
          "Heap",
          "Hash Table"
        ],
        correctAnswer: "Heap",
        difficulty: "medium",
        category: "CS - Data Structures",
        explanation: "A heap (typically implemented as a binary heap) provides O(log n) insertion and O(1) access to the highest/lowest priority element, making it ideal for priority queue implementations."
      },
      {
        question: "What is the worst-case time complexity of the quicksort algorithm?",
        options: [
          "O(n)",
          "O(n log n)",
          "O(n²)",
          "O(2ⁿ)"
        ],
        correctAnswer: "O(n²)",
        difficulty: "medium",
        category: "CS - Data Structures",
        explanation: "The worst-case time complexity of quicksort is O(n²), which occurs when the pivot chosen is consistently the smallest or largest element, resulting in highly unbalanced partitions."
      }
    ]
  },
  // Test 4: Math - Calculus
  {
    title: "Calculus Fundamentals",
    description: "Test your understanding of limits, derivatives, integrals, and applications of calculus.",
    duration: 60,
    totalMarks: 100,
    passingMarks: 50,
    difficultyLevel: "advanced",
    tags: ["Mathematics", "Calculus", "Derivatives", "Integrals"],
    isActive: true,
    questions: [
      {
        question: "What is the derivative of f(x) = x³ + 2x² - 5x + 3?",
        options: [
          "f'(x) = 3x² + 4x - 5",
          "f'(x) = 3x² + 2x - 5",
          "f'(x) = 3x² + 4x - 1",
          "f'(x) = x² + 4x - 5"
        ],
        correctAnswer: "f'(x) = 3x² + 4x - 5",
        difficulty: "medium",
        category: "Math - Calculus",
        explanation: "Using the power rule (d/dx of xⁿ = n·xⁿ⁻¹) and linearity of differentiation: 3x² + 4x - 5."
      },
      {
        question: "Evaluate the indefinite integral ∫ (2x + e^x) dx",
        options: [
          "x² + e^x + C",
          "x² + e^x",
          "2x + e^x + C",
          "2x² + e^x + C"
        ],
        correctAnswer: "x² + e^x + C",
        difficulty: "medium",
        category: "Math - Calculus",
        explanation: "∫ (2x + e^x) dx = ∫ 2x dx + ∫ e^x dx = 2(x²/2) + e^x + C = x² + e^x + C"
      },
      {
        question: "What is the limit as x approaches 0 of (sin x)/x?",
        options: [
          "0",
          "1",
          "∞",
          "Does not exist"
        ],
        correctAnswer: "1",
        difficulty: "medium",
        category: "Math - Calculus",
        explanation: "This is a fundamental limit in calculus. As x approaches 0, (sin x)/x approaches 1, which can be proven using L'Hôpital's rule or Taylor series."
      },
      {
        question: "Find the critical points of f(x) = x³ - 6x² + 9x + 2",
        options: [
          "x = 1 and x = 3",
          "x = 0 and x = 3",
          "x = 1 and x = 2",
          "x = 0 and x = 2"
        ],
        correctAnswer: "x = 1 and x = 3",
        difficulty: "hard",
        category: "Math - Calculus",
        explanation: "Critical points occur where f'(x) = 0. f'(x) = 3x² - 12x + 9 = 3(x² - 4x + 3) = 3(x - 1)(x - 3). Setting this equal to zero gives x = 1 and x = 3."
      },
      {
        question: "What is the value of ∫₀¹ x²dx?",
        options: [
          "1/2",
          "1/3",
          "2/3",
          "1"
        ],
        correctAnswer: "1/3",
        difficulty: "easy",
        category: "Math - Calculus",
        explanation: "∫₀¹ x²dx = [x³/3]₀¹ = 1/3 - 0 = 1/3"
      }
    ]
  },
  // Test 5: Biology - Genetics
  {
    title: "Genetic Principles and Applications",
    description: "Test covering DNA structure, gene expression, inheritance patterns, and genetic technologies.",
    duration: 45,
    totalMarks: 100,
    passingMarks: 60,
    difficultyLevel: "beginner",
    tags: ["Biology", "Genetics", "DNA", "Inheritance"],
    isActive: true,
    questions: [
      {
        question: "Which of the following is NOT a nitrogenous base found in DNA?",
        options: [
          "Adenine",
          "Thymine",
          "Uracil",
          "Guanine"
        ],
        correctAnswer: "Uracil",
        difficulty: "easy",
        category: "Biology - Genetics",
        explanation: "Uracil is found in RNA, not DNA. DNA contains adenine, thymine, guanine, and cytosine."
      },
      {
        question: "What is the term for the process where RNA is synthesized from DNA?",
        options: [
          "Replication",
          "Translation",
          "Transcription",
          "Transduction"
        ],
        correctAnswer: "Transcription",
        difficulty: "easy",
        category: "Biology - Genetics",
        explanation: "Transcription is the process where RNA polymerase synthesizes RNA using DNA as a template."
      },
      {
        question: "In a dihybrid cross between two heterozygous individuals (AaBb × AaBb), what is the expected phenotypic ratio of offspring?",
        options: [
          "1:1:1:1",
          "9:3:3:1",
          "3:1",
          "1:2:1"
        ],
        correctAnswer: "9:3:3:1",
        difficulty: "hard",
        category: "Biology - Genetics",
        explanation: "A dihybrid cross between two heterozygous individuals follows Mendel's Law of Independent Assortment, resulting in a 9:3:3:1 phenotypic ratio if both genes show complete dominance."
      },
      {
        question: "Which chromosome abnormality results in Down syndrome?",
        options: [
          "Monosomy of chromosome 21",
          "Trisomy of chromosome 21",
          "Deletion of chromosome 21",
          "Translocation of chromosome 18 to 21"
        ],
        correctAnswer: "Trisomy of chromosome 21",
        difficulty: "medium",
        category: "Biology - Genetics",
        explanation: "Down syndrome is typically caused by trisomy 21 - the presence of three copies of chromosome 21 instead of the normal two."
      },
      {
        question: "Which technique allows scientists to make multiple copies of a specific DNA segment?",
        options: [
          "Gel electrophoresis",
          "Polymerase Chain Reaction (PCR)",
          "Southern blotting",
          "DNA sequencing"
        ],
        correctAnswer: "Polymerase Chain Reaction (PCR)",
        difficulty: "medium",
        category: "Biology - Genetics",
        explanation: "PCR is a laboratory technique used to make millions of copies of a specific DNA segment through repeated cycles of heating and cooling."
      }
    ]
  }
];

async function createAdminUser() {
  try {
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin._id);
      return existingAdmin;
    }
    
    // Create a new admin user
    const adminUser = new User({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',  // In production, this should be properly hashed
      role: 'admin'
    });
    
    await adminUser.save();
    console.log('Created new admin user:', adminUser._id);
    return adminUser;
  } catch (error) {
    console.error('Error creating admin user:', error);
    throw error;
  }
}

async function insertTestData() {
  try {
    // Create admin user first (or get existing)
    const admin = await createAdminUser();
    
    // Check if tests already exist
    const existingTests = await Test.find();
    if (existingTests.length > 0) {
      console.log(`${existingTests.length} tests already exist in the database.`);
      console.log('To insert new test data, please drop the existing tests collection first.');
      mongoose.connection.close();
      return;
    }
    
    // Create tests
    for (const test of testData) {
      // Assign the admin user as creator
      test.createdBy = admin._id;
      
      // Insert the test
      const newTest = new Test(test);
      await newTest.save();
      console.log(`Created test: ${test.title}`);
    }
    
    console.log('All test data inserted successfully');
  } catch (error) {
    console.error('Error inserting test data:', error);
  } finally {
    // Close the database connection
    mongoose.connection.close();
  }
}

// Run the function
insertTestData(); 