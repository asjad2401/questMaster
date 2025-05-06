import { useEffect, useState } from 'react';
import Layout from "@/components/Layout";
import { toast } from "@/components/ui/use-toast";
import api from '@/lib/api';

interface UserData {
  name: string;
  email: string;
  createdAt: string;
  role: 'student' | 'admin';
}

const Profile = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get('/auth/me');
        setUserData(response.data.data.user);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch user data",
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
      <Layout title="My Profile" description="View and manage your personal information">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <p className="dark:text-gray-300">Loading...</p>
        </div>
      </Layout>
    );
  }

  if (!userData) {
    return (
      <Layout title="My Profile" description="View and manage your personal information">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <p className="dark:text-gray-300">No user data available</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="My Profile" description="View and manage your personal information">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1">
            <div className="flex flex-col items-center">
              <div className="w-32 h-32 rounded-full overflow-hidden mb-4 bg-exam-primary flex items-center justify-center">
                <span className="text-4xl text-white font-bold">
                  {userData.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <h2 className="text-xl font-semibold dark:text-white">{userData.name}</h2>
              <p className="text-gray-500 dark:text-gray-400">{userData.email}</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1 capitalize">{userData.role}</p>
            </div>
          </div>
          
          <div className="col-span-2">
            <h3 className="text-lg font-medium mb-4 dark:text-white">Profile Information</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                  <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md dark:text-gray-300">{userData.name}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md dark:text-gray-300">{userData.email}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Registration Date</label>
                  <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md dark:text-gray-300">
                    {new Date(userData.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Account Type</label>
                  <div className="mt-1 p-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md dark:text-gray-300 capitalize">
                    {userData.role}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;
