import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LogOut, Users, FileText, BarChart2, PlusCircle, Link, Trash2, Edit, Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { SlideUp, SlideInLeft, ScaleIn, StaggerContainer, StaggerItem, AnimatedButton } from "@/components/animations";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import api from '@/lib/api';

// Predefined topic options for tests
const TOPIC_OPTIONS = [
  // Science topics
  'Physics - Mechanics',
  'Physics - Electricity',
  'Physics - Thermodynamics',
  'Chemistry - Organic',
  'Chemistry - Inorganic',
  'Chemistry - Physical',
  'Biology - Cell Biology',
  'Biology - Genetics',
  'Biology - Ecology',
  // Math topics
  'Math - Algebra',
  'Math - Calculus',
  'Math - Geometry',
  'Math - Statistics',
  'Math - Trigonometry',
  // Computer Science
  'CS - Programming',
  'CS - Data Structures',
  'CS - Algorithms',
  'CS - Databases',
  'CS - Web Development',
  // Custom option
  'Other'
];

const questionSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  options: z.array(z.string()).min(2, 'At least 2 options are required'),
  correctAnswer: z.string().min(1, 'Correct answer is required'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  category: z.string().min(1, 'Topic is required'),
  customTopic: z.string().optional(),
});

const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(1, 'Description is required'),
  duration: z.number().min(1, 'Duration must be at least 1 minute'),
  totalMarks: z.number().min(1, 'Total marks must be at least 1'),
  passingMarks: z.number().min(1, 'Passing marks must be at least 1'),
  questions: z.array(questionSchema).min(1, 'At least one question is required'),
});

type FormData = z.infer<typeof formSchema>;

interface Student {
  _id: string;
  name: string;
  email: string;
  testsTaken: number;
  averageScore: number;
  lastActive: string;
  categoryPerformance: {
    category: string;
    averageScore: number;
  }[];
}

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
    difficulty: string;
    category: string;
  }[];
  createdBy: {
    _id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
  stats?: {
    attempts: number;
    averageScore: number;
    passRate: number;
  };
}

interface Stats {
  totalStudents: number;
  totalTests: number;
  averageScore: number;
  activeStudents: number;
  categoryStats: Record<string, number>;
}

// Add Resource form schema
const resourceSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description should be more detailed'),
  type: z.enum(['document', 'video', 'link', 'quiz']),
  url: z.string().url('Please enter a valid URL'),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()),
  isPublic: z.boolean().default(true),
});

type ResourceFormData = z.infer<typeof resourceSchema>;

interface Resource {
  _id: string;
  title: string;
  description: string;
  type: 'document' | 'video' | 'link' | 'quiz';
  url: string;
  category: string;
  tags: string[];
  createdBy: {
    _id: string;
    name: string;
  };
  isPublic: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [students, setStudents] = useState<Student[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [testToDelete, setTestToDelete] = useState<string | null>(null);
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [isResourceDeleteDialogOpen, setIsResourceDeleteDialogOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<string | null>(null);
  const [resourceTags, setResourceTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalTests: 0,
    averageScore: 0,
    activeStudents: 0,
    categoryStats: {},
  });
  const [customTopics, setCustomTopics] = useState<string[]>([]);
  const [newCustomTopic, setNewCustomTopic] = useState('');
  const [testDetailsOpen, setTestDetailsOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      duration: 30,
      totalMarks: 100,
      passingMarks: 40,
      questions: [
        {
          question: '',
          options: ['', '', '', ''],
          correctAnswer: '',
          difficulty: 'medium',
          category: '',
          customTopic: '',
        },
      ],
    },
  });

  // Resource form
  const resourceForm = useForm<ResourceFormData>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      title: '',
      description: '',
      type: 'link',
      url: '',
      category: '',
      tags: [],
      isPublic: true,
    },
  });

  useEffect(() => {
    fetchStudents();
    fetchStats();
    fetchTests();
    fetchResources();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await api.get('/users/students');
      setStudents(response.data.data.students);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch students",
        variant: "destructive",
      });
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/users/admin-stats');
      setStats(response.data.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch statistics",
        variant: "destructive",
      });
    }
  };

  const fetchTests = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/tests');
      
      // Fetch test statistics for each test
      const testsWithStats = await Promise.all(
        response.data.data.tests.map(async (test: Test) => {
          try {
            const statsResponse = await api.get(`/tests/${test._id}/stats`);
            return {
              ...test,
              stats: statsResponse.data.data
            };
          } catch (error) {
            // If stats can't be fetched, still return the test
            return {
              ...test,
              stats: {
                attempts: 0,
                averageScore: 0,
                passRate: 0
              }
            };
          }
        })
      );
      
      setTests(testsWithStats);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch tests",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchResources = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/resources');
      setResources(response.data.data.resources);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch resources",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    navigate('/login');
  };

  const onSubmit = async (data: FormData) => {
    try {
      setIsLoading(true);
      
      // Process the data - if a question has category "Other", use customTopic instead
      const processedData = {
        ...data,
        questions: data.questions.map(q => {
          const questionData = { ...q };
          if (q.category === 'Other' && q.customTopic) {
            questionData.category = q.customTopic;
          }
          // Remove the customTopic field before sending to API
          delete questionData.customTopic;
          return questionData;
        })
      };
      
      if (selectedTest) {
        // Update existing test
        await api.put(`/tests/${selectedTest._id}`, processedData);
        toast({
          title: "Success",
          description: "Test updated successfully.",
        });
        setSelectedTest(null);
      } else {
        // Create new test
        await api.post('/tests', processedData);
      toast({
        title: "Success",
        description: "Test created successfully.",
      });
      }
      
      form.reset();
      fetchTests(); // Refresh the tests list
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save test",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addQuestion = () => {
    const questions = form.getValues('questions');
    form.setValue('questions', [
      ...questions,
      {
        question: '',
        options: ['', '', '', ''],
        correctAnswer: '',
        difficulty: 'medium',
        category: '',
        customTopic: '',
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    const questions = form.getValues('questions');
    form.setValue('questions', questions.filter((_, i) => i !== index));
  };

  const addCustomTopic = () => {
    if (newCustomTopic.trim() && !customTopics.includes(newCustomTopic.trim())) {
      setCustomTopics([...customTopics, newCustomTopic.trim()]);
      setNewCustomTopic('');
    }
  };

  const handleDeleteTest = async (id: string) => {
    try {
      setIsLoading(true);
      await api.delete(`/tests/${id}`);
      toast({
        title: "Success",
        description: "Test deleted successfully",
      });
      // Refresh the tests list
      fetchTests();
      // Close dialog if open
      setIsDeleteDialogOpen(false);
      setTestToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete test",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDeleteTest = (id: string) => {
    setTestToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleEditTest = (test: Test) => {
    setSelectedTest(test);
    // Pre-fill the form with test data
    form.reset({
      title: test.title,
      description: test.description,
      duration: test.duration,
      totalMarks: test.totalMarks,
      passingMarks: test.passingMarks,
      questions: test.questions.map(q => ({
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        difficulty: q.difficulty as 'easy' | 'medium' | 'hard',
        category: q.category,
        customTopic: '',
      })),
    });
    // Switch to create tab (which will be used for editing too)
    setActiveTab('create');
  };

  const handleViewDetails = (test: Test) => {
    setSelectedTest(test);
    setTestDetailsOpen(true);
  };

  const handleDeleteResource = async (id: string) => {
    try {
      setIsLoading(true);
      await api.delete(`/resources/${id}`);
      toast({
        title: "Success",
        description: "Resource deleted successfully",
      });
      // Refresh the resources list
      fetchResources();
      // Close dialog if open
      setIsResourceDeleteDialogOpen(false);
      setResourceToDelete(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete resource",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDeleteResource = (id: string) => {
    setResourceToDelete(id);
    setIsResourceDeleteDialogOpen(true);
  };

  const handleEditResource = (resource: Resource) => {
    setSelectedResource(resource);
    setResourceTags(resource.tags);
    // Pre-fill the form with resource data
    resourceForm.reset({
      title: resource.title,
      description: resource.description,
      type: resource.type,
      url: resource.url,
      category: resource.category,
      tags: resource.tags,
      isPublic: resource.isPublic,
    });
  };

  const onResourceSubmit = async (data: ResourceFormData) => {
    try {
      setIsLoading(true);
      
      // Prepare data with tags
      const resourceData = {
        ...data,
        tags: resourceTags,
      };
      
      if (selectedResource) {
        // Update existing resource
        await api.patch(`/resources/${selectedResource._id}`, resourceData);
        toast({
          title: "Success",
          description: "Resource updated successfully.",
        });
        setSelectedResource(null);
      } else {
        // Create new resource
        await api.post('/resources', resourceData);
        toast({
          title: "Success",
          description: "Resource created successfully.",
        });
      }
      
      resourceForm.reset();
      setResourceTags([]);
      fetchResources(); // Refresh the resources list
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to save resource",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addTag = () => {
    if (newTag.trim() && !resourceTags.includes(newTag.trim())) {
      setResourceTags([...resourceTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setResourceTags(resourceTags.filter(t => t !== tag));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="container mx-auto py-8">
        <motion.div 
          className="flex justify-between items-center mb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-3xl font-bold text-exam-primary dark:text-white">Admin Dashboard</h1>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <AnimatedButton 
              variant="outline" 
              onClick={handleLogout}
              className="dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </AnimatedButton>
          </div>
        </motion.div>

        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="overview" className="dark:data-[state=active]:bg-gray-800">Overview</TabsTrigger>
              <TabsTrigger value="students" className="dark:data-[state=active]:bg-gray-800">Students</TabsTrigger>
              <TabsTrigger value="create" className="dark:data-[state=active]:bg-gray-800">Create Test</TabsTrigger>
              <TabsTrigger value="manage" className="dark:data-[state=active]:bg-gray-800">Manage Tests</TabsTrigger>
              <TabsTrigger value="resources" className="dark:data-[state=active]:bg-gray-800">Resources</TabsTrigger>
            </TabsList>
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TabsContent value="overview">
                <StaggerContainer>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StaggerItem>
                      <Card className="dark:border-gray-700 dark:bg-gray-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium dark:text-white">Total Students</CardTitle>
                          <Users className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold dark:text-white">{stats.totalStudents}</div>
                        </CardContent>
                      </Card>
                    </StaggerItem>
                    <StaggerItem>
                      <Card className="dark:border-gray-700 dark:bg-gray-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium dark:text-white">Total Tests</CardTitle>
                          <FileText className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold dark:text-white">{stats.totalTests}</div>
                        </CardContent>
                      </Card>
                    </StaggerItem>
                    <StaggerItem>
                      <Card className="dark:border-gray-700 dark:bg-gray-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium dark:text-white">Average Score</CardTitle>
                          <BarChart2 className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold dark:text-white">{stats.averageScore}%</div>
                        </CardContent>
                      </Card>
                    </StaggerItem>
                    <StaggerItem>
                      <Card className="dark:border-gray-700 dark:bg-gray-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium dark:text-white">Active Students</CardTitle>
                          <Users className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold dark:text-white">{stats.totalStudents}</div>
                        </CardContent>
                      </Card>
                    </StaggerItem>
                  </div>
                </StaggerContainer>
                
                <ScaleIn>
                  <Card className="mt-8 dark:border-gray-700 dark:bg-gray-800">
                    <CardHeader>
                      <CardTitle className="dark:text-white">Category Distribution</CardTitle>
                      <CardDescription className="dark:text-gray-400">Number of questions per category</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {Object.entries(stats.categoryStats).map(([category, count], index) => (
                          <motion.div
                            key={category}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                          >
                            <Card className="dark:border-gray-700 dark:bg-gray-800">
                              <CardHeader className="py-4">
                                <CardTitle className="text-sm font-medium dark:text-white">{category}</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="text-2xl font-bold dark:text-white">{count}</div>
                                <p className="text-xs text-muted-foreground dark:text-gray-400">questions</p>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </ScaleIn>
              </TabsContent>

              <TabsContent value="students">
                <ScaleIn>
                  <Card className="dark:border-gray-700 dark:bg-gray-800">
                    <CardHeader>
                      <CardTitle className="dark:text-white">Student Overview</CardTitle>
                      <CardDescription className="dark:text-gray-400">View and manage student profiles</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow className="dark:border-gray-700">
                            <TableHead className="dark:text-gray-300">Student</TableHead>
                            <TableHead className="dark:text-gray-300">Email</TableHead>
                            <TableHead className="dark:text-gray-300">Tests Taken</TableHead>
                            <TableHead className="dark:text-gray-300">Average Score</TableHead>
                            <TableHead className="dark:text-gray-300">Last Active</TableHead>
                            <TableHead className="dark:text-gray-300">Category Performance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {students.map((student, index) => (
                            <motion.tr
                              key={student._id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.3, delay: index * 0.05 }}
                              className="dark:border-gray-700"
                            >
                              <TableCell className="dark:text-white">
                                <div className="flex items-center space-x-2">
                                  <motion.div whileHover={{ scale: 1.1 }}>
                                    <Avatar>
                                      <AvatarFallback>{student.name[0]}</AvatarFallback>
                                    </Avatar>
                                  </motion.div>
                                  <span>{student.name}</span>
                                </div>
                              </TableCell>
                              <TableCell className="dark:text-gray-300">{student.email}</TableCell>
                              <TableCell className="dark:text-gray-300">{student.testsTaken}</TableCell>
                              <TableCell className="dark:text-gray-300">{student.averageScore}%</TableCell>
                              <TableCell className="dark:text-gray-300">{new Date(student.lastActive).toLocaleDateString()}</TableCell>
                              <TableCell className="dark:text-gray-300">
                                <div className="space-y-1">
                                  {student.categoryPerformance.map((cat) => (
                                    <div key={cat.category} className="flex justify-between text-sm">
                                      <span className="text-muted-foreground dark:text-gray-400">{cat.category}:</span>
                                      <span className="font-medium dark:text-white">{cat.averageScore}%</span>
                                    </div>
                                  ))}
                                </div>
                              </TableCell>
                            </motion.tr>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </ScaleIn>
              </TabsContent>

              <TabsContent value="create">
                <ScaleIn>
                  <Card className="dark:border-gray-700 dark:bg-gray-800">
                    <CardHeader>
                      <CardTitle className="dark:text-white">{selectedTest ? "Edit Test" : "Create New Test"}</CardTitle>
                      <CardDescription className="dark:text-gray-400">{selectedTest ? "Update test details and questions" : "Create a new test with questions and options"}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                          <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="dark:text-white">Test Title</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="Enter test title" 
                                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage className="dark:text-red-400" />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="dark:text-white">Description</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Enter test description" 
                                    className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400" 
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage className="dark:text-red-400" />
                              </FormItem>
                            )}
                          />
                          <div className="grid grid-cols-3 gap-4">
                            <FormField
                              control={form.control}
                              name="duration"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="dark:text-white">Duration (minutes)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400" 
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage className="dark:text-red-400" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="totalMarks"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="dark:text-white">Total Marks</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400" 
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage className="dark:text-red-400" />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name="passingMarks"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="dark:text-white">Passing Marks</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400" 
                                      {...field} 
                                    />
                                  </FormControl>
                                  <FormMessage className="dark:text-red-400" />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <h3 className="text-lg font-semibold dark:text-white">Questions</h3>
                              <Button type="button" onClick={addQuestion}>
                                <PlusCircle className="h-4 w-4 mr-2" />
                                Add Question
                              </Button>
                            </div>
                            {form.watch('questions').map((question, index) => (
                              <Card key={index} className="p-4 dark:border-gray-700 dark:bg-gray-800">
                                <div className="flex justify-between items-start mb-4">
                                  <h4 className="font-medium dark:text-white">Question {index + 1}</h4>
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => removeQuestion(index)}
                                  >
                                    Remove
                                  </Button>
                                </div>
                                <div className="space-y-4">
                                  <FormField
                                    control={form.control}
                                    name={`questions.${index}.question`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="dark:text-white">Question</FormLabel>
                                        <FormControl>
                                          <Textarea 
                                            placeholder="Enter question" 
                                            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400" 
                                            {...field} 
                                          />
                                        </FormControl>
                                        <FormMessage className="dark:text-red-400" />
                                      </FormItem>
                                    )}
                                  />
                                  <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                      control={form.control}
                                      name={`questions.${index}.difficulty`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="dark:text-white">Difficulty</FormLabel>
                                          <Select
                                            onValueChange={field.onChange}
                                            defaultValue={field.value}
                                          >
                                            <FormControl>
                                              <SelectTrigger>
                                                <SelectValue placeholder="Select difficulty" />
                                              </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                              <SelectItem value="easy">Easy</SelectItem>
                                              <SelectItem value="medium">Medium</SelectItem>
                                              <SelectItem value="hard">Hard</SelectItem>
                                            </SelectContent>
                                          </Select>
                                          <FormMessage className="dark:text-red-400" />
                                        </FormItem>
                                      )}
                                    />
                                    <FormField
                                      control={form.control}
                                      name={`questions.${index}.category`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="dark:text-white">Topic</FormLabel>
                                          <Select
                                            onValueChange={(value) => {
                                              field.onChange(value);
                                              // Clear custom topic if not "Other"
                                              if (value !== 'Other') {
                                                form.setValue(`questions.${index}.customTopic`, '');
                                              }
                                            }}
                                            defaultValue={field.value}
                                          >
                                            <FormControl>
                                              <SelectTrigger>
                                                <SelectValue placeholder="Select topic" />
                                              </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                              {TOPIC_OPTIONS.map((topic) => (
                                                <SelectItem key={topic} value={topic}>
                                                  {topic}
                                                </SelectItem>
                                              ))}
                                              {customTopics.map((topic) => (
                                                <SelectItem key={topic} value={topic}>
                                                  {topic}
                                                </SelectItem>
                                              ))}
                                            </SelectContent>
                                          </Select>
                                          <FormDescription className="dark:text-gray-400">
                                            Select a topic that best matches this question
                                          </FormDescription>
                                          <FormMessage className="dark:text-red-400" />
                                        </FormItem>
                                      )}
                                    />
                                  </div>
                                  
                                  {form.watch(`questions.${index}.category`) === 'Other' && (
                                    <FormField
                                      control={form.control}
                                      name={`questions.${index}.customTopic`}
                                      render={({ field }) => (
                                        <FormItem>
                                          <FormLabel className="dark:text-white">Custom Topic</FormLabel>
                                          <FormControl>
                                            <Input 
                                              placeholder="Enter custom topic" 
                                              className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400" 
                                              {...field} 
                                            />
                                          </FormControl>
                                          <FormMessage className="dark:text-red-400" />
                                        </FormItem>
                                      )}
                                    />
                                  )}
                                  
                                  <div className="space-y-2">
                                    <FormLabel className="dark:text-white">Options</FormLabel>
                                    {[0, 1, 2, 3].map((optionIndex) => (
                                      <FormField
                                        key={optionIndex}
                                        control={form.control}
                                        name={`questions.${index}.options.${optionIndex}`}
                                        render={({ field }) => (
                                          <FormItem>
                                            <div className="flex items-center">
                                              <Badge className="mr-2 dark:text-white">{String.fromCharCode(65 + optionIndex)}</Badge>
                                            <FormControl>
                                              <Input
                                                placeholder={`Option ${optionIndex + 1}`}
                                                className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                                                {...field}
                                              />
                                            </FormControl>
                                            </div>
                                            <FormMessage className="dark:text-red-400" />
                                          </FormItem>
                                        )}
                                      />
                                    ))}
                                  </div>
                                  <FormField
                                    control={form.control}
                                    name={`questions.${index}.correctAnswer`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel className="dark:text-white">Correct Answer</FormLabel>
                                        <Select
                                          onValueChange={field.onChange}
                                          defaultValue={field.value}
                                        >
                                        <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Select correct answer" />
                                            </SelectTrigger>
                                        </FormControl>
                                          <SelectContent>
                                            {[0, 1, 2, 3].map((optionIndex) => (
                                              <SelectItem key={optionIndex} value={optionIndex.toString()}>
                                                Option {String.fromCharCode(65 + optionIndex)}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                        <FormDescription className="dark:text-gray-400">
                                          Select which option is the correct answer
                                        </FormDescription>
                                        <FormMessage className="dark:text-red-400" />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              </Card>
                            ))}
                          </div>

                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold dark:text-white">Custom Topics</h3>
                            <div className="flex gap-2 flex-wrap mb-2">
                              {customTopics.map((topic, index) => (
                                <Badge key={index} variant="secondary" className="dark:text-white">{topic}</Badge>
                              ))}
                              {customTopics.length === 0 && (
                                <p className="text-sm text-muted-foreground dark:text-gray-400">No custom topics added yet</p>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Input 
                                placeholder="Add new custom topic" 
                                value={newCustomTopic}
                                onChange={(e) => setNewCustomTopic(e.target.value)}
                                className="flex-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                              />
                              <Button type="button" onClick={addCustomTopic} disabled={!newCustomTopic.trim()}>
                                Add
                              </Button>
                            </div>
                          </div>

                          <CardFooter className="flex justify-between">
                            {selectedTest && (
                              <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => {
                                  setSelectedTest(null);
                                  form.reset();
                                }}
                              >
                                Cancel Edit
                              </Button>
                            )}
                            <Button type="submit" className={selectedTest ? "ml-auto" : "w-full"} disabled={isLoading}>
                              {isLoading ? (selectedTest ? "Updating..." : "Creating...") : (selectedTest ? "Update Test" : "Create Test")}
                          </Button>
                          </CardFooter>
                        </form>
                      </Form>
                    </CardContent>
                  </Card>
                </ScaleIn>
              </TabsContent>

              <TabsContent value="manage">
                <Card>
                  <CardHeader>
                    <CardTitle>Manage Tests</CardTitle>
                    <CardDescription>View, edit, and delete existing tests</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="flex justify-center p-8">
                        <p>Loading tests...</p>
                      </div>
                    ) : tests.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Created By</TableHead>
                            <TableHead>Questions</TableHead>
                            <TableHead>Duration</TableHead>
                            <TableHead>Attempts</TableHead>
                            <TableHead>Avg. Score</TableHead>
                            <TableHead>Pass Rate</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tests.map((test) => (
                            <TableRow key={test._id}>
                              <TableCell>
                                <div className="font-medium">{test.title}</div>
                                <div className="text-sm text-muted-foreground line-clamp-1">{test.description}</div>
                              </TableCell>
                              <TableCell>{test.createdBy?.name || 'Admin'}</TableCell>
                              <TableCell>{test.questions.length}</TableCell>
                              <TableCell>{test.duration} mins</TableCell>
                              <TableCell>{test.stats?.attempts || 0}</TableCell>
                              <TableCell>{test.stats?.averageScore ? `${test.stats.averageScore.toFixed(1)}%` : '0%'}</TableCell>
                              <TableCell>{test.stats?.passRate ? `${test.stats.passRate.toFixed(1)}%` : '0%'}</TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleViewDetails(test)}
                                  >
                                    Details
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleEditTest(test)}
                                  >
                                    Edit
                                  </Button>
                                  <Button 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={() => confirmDeleteTest(test._id)}
                                  >
                                    Delete
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                <div className="text-center py-8">
                        <p className="text-gray-500">No tests available</p>
                        <Button 
                          onClick={() => setActiveTab('create')} 
                          variant="outline"
                          className="mt-4"
                        >
                          Create a Test
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Test Details Dialog */}
                {testDetailsOpen && selectedTest && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-[700px] max-h-[80vh] overflow-y-auto">
                      <CardHeader>
                        <CardTitle>{selectedTest.title}</CardTitle>
                        <CardDescription>{selectedTest.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-3 gap-4 mb-6">
                          <div className="bg-muted rounded-lg p-4">
                            <h3 className="text-sm font-medium mb-2">Test Attempts</h3>
                            <p className="text-2xl font-bold">{selectedTest.stats?.attempts || 0}</p>
                          </div>
                          <div className="bg-muted rounded-lg p-4">
                            <h3 className="text-sm font-medium mb-2">Average Score</h3>
                            <p className="text-2xl font-bold">{selectedTest.stats?.averageScore ? `${selectedTest.stats.averageScore.toFixed(1)}%` : '0%'}</p>
                          </div>
                          <div className="bg-muted rounded-lg p-4">
                            <h3 className="text-sm font-medium mb-2">Pass Rate</h3>
                            <p className="text-2xl font-bold">{selectedTest.stats?.passRate ? `${selectedTest.stats.passRate.toFixed(1)}%` : '0%'}</p>
                          </div>
                        </div>

                        <div className="mb-6">
                          <h3 className="text-lg font-medium mb-2">Test Details</h3>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <span className="text-sm text-muted-foreground">Duration:</span>
                              <span className="ml-2">{selectedTest.duration} minutes</span>
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Total Marks:</span>
                              <span className="ml-2">{selectedTest.totalMarks}</span>
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Passing Marks:</span>
                              <span className="ml-2">{selectedTest.passingMarks}%</span>
                            </div>
                            <div>
                              <span className="text-sm text-muted-foreground">Created:</span>
                              <span className="ml-2">{new Date(selectedTest.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-medium mb-2">Questions ({selectedTest.questions.length})</h3>
                          <div className="space-y-4">
                            {selectedTest.questions.map((q, idx) => (
                              <div key={q._id} className="border rounded-lg p-4">
                                <div className="flex justify-between mb-2">
                                  <h4 className="font-medium">Question {idx + 1}</h4>
                                  <Badge>{q.difficulty}</Badge>
                                </div>
                                <p className="mb-2">{q.question}</p>
                                <div className="space-y-1 mb-2">
                                  {q.options.map((option, optIdx) => (
                                    <div 
                                      key={optIdx} 
                                      className={`p-2 rounded-md ${parseInt(q.correctAnswer) === optIdx ? 'bg-green-100 dark:bg-green-900/20' : ''}`}
                                    >
                                      <Badge className="mr-2">{String.fromCharCode(65 + optIdx)}</Badge>
                                      {option}
                                      {parseInt(q.correctAnswer) === optIdx && (
                                        <Badge variant="outline" className="ml-2 bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400">
                                          Correct Answer
                                        </Badge>
                                      )}
                                    </div>
                                  ))}
                                </div>
                                <div>
                                  <span className="text-sm text-muted-foreground">Topic:</span>
                                  <Badge variant="outline" className="ml-2">{q.category}</Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="flex justify-between">
                        <Button 
                          variant="outline" 
                          onClick={() => setTestDetailsOpen(false)}
                        >
                          Close
                        </Button>
                        <div className="space-x-2">
                          <Button 
                            variant="outline"
                            onClick={() => {
                              handleEditTest(selectedTest);
                              setTestDetailsOpen(false);
                            }}
                          >
                            Edit Test
                          </Button>
                          <Button 
                            variant="destructive"
                            onClick={() => {
                              confirmDeleteTest(selectedTest._id);
                              setTestDetailsOpen(false);
                            }}
                          >
                            Delete Test
                          </Button>
                        </div>
                      </CardFooter>
                    </Card>
                  </div>
                )}

                {/* Delete Confirmation Dialog */}
                {isDeleteDialogOpen && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-[400px]">
                      <CardHeader>
                        <CardTitle>Confirm Deletion</CardTitle>
                        <CardDescription>
                          This action cannot be undone. The test and all associated data will be permanently deleted.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p>Are you sure you want to delete this test?</p>
                      </CardContent>
                      <CardFooter className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setIsDeleteDialogOpen(false);
                            setTestToDelete(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          variant="destructive" 
                          onClick={() => testToDelete && handleDeleteTest(testToDelete)}
                          disabled={isLoading}
                        >
                          {isLoading ? "Deleting..." : "Delete"}
                        </Button>
                      </CardFooter>
                    </Card>
                </div>
                )}
              </TabsContent>

              <TabsContent value="resources">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Manage Resources</CardTitle>
                        <CardDescription>View, edit, and delete educational resources</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {isLoading ? (
                          <div className="flex justify-center p-8">
                            <p>Loading resources...</p>
                          </div>
                        ) : resources.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Views</TableHead>
                                <TableHead>Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {resources.map((resource) => (
                                <TableRow key={resource._id}>
                                  <TableCell>
                                    <div className="font-medium">{resource.title}</div>
                                    <div className="text-sm text-muted-foreground line-clamp-1">{resource.description}</div>
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline">
                                      {resource.type}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{resource.category}</TableCell>
                                  <TableCell>{resource.viewCount}</TableCell>
                                  <TableCell>
                                    <div className="flex space-x-2">
                                      <Button 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => handleEditResource(resource)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        variant="destructive" 
                                        size="sm"
                                        onClick={() => confirmDeleteResource(resource._id)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        ) : (
                          <div className="text-center py-8">
                            <p className="text-gray-500">No resources available</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div>
                    <Card>
                      <CardHeader>
                        <CardTitle>{selectedResource ? "Edit Resource" : "Add New Resource"}</CardTitle>
                        <CardDescription>{selectedResource ? "Update resource details" : "Create a new educational resource"}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Form {...resourceForm}>
                          <form onSubmit={resourceForm.handleSubmit(onResourceSubmit)} className="space-y-4">
                            <FormField
                              control={resourceForm.control}
                              name="title"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="dark:text-white">Title</FormLabel>
                                  <FormControl>
                                    <Input placeholder="Enter resource title" className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400" {...field} />
                                  </FormControl>
                                  <FormMessage className="dark:text-red-400" />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={resourceForm.control}
                              name="description"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="dark:text-white">Description</FormLabel>
                                  <FormControl>
                                    <Textarea placeholder="Describe the resource" className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400" {...field} />
                                  </FormControl>
                                  <FormMessage className="dark:text-red-400" />
                                </FormItem>
                              )}
                            />
                            
                            <div className="grid grid-cols-2 gap-4">
                              <FormField
                                control={resourceForm.control}
                                name="type"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="dark:text-white">Resource Type</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="document">Document</SelectItem>
                                        <SelectItem value="video">Video</SelectItem>
                                        <SelectItem value="link">Link</SelectItem>
                                        <SelectItem value="quiz">Quiz</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage className="dark:text-red-400" />
                                  </FormItem>
                                )}
                              />
                              
                              <FormField
                                control={resourceForm.control}
                                name="category"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="dark:text-white">Category</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                        <SelectTrigger>
                                          <SelectValue placeholder="Select category" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="Physics - Mechanics">Physics - Mechanics</SelectItem>
                                        <SelectItem value="Physics - Electricity">Physics - Electricity</SelectItem>
                                        <SelectItem value="Chemistry - Organic">Chemistry - Organic</SelectItem>
                                        <SelectItem value="Chemistry - Inorganic">Chemistry - Inorganic</SelectItem>
                                        <SelectItem value="Math - Algebra">Math - Algebra</SelectItem>
                                        <SelectItem value="Math - Calculus">Math - Calculus</SelectItem>
                                        <SelectItem value="Biology - Genetics">Biology - Genetics</SelectItem>
                                        <SelectItem value="CS - Programming">CS - Programming</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage className="dark:text-red-400" />
                                  </FormItem>
                                )}
                              />
                            </div>
                            
                            <FormField
                              control={resourceForm.control}
                              name="url"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="dark:text-white">Resource URL</FormLabel>
                                  <FormControl>
                                    <Input placeholder="https://example.com/resource" className="dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400" {...field} />
                                  </FormControl>
                                  <FormMessage className="dark:text-red-400" />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={resourceForm.control}
                              name="isPublic"
                              render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                                  <div className="space-y-0.5">
                                    <FormLabel className="dark:text-white">Public Resource</FormLabel>
                                    <FormDescription className="dark:text-gray-400">
                                      Make this resource visible to all users
                                    </FormDescription>
                                  </div>
                                  <FormControl>
                                    <input
                                      type="checkbox"
                                      checked={field.value}
                                      onChange={field.onChange}
                                      className="accent-primary h-5 w-5"
                                    />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            
                            <div>
                              <FormLabel className="dark:text-white">Tags</FormLabel>
                              <div className="flex flex-wrap gap-2 mb-2">
                                {resourceTags.map((tag, index) => (
                                  <Badge key={index} variant="secondary" className="flex items-center gap-1 dark:text-white">
                                    {tag}
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-4 w-4 p-0 text-muted-foreground"
                                      onClick={() => removeTag(tag)}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </Badge>
                                ))}
                              </div>
                              
                              <div className="flex gap-2">
                                <Input
                                  placeholder="Add a tag"
                                  value={newTag}
                                  onChange={(e) => setNewTag(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.preventDefault();
                                      addTag();
                                    }
                                  }}
                                />
                                <Button type="button" onClick={addTag} size="sm">
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1 dark:text-gray-400">
                                Press Enter or click + to add a tag
                              </p>
                            </div>
                            
                            <div className="pt-4 flex justify-between">
                              {selectedResource && (
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedResource(null);
                                    resourceForm.reset();
                                    setResourceTags([]);
                                  }}
                                >
                                  Cancel
                                </Button>
                              )}
                              <Button
                                type="submit"
                                className={selectedResource ? "" : "w-full"}
                                disabled={isLoading}
                              >
                                {isLoading
                                  ? selectedResource
                                    ? "Updating..."
                                    : "Creating..."
                                  : selectedResource
                                  ? "Update Resource"
                                  : "Add Resource"
                                }
                              </Button>
                            </div>
                          </form>
                        </Form>
                      </CardContent>
                    </Card>
                  </div>
                </div>
                
                {/* Resource Delete Confirmation Dialog */}
                {isResourceDeleteDialogOpen && (
                  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-[400px]">
                      <CardHeader>
                        <CardTitle>Confirm Deletion</CardTitle>
                        <CardDescription>
                          This action cannot be undone. The resource will be permanently deleted.
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p>Are you sure you want to delete this resource?</p>
                      </CardContent>
                      <CardFooter className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setIsResourceDeleteDialogOpen(false);
                            setResourceToDelete(null);
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          variant="destructive" 
                          onClick={() => resourceToDelete && handleDeleteResource(resourceToDelete)}
                          disabled={isLoading}
                        >
                          {isLoading ? "Deleting..." : "Delete"}
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                )}
              </TabsContent>
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin; 