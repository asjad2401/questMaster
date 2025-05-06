import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    category: string;
    difficulty: string;
  }[];
}

const PracticeTests = () => {
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        const response = await api.get('/tests');
        console.log('API Response:', response.data);
        setTests(response.data.data.tests);
      } catch (error) {
        console.error('Error fetching tests:', error);
        toast({
          title: "Error",
          description: "Failed to fetch tests",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchTests();
  }, []);

  if (isLoading) {
    return (
      <Layout title="Practice Tests" description="Choose a test to start practicing">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout title="Practice Tests" description="Choose a test to start practicing">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tests.map((test) => (
          <Card key={test._id}>
            <CardHeader>
              <CardTitle>{test.title}</CardTitle>
              <CardDescription>{test.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="font-medium dark:text-gray-200">{test.duration} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Questions:</span>
                  <span className="font-medium dark:text-gray-200">{test.questions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Passing Marks:</span>
                  <span className="font-medium dark:text-gray-200">{test.passingMarks}%</span>
                </div>
              </div>
              <Button asChild className="w-full">
                <Link to={`/test/${test._id}`}>Start Test</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {tests.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">No tests available at the moment.</p>
          </CardContent>
        </Card>
      )}
    </Layout>
  );
};

export default PracticeTests; 