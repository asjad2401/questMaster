import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Menu, User } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "@/components/ui/use-toast";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { motion, AnimatePresence } from "framer-motion";
import { SlideDown, MotionButton, MotionLink } from "@/components/animations";
import api from '@/lib/api';

interface UserData {
  name: string;
  email: string;
  role: 'student' | 'admin';
}

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);

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
      }
    };

    fetchUserData();
  }, []);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  // Variants for navbar animations
  const navVariants = {
    hidden: { y: -10, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1, 
      transition: { duration: 0.3 } 
    }
  };

  const linkVariants = {
    hover: { scale: 1.05, transition: { duration: 0.2 } }
  };

  const mobileMenuVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { 
      opacity: 1, 
      height: 'auto', 
      transition: { 
        duration: 0.3,
        staggerChildren: 0.1,
        when: "beforeChildren"
      } 
    }
  };

  const mobileItemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <motion.nav 
      className="bg-exam-primary text-white shadow-md"
      initial="hidden"
      animate="visible"
      variants={navVariants}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <motion.div 
              className="flex-shrink-0"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link to="/" className="font-bold text-xl">ExamPrep</Link>
            </motion.div>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <motion.div whileHover="hover" variants={linkVariants}>
                  <Link to="/" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-exam-primary hover:bg-opacity-75">Dashboard</Link>
                </motion.div>
                <motion.div whileHover="hover" variants={linkVariants}>
                  <Link to="/practice-tests" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-exam-primary hover:bg-opacity-75">Practice Tests</Link>
                </motion.div>
                <motion.div whileHover="hover" variants={linkVariants}>
                  <Link to="/analytics" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-exam-primary hover:bg-opacity-75">Analytics</Link>
                </motion.div>
                <motion.div whileHover="hover" variants={linkVariants}>
                  <Link to="/resources" className="px-3 py-2 rounded-md text-sm font-medium hover:bg-exam-primary hover:bg-opacity-75">Resources</Link>
                </motion.div>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="flex items-center">
              <ThemeToggle />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <MotionButton 
                    variant="secondary" 
                    className="ml-4"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </MotionButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <motion.div whileHover={{ scale: 1.1 }}>
                      <Avatar>
                        <AvatarFallback>
                          {userData ? getInitials(userData.name) : 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </motion.div>
                    <div className="flex flex-col">
                      <DropdownMenuLabel className="font-normal">
                        {userData?.name || 'Loading...'}
                      </DropdownMenuLabel>
                      <p className="text-xs text-muted-foreground">
                        {userData?.email || 'Loading...'}
                      </p>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Link to="/profile" className="flex w-full">My Profile</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Link to="/settings" className="flex w-full">Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <Link to="/logout" className="flex w-full">Logout</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="md:hidden">
            <MotionButton 
              variant="ghost" 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <Menu />
            </MotionButton>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            className="md:hidden"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={mobileMenuVariants}
          >
            <motion.div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-exam-primary">
              <motion.div variants={mobileItemVariants}>
                <Link to="/" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-exam-primary hover:bg-opacity-75">Dashboard</Link>
              </motion.div>
              <motion.div variants={mobileItemVariants}>
                <Link to="/practice-tests" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-exam-primary hover:bg-opacity-75">Practice Tests</Link>
              </motion.div>
              <motion.div variants={mobileItemVariants}>
                <Link to="/analytics" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-exam-primary hover:bg-opacity-75">Analytics</Link>
              </motion.div>
              <motion.div variants={mobileItemVariants}>
                <Link to="/resources" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-exam-primary hover:bg-opacity-75">Resources</Link>
              </motion.div>
              
              <motion.div variants={mobileItemVariants} className="pt-4 pb-3 border-t border-gray-700">
                <div className="flex items-center px-3">
                  <motion.div 
                    className="flex-shrink-0"
                    whileHover={{ scale: 1.1 }}
                  >
                    <Avatar>
                      <AvatarFallback>
                        {userData ? getInitials(userData.name) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>
                  <div className="ml-3">
                    <div className="text-base font-medium">
                      {userData?.name || 'Loading...'}
                    </div>
                    <div className="text-sm font-medium text-gray-300">
                      {userData?.email || 'Loading...'}
                    </div>
                  </div>
                </div>
                <div className="mt-3 space-y-1 px-2">
                  <motion.div variants={mobileItemVariants} className="px-3 py-2">
                    <ThemeToggle />
                  </motion.div>
                  <motion.div variants={mobileItemVariants}>
                    <Link to="/profile" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-exam-primary hover:bg-opacity-75">My Profile</Link>
                  </motion.div>
                  <motion.div variants={mobileItemVariants}>
                    <Link to="/settings" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-exam-primary hover:bg-opacity-75">Settings</Link>
                  </motion.div>
                  <motion.div variants={mobileItemVariants}>
                    <Link to="/logout" className="block px-3 py-2 rounded-md text-base font-medium hover:bg-exam-primary hover:bg-opacity-75">Logout</Link>
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
