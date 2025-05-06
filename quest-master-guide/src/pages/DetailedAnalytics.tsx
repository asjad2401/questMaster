import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
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

const DetailedAnalytics = () => {
  const [performanceData, setPerformanceData] = useState<UserPerformance | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Colors for pie charts
  const COLORS = ['#2c7a7b', '#4299e1', '#ed8936'];
  
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
      <Layout title="Detailed Analytics" description="Loading your analytics data...">
        {/* Loading content */}
      </Layout>
    );
  }

  // If no data, show placeholder
  if (!performanceData || performanceData.testsAttempted === 0) {
    return (
      <Layout title="Detailed Analytics" description="Start taking tests to see your analytics">
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
    <Layout title="Detailed Analytics" description="In-depth analysis of your performance and recommendations">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end mb-6">
        <Button variant="outline" className="mt-4 sm:mt-0" asChild>
          <Link to="/analytics">Back to Overview</Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Topic Performance Breakdown</CardTitle>
            <CardDescription>Your performance across different topics</CardDescription>
          </CardHeader>
          <CardContent className="dark:bg-gray-800">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={performanceData.topicBreakdown || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {(performanceData.topicBreakdown || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', borderColor: 'rgba(30, 41, 59, 0.8)' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Answer Distribution</CardTitle>
            <CardDescription>Breakdown of your test responses</CardDescription>
          </CardHeader>
          <CardContent className="dark:bg-gray-800">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={performanceData.answerDistribution || []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {(performanceData.answerDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}`} contentStyle={{ backgroundColor: 'rgba(30, 41, 59, 0.8)', borderColor: 'rgba(30, 41, 59, 0.8)' }} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Areas for Improvement</CardTitle>
            <CardDescription>Focused recommendations to help you improve</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {performanceData.weakSubjects && performanceData.weakSubjects.length > 0 ? (
                performanceData.weakSubjects.map((topic, index) => {
                  // Find the corresponding improvement area data
                  const areaData = performanceData.improvementAreas.find(
                    area => area.topic === topic
                  ) || { performance: 0, tips: `Focus on improving your understanding of ${topic} concepts.` };
                  
                  return (
                    <div key={index} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold dark:text-white">{topic}</h3>
                          <div className="flex items-center mt-1">
                            <Badge variant={areaData.performance < 40 ? "destructive" : areaData.performance < 70 ? "default" : "outline"}>
                              {areaData.performance}% Proficiency
                            </Badge>
                          </div>
                        </div>
                        <div className="mt-2 md:mt-0">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/resources?category=${encodeURIComponent(topic)}`}>Find Resources</Link>
                          </Button>
                        </div>
                      </div>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">{areaData.tips}</p>
                    </div>
                  );
                })
              ) : (
                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg text-center">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-100 mb-2">Great Job!</h3>
                  <p className="text-blue-700 dark:text-blue-200">
                    You've shown strong performance across all topics. Keep up the good work!
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default DetailedAnalytics;
