import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/use-toast";
import api from '@/lib/api';

interface UserPerformance {
  name: string;
  testsAttempted: number;
  averageScore: number;
  timeSpent: string;
  strongSubjects: string[];
  weakSubjects: string[];
  recentTests: {
    id: string;
    name: string;
    score: number;
    date: string;
  }[];
  categoryPerformance: {
    category: string;
    score: number;
  }[];
}

const UserSummary = () => {
  const [userData, setUserData] = useState<UserPerformance | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get('/users/performance');
        setUserData(response.data.data);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch performance data",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>No Data Available</CardTitle>
            <CardDescription>Start taking tests to see your performance</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Welcome, {userData.name}!</CardTitle>
          <CardDescription>Here's your performance overview</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Tests Attempted</p>
              <p className="text-2xl font-bold">{userData.testsAttempted}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Average Score</p>
              <p className="text-2xl font-bold">{userData.averageScore}%</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Time Spent</p>
              <p className="text-2xl font-bold">{userData.timeSpent}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Strong Subjects</p>
              <p className="text-2xl font-bold">{userData.strongSubjects.join(', ')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subject Performance</CardTitle>
          <CardDescription>Your scores across different subjects</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {userData.categoryPerformance.map((category) => (
              <div key={category.category} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{category.category}</span>
                  <span className="text-muted-foreground">{category.score}%</span>
                </div>
                <Progress value={category.score} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Tests</CardTitle>
          <CardDescription>Your latest practice test results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs bg-muted">
                <tr>
                  <th className="px-4 py-2 rounded-tl-lg">Test Name</th>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2 rounded-tr-lg">Score</th>
                </tr>
              </thead>
              <tbody>
                {userData.recentTests.map((test) => (
                  <tr key={test.id} className="border-b">
                    <td className="px-4 py-3 font-medium">{test.name}</td>
                    <td className="px-4 py-3">{new Date(test.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <span className={`mr-2 ${test.score >= 75 ? 'text-green-600' : test.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                          {test.score}%
                        </span>
                        <Progress value={test.score} className="h-1.5 w-16" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserSummary;
