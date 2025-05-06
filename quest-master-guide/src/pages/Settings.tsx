import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { toast } from "@/components/ui/use-toast";
import api from '@/lib/api';
import { motion } from "framer-motion";
import { SlideUp, SlideInLeft, ScaleIn, StaggerContainer, StaggerItem, AnimatedButton } from "@/components/animations";

interface UserData {
  name: string;
  email: string;
  role: 'student' | 'admin';
}

const Settings = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('account');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get('/auth/me');
        const user = response.data.data.user;
        setUserData(user);
        setFormData(prevState => ({
          ...prevState,
          name: user.name
        }));
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [id]: value
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (formData.password && formData.password !== formData.confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);
      
      // Prepare data for API - only include fields with values
      const updateData: {name?: string; password?: string} = {};
      if (formData.name && formData.name !== userData?.name) {
        updateData.name = formData.name;
      }
      if (formData.password) {
        updateData.password = formData.password;
      }

      // Don't make API call if no changes
      if (Object.keys(updateData).length === 0) {
        toast({
          title: "Info",
          description: "No changes to save",
        });
        setIsSaving(false);
        return;
      }

      // Update profile
      const response = await api.patch('/auth/updateMe', updateData);
      
      // Update local state with new data
      setUserData(response.data.data.user);
      
      // Clear password fields
      setFormData(prevState => ({
        ...prevState,
        password: '',
        confirmPassword: '',
        name: response.data.data.user.name
      }));
      
      toast({
        title: "Success",
        description: "Your settings have been updated",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form to current user data
    if (userData) {
      setFormData({
        name: userData.name,
        password: '',
        confirmPassword: ''
      });
    }
  };

  if (isLoading) {
    return (
      <Layout title="Settings" description="Manage your account preferences">
        <ScaleIn className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <motion.p 
            className="dark:text-gray-300"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Loading...
          </motion.p>
        </ScaleIn>
      </Layout>
    );
  }

  return (
    <Layout title="Settings" description="Manage your account preferences">
      <ScaleIn className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <motion.nav className="flex flex-col sm:flex-row">
            <AnimatedButton
              type="button"
              variant="ghost"
              className={`text-gray-600 dark:text-gray-300 py-4 px-6 block hover:text-exam-primary focus:outline-none font-medium ${activeTab === 'account' ? 'border-b-2 border-exam-primary' : ''}`}
              onClick={() => setActiveTab('account')}
            >
              Account
            </AnimatedButton>
            <AnimatedButton
              type="button"
              variant="ghost"
              className={`text-gray-600 dark:text-gray-300 py-4 px-6 block hover:text-exam-primary focus:outline-none ${activeTab === 'notifications' ? 'border-b-2 border-exam-primary' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              Notifications
            </AnimatedButton>
            <AnimatedButton
              type="button"
              variant="ghost"
              className={`text-gray-600 dark:text-gray-300 py-4 px-6 block hover:text-exam-primary focus:outline-none ${activeTab === 'privacy' ? 'border-b-2 border-exam-primary' : ''}`}
              onClick={() => setActiveTab('privacy')}
            >
              Privacy
            </AnimatedButton>
          </motion.nav>
        </div>
        
        <div className="p-6">
          <SlideInLeft>
            <h2 className="text-lg font-medium mb-4 dark:text-white">
              {activeTab === 'account' && 'Account Settings'}
              {activeTab === 'notifications' && 'Notification Settings'}
              {activeTab === 'privacy' && 'Privacy Settings'}
            </h2>
          </SlideInLeft>
          
          {activeTab === 'account' && (
            <motion.form 
              onSubmit={handleSave} 
              className="space-y-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <StaggerContainer className="grid grid-cols-1 gap-6">
                <StaggerItem>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                    <motion.input
                      type="email"
                      id="email"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-exam-primary focus:border-exam-primary dark:bg-gray-700 dark:text-gray-300 opacity-75"
                      value={userData?.email || ''}
                      disabled
                      whileFocus={{ scale: 1.01 }}
                    />
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Email cannot be changed</p>
                  </div>
                </StaggerItem>
                
                <StaggerItem>
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                    <motion.input
                      type="text"
                      id="name"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-exam-primary focus:border-exam-primary dark:bg-gray-700 dark:text-gray-300"
                      value={formData.name}
                      onChange={handleChange}
                      whileFocus={{ scale: 1.01 }}
                    />
                  </div>
                </StaggerItem>
                
                <StaggerItem>
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                    <motion.input
                      type="password"
                      id="password"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-exam-primary focus:border-exam-primary dark:bg-gray-700 dark:text-gray-300"
                      placeholder="Leave blank to keep current password"
                      value={formData.password}
                      onChange={handleChange}
                      whileFocus={{ scale: 1.01 }}
                    />
                  </div>
                </StaggerItem>
                
                <StaggerItem>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
                    <motion.input
                      type="password"
                      id="confirmPassword"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-exam-primary focus:border-exam-primary dark:bg-gray-700 dark:text-gray-300"
                      placeholder="Confirm new password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      whileFocus={{ scale: 1.01 }}
                    />
                  </div>
                </StaggerItem>
                
                <StaggerItem>
                  <div className="pt-5">
                    <div className="flex justify-end">
                      <AnimatedButton
                        type="button"
                        onClick={handleCancel}
                        variant="outline"
                        className="dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                      >
                        Cancel
                      </AnimatedButton>
                      <AnimatedButton
                        type="submit"
                        disabled={isSaving}
                        className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-exam-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-exam-primary dark:focus:ring-offset-gray-800 disabled:opacity-75"
                      >
                        {isSaving ? (
                          <span className="flex items-center">
                            <motion.span
                              className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"
                              animate={{ rotate: 360 }}
                              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            />
                            Saving...
                          </span>
                        ) : 'Save Changes'}
                      </AnimatedButton>
                    </div>
                  </div>
                </StaggerItem>
              </StaggerContainer>
            </motion.form>
          )}
          
          {activeTab === 'notifications' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="p-4 bg-blue-50 border border-blue-200 rounded-md dark:bg-blue-900/20 dark:border-blue-800"
            >
              <p className="text-blue-700 dark:text-blue-300">
                Notification settings will be available in a future update.
              </p>
            </motion.div>
          )}
          
          {activeTab === 'privacy' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="p-4 bg-blue-50 border border-blue-200 rounded-md dark:bg-blue-900/20 dark:border-blue-800"
            >
              <p className="text-blue-700 dark:text-blue-300">
                Privacy settings will be available in a future update.
              </p>
            </motion.div>
          )}
        </div>
      </ScaleIn>
    </Layout>
  );
};

export default Settings;
