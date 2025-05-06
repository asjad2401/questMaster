import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from "@/components/Navbar";
import TestQuestion from "@/components/TestQuestion";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";
import api from '@/lib/api';

interface Test {
  _id: string;
  title: string;
  description: string;
  duration: number;
  totalMarks: number;
  passingMarks: number;
  questions: {
    _id: string;
    question: string;
    options: string[];
    correctAnswer: string;
    category: string;
    difficulty: string;
  }[];
}

interface TestResult {
  testResult: {
    _id: string;
    score: number;
    status: string;
    startTime: string;
    endTime: string;
  };
  testDetails: {
    title: string;
    description: string;
    totalQuestions: number;
    marksObtained: number;
    percentage: number;
    passed: boolean;
    answers: {
      questionId: string;
      question: string;
      correctAnswer: string;
      selectedOption: string;
      isCorrect: boolean;
      options: string[];
    }[];
  };
}

const TestInterface = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState<Test | null>(null);
  const [started, setStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [completed, setCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const response = await api.get(`/tests/${id}`);
        setTest(response.data.data.test);
        setTimeRemaining(response.data.data.test.duration * 60); // Convert minutes to seconds
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch test",
          variant: "destructive",
        });
        navigate('/');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTest();
  }, [id, navigate]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (started && !completed && timeRemaining > 0) {
      timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleFinalSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [started, completed, timeRemaining]);
  
  const handleStartTest = () => {
    setStarted(true);
    setStartTime(new Date());
  };
  
  const handleNextQuestion = (selectedOption: string) => {
    if (!test) return;

    // Save answer
    const updatedAnswers = {
      ...userAnswers,
      [test.questions[currentQuestionIndex]._id]: selectedOption
    };
    setUserAnswers(updatedAnswers);
    
    console.log(`Question ${currentQuestionIndex + 1}/${test.questions.length} answered:`, {
      questionId: test.questions[currentQuestionIndex]._id,
      selectedOption,
      isLast: currentQuestionIndex === test.questions.length - 1
    });
    
    // Move to next question or complete test
    if (currentQuestionIndex < test.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // This is the last question, proceed to submission
      console.log("Last question answered, proceeding to submission");
      console.log("All answers:", updatedAnswers);
      
      // Count answered questions for verification
      const answeredCount = Object.keys(updatedAnswers).length;
      console.log(`Answered ${answeredCount}/${test.questions.length} questions`);
      
      handleFinalSubmit(updatedAnswers);
    }
  };
  
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };
  
  const handleSubmit = async (answersToSubmit = userAnswers) => {
    if (!test || !startTime) return;

    try {
      // Make sure we have an answer for each question
      const answeredQuestionIds = Object.keys(answersToSubmit);
      
      // Log for debugging
      console.log("User answers before submission:", answersToSubmit);
      console.log("Answered question IDs:", answeredQuestionIds);
      console.log("Total questions:", test.questions.length);
      
      const formattedAnswers = Object.entries(answersToSubmit).map(([questionId, selectedOption]) => {
        // Convert letter answer (a, b, c, d) to numeric index (0, 1, 2, 3)
        const numericAnswer = selectedOption.charCodeAt(0) - 97; // 'a' -> 0, 'b' -> 1, etc.
        return {
          questionId,
          selectedOption: numericAnswer.toString()
        };
      });

      console.log("Formatted answers for submission:", formattedAnswers);

      const response = await api.post(`/tests/${id}/submit`, {
        answers: formattedAnswers,
        startTime,
        duration: test.duration
      });

      setTestResult(response.data.data);
      setCompleted(true);
      toast({
        title: "Success",
        description: "Test submitted successfully",
      });
      
      // Log received data
      console.log("Test result data received:", response.data.data);
    } catch (error) {
      console.error("Test submission error:", error);
      toast({
        title: "Error",
        description: "Failed to submit test",
        variant: "destructive",
      });
    }
  };

  // Ensure all questions have been answered before final submission
  const handleFinalSubmit = (answersToSubmit = userAnswers) => {
    // Check if all questions have been answered
    const unansweredQuestions = test?.questions.filter(
      question => !answersToSubmit[question._id]
    );

    console.log("Checking for unanswered questions before submission:", {
      totalQuestions: test?.questions.length,
      answeredQuestions: Object.keys(answersToSubmit).length,
      unansweredCount: unansweredQuestions?.length
    });

    if (unansweredQuestions && unansweredQuestions.length > 0) {
      // Warn the user about unanswered questions
      if (window.confirm(`You have ${unansweredQuestions.length} unanswered question(s). Are you sure you want to submit?`)) {
        handleSubmit(answersToSubmit);
      }
    } else {
      handleSubmit(answersToSubmit);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <Navbar />
        <main className="exam-container py-8">
          <Card className="max-w-2xl mx-auto dark:border-gray-700 dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="dark:text-white">Loading...</CardTitle>
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }

  if (!test) {
    return null;
  }
  
  // Render test information before starting
  if (!started && !completed) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <Navbar />
        <main className="exam-container py-8">
          <Link to="/" className="inline-flex items-center text-exam-primary hover:text-exam-secondary mb-6 dark:text-blue-400 dark:hover:text-blue-300">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
          
          <Card className="max-w-2xl mx-auto dark:border-gray-700 dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-2xl dark:text-white">{test.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground dark:text-gray-400">Description:</span>
                  <span className="font-medium dark:text-white">{test.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground dark:text-gray-400">Total Questions:</span>
                  <span className="font-medium dark:text-white">{test.questions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground dark:text-gray-400">Time Limit:</span>
                  <span className="font-medium dark:text-white">{test.duration} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground dark:text-gray-400">Passing Marks:</span>
                  <span className="font-medium dark:text-white">{test.passingMarks}%</span>
                </div>
              </div>
              
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 dark:bg-blue-900/20 dark:border-blue-600">
                <div className="flex">
                  <div className="ml-3">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Instructions: Read each question carefully. Choose the best answer from the options provided.
                      You can navigate between questions using the Next and Previous buttons.
                      The test will automatically submit when the time is up.
                    </p>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={handleStartTest} 
                size="lg" 
                className="w-full bg-exam-primary hover:bg-exam-primary/90 text-white"
              >
                Start Test
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }
  
  // Render results when test is completed
  if (completed && testResult) {
    console.log("Rendering test results:", testResult);
    
    // Make sure we have answers to display
    if (!testResult.testDetails.answers || testResult.testDetails.answers.length === 0) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
          <Navbar />
          <main className="exam-container py-8">
            <Card className="max-w-4xl mx-auto dark:border-gray-700 dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-2xl dark:text-white">Test Results</CardTitle>
                <CardDescription className="dark:text-gray-300">
                  There was an issue loading your test results. Please contact support.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex justify-center">
                  <Link to="/">
                    <Button>Back to Dashboard</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
        <Navbar />
        <main className="exam-container py-8">
          <Card className="max-w-4xl mx-auto dark:border-gray-700 dark:bg-gray-800">
            <CardHeader>
              <CardTitle className="text-2xl dark:text-white">Test Results</CardTitle>
              <CardDescription className="dark:text-gray-300">
                {testResult.testDetails.title}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Score</p>
                  <p className="text-2xl font-bold dark:text-white">{testResult.testDetails.marksObtained} / {testResult.testDetails.totalQuestions}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Percentage</p>
                  <p className="text-2xl font-bold dark:text-white">{testResult.testDetails.percentage.toFixed(1)}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <p className={`text-2xl font-bold ${testResult.testDetails.passed ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {testResult.testDetails.passed ? 'Passed' : 'Failed'}
                  </p>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-semibold dark:text-white">Question Review</h3>
                {testResult.testDetails.answers.map((answer, index) => {
                  // Check if we have valid answer data
                  if (!answer || !answer.questionId) {
                    console.warn("Missing answer data at index:", index);
                    return null;
                  }
                  
                  // Convert numeric answers back to letters
                  let selectedLetter, correctLetter;
                  try {
                    selectedLetter = String.fromCharCode(97 + parseInt(answer.selectedOption));
                    correctLetter = String.fromCharCode(97 + parseInt(answer.correctAnswer));
                  } catch (e) {
                    console.error("Error converting answer format:", e);
                    selectedLetter = answer.selectedOption;
                    correctLetter = answer.correctAnswer;
                  }
                  
                  return (
                    <Card key={answer.questionId} className={`p-4 ${answer.isCorrect 
                      ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                      : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'}`}
                    >
                      <div className="space-y-2">
                        <p className="font-medium dark:text-white">Question {index + 1}: {answer.question}</p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Your Answer</p>
                            <p className={`font-medium ${answer.isCorrect 
                              ? 'text-green-600 dark:text-green-400' 
                              : 'text-red-600 dark:text-red-400'}`}
                            >
                              {selectedLetter.toUpperCase()} - {answer.options && answer.options[parseInt(answer.selectedOption)]}
                            </p>
                          </div>
                          {!answer.isCorrect && (
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400">Correct Answer</p>
                              <p className="font-medium text-green-600 dark:text-green-400">
                                {correctLetter.toUpperCase()} - {answer.options && answer.options[parseInt(answer.correctAnswer)]}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>

              <div className="flex justify-center">
                <Link to="/">
                  <Button>Back to Dashboard</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }
  
  const currentQuestion = test.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / test.questions.length) * 100;
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <Navbar />
      <main className="exam-container py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-2xl font-bold text-exam-primary dark:text-blue-400">{test.title}</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium dark:text-white">Time Remaining: {timeString}</span>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/" className="text-exam-primary dark:text-blue-400">Exit Test</Link>
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => handleFinalSubmit()}
                className="bg-exam-primary hover:bg-exam-primary/90"
              >
                Submit Test
              </Button>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        
        <TestQuestion 
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={test.questions.length}
          questionText={currentQuestion.question}
          options={currentQuestion.options.map((option, index) => ({
            id: String.fromCharCode(97 + index), // a, b, c, d
            text: option
          }))}
          onNext={handleNextQuestion}
          onPrevious={handlePreviousQuestion}
          selectedOption={userAnswers[currentQuestion._id]}
          timeRemaining={timeString}
        />
      </main>
    </div>
  );
};

export default TestInterface;
