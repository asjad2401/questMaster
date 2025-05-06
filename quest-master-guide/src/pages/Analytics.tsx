import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import PerformanceChart from "@/components/PerformanceChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
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
    timeSpent: string;
  }[];
  categoryPerformance: {
    category: string;
    score: number;
  }[];
  topicBreakdown: {
    name: string;
    value: number;
  }[];
  answerDistribution: {
    name: string;
    value: number;
  }[];
  improvementAreas: {
    topic: string;
    performance: number;
    tips: string;
  }[];
}

const Analytics = () => {
  const [performanceData, setPerformanceData] = useState<UserPerformance | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPerformanceData = async () => {
      try {
        const response = await api.get('/users/performance');
        setPerformanceData(response.data.data);
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

    fetchPerformanceData();
  }, []);

  // If loading, show loading state
  if (isLoading) {
    return (
      <Layout title="Performance Analytics" description="Loading your analytics data...">
        {/* Loading content goes here */}
      </Layout>
    );
  }

  // If no data, show placeholder
  if (!performanceData || performanceData.testsAttempted === 0) {
    return (
      <Layout title="Performance Analytics" description="Start taking tests to see your analytics">
        <Card className="max-w-xl mx-auto">
          <CardHeader>
            <CardTitle>No Data Available</CardTitle>
            <CardDescription>You haven't attempted any tests yet. Take some practice tests to see your performance analytics.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/practice-tests">Find Practice Tests</Link>
            </Button>
          </CardContent>
        </Card>
      </Layout>
    );
  }

  return (
    <Layout title="Performance Analytics" description="Track your test scores and identify improvement areas">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="hidden">
          {/* Hidden because the title is already in the Layout */}
        </div>
        <Button asChild className="mt-4 sm:mt-0">
          <Link to="/detailed-analytics">View Detailed Analytics</Link>
        </Button>
      </div>
      
      <div className="space-y-8">
        {/* Pass real data to PerformanceChart */}
        <PerformanceChart data={performanceData.categoryPerformance} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Test Performance</CardTitle>
              <CardDescription>Your latest test results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs bg-muted dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-2 rounded-tl-lg">Test Name</th>
                      <th className="px-4 py-2">Score</th>
                      <th className="px-4 py-2">Date</th>
                      <th className="px-4 py-2 rounded-tr-lg">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceData.recentTests.map((test) => (
                      <tr key={test.id} className="border-b dark:border-gray-700">
                        <td className="px-4 py-3 font-medium dark:text-gray-200">{test.name}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            test.score >= 80 ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : 
                            test.score >= 70 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100' : 
                            'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
                          }`}>
                            {test.score}%
                          </span>
                        </td>
                        <td className="px-4 py-3 dark:text-gray-300">{test.date}</td>
                        <td className="px-4 py-3 dark:text-gray-300">{test.timeSpent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Strengths & Weaknesses</CardTitle>
              <CardDescription>Topics to focus on for improvement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-green-700 dark:text-green-400">Your Strongest Topics</h3>
                  <ul className="space-y-2">
                    {performanceData.strongSubjects.map((topic, index) => {
                      const topicData = performanceData.improvementAreas && 
                                       performanceData.improvementAreas.length > 0 ? 
                                       performanceData.improvementAreas.find(item => item.topic === topic) : 
                                       null;
                      return (
                        <li key={index} className="flex items-center justify-between bg-green-50 dark:bg-green-900/30 p-2 rounded">
                          <span className="dark:text-gray-200">{topic}</span>
                          <span className="text-green-700 dark:text-green-400 font-semibold">
                            {topicData ? `${topicData.performance}%` : 'N/A'}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                
                <div>
                  <h3 className="text-sm font-semibold mb-3 text-red-700 dark:text-red-400">Areas for Improvement</h3>
                  {performanceData.weakSubjects && performanceData.weakSubjects.length > 0 ? (
                    <ul className="space-y-2">
                      {performanceData.weakSubjects.map((topic, index) => {
                        const topicData = performanceData.improvementAreas && 
                                        performanceData.improvementAreas.length > 0 ? 
                                        performanceData.improvementAreas.find(item => item.topic === topic) : 
                                        null;
                        return (
                          <li key={index} className="flex items-center justify-between bg-red-50 dark:bg-red-900/30 p-2 rounded">
                            <span className="dark:text-gray-200">{topic}</span>
                            <span className="text-red-700 dark:text-red-400 font-semibold">
                              {topicData ? `${topicData.performance}%` : 'N/A'}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded text-blue-800 dark:text-blue-200">
                      Great job! You don't have any weak areas. Keep up the good work!
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Analytics;
