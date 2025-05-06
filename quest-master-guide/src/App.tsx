import { useEffect, useState, createContext, useContext } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence } from 'framer-motion';
import { PageTransition } from './components/animations';
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Index from "./pages/Index";
import TestInterface from "./pages/TestInterface";
import PracticeTests from "./pages/PracticeTests";
import Analytics from "./pages/Analytics";
import DetailedAnalytics from "./pages/DetailedAnalytics";
import Resources from "./pages/Resources";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Logout from "./pages/Logout";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import api from './lib/api';

const queryClient = new QueryClient();

// Auth provider to manage authentication state
interface AuthContextType {
  isAuthenticated: boolean;
  userRole: string | null;
  checkAuthStatus: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  userRole: null,
  checkAuthStatus: () => {},
});

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const checkAuthStatus = () => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    
    if (token) {
      setIsAuthenticated(true);
      setUserRole(role);
    } else {
      setIsAuthenticated(false);
      setUserRole(null);
    }
    
    setIsLoading(false);
  };
  
  useEffect(() => {
    checkAuthStatus();
    
    // Validate token with the server
    const validateToken = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await api.get('/auth/me');
          // Token is valid
          setIsAuthenticated(true);
        } catch (error) {
          // Token is invalid
          localStorage.removeItem('token');
          localStorage.removeItem('userRole');
          setIsAuthenticated(false);
          setUserRole(null);
        }
      }
      setIsLoading(false);
    };
    
    validateToken();
  }, []);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, userRole, checkAuthStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
const useAuth = () => {
  return useContext(AuthContext);
};

// Animated routes wrapper component
const AnimatedRoutes = () => {
  const location = useLocation();
  const { isAuthenticated, userRole, checkAuthStatus } = useAuth();
  
  // Ensure auth state is up to date on route change
  useEffect(() => {
    checkAuthStatus();
  }, [location.pathname, checkAuthStatus]);
  
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route path="/login" element={
          <PublicRoute isAuthenticated={isAuthenticated}>
            <PageTransition>
              <Login />
            </PageTransition>
          </PublicRoute>
        } />
        <Route path="/signup" element={
          <PublicRoute isAuthenticated={isAuthenticated}>
            <PageTransition>
              <Signup />
            </PageTransition>
          </PublicRoute>
        } />
        
        {/* Protected routes - Student only */}
        <Route path="/" element={
          <StudentRoute isAuthenticated={isAuthenticated} userRole={userRole}>
            <PageTransition>
              <Index />
            </PageTransition>
          </StudentRoute>
        } />
        <Route path="/practice-tests" element={
          <StudentRoute isAuthenticated={isAuthenticated} userRole={userRole}>
            <PageTransition>
              <PracticeTests />
            </PageTransition>
          </StudentRoute>
        } />
        <Route path="/test/:id" element={
          <StudentRoute isAuthenticated={isAuthenticated} userRole={userRole}>
            <PageTransition>
              <TestInterface />
            </PageTransition>
          </StudentRoute>
        } />
        <Route path="/analytics" element={
          <StudentRoute isAuthenticated={isAuthenticated} userRole={userRole}>
            <PageTransition>
              <Analytics />
            </PageTransition>
          </StudentRoute>
        } />
        <Route path="/detailed-analytics" element={
          <StudentRoute isAuthenticated={isAuthenticated} userRole={userRole}>
            <PageTransition>
              <DetailedAnalytics />
            </PageTransition>
          </StudentRoute>
        } />
        <Route path="/resources" element={
          <StudentRoute isAuthenticated={isAuthenticated} userRole={userRole}>
            <PageTransition>
              <Resources />
            </PageTransition>
          </StudentRoute>
        } />
        
        {/* Protected routes - All authenticated users */}
        <Route path="/profile" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <PageTransition>
              <Profile />
            </PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute isAuthenticated={isAuthenticated}>
            <PageTransition>
              <Settings />
            </PageTransition>
          </ProtectedRoute>
        } />
        <Route path="/logout" element={
          <PageTransition>
            <Logout />
          </PageTransition>
        } />

        {/* Admin routes */}
        <Route path="/admin" element={
          <AdminRoute isAuthenticated={isAuthenticated} userRole={userRole}>
            <PageTransition>
              <Admin />
            </PageTransition>
          </AdminRoute>
        } />

        {/* 404 route */}
        <Route path="*" element={
          <PageTransition>
            <NotFound />
          </PageTransition>
        } />
      </Routes>
    </AnimatePresence>
  );
};

// Protected Route component - Any authenticated user
const ProtectedRoute = ({ children, isAuthenticated }: { children: React.ReactNode, isAuthenticated: boolean }) => {
  const location = useLocation();

  if (!isAuthenticated) {
    // Save the attempted URL to redirect back after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};

// Admin Route component - Admin only
const AdminRoute = ({ 
  children, 
  isAuthenticated, 
  userRole 
}: { 
  children: React.ReactNode, 
  isAuthenticated: boolean,
  userRole: string | null
}) => {
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (userRole !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Student Route component - Student only
const StudentRoute = ({ 
  children, 
  isAuthenticated,
  userRole
}: { 
  children: React.ReactNode, 
  isAuthenticated: boolean,
  userRole: string | null
}) => {
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect admins to admin dashboard
  if (userRole === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};

// Public Route component (redirects to home based on role if already authenticated)
const PublicRoute = ({ children, isAuthenticated }: { children: React.ReactNode, isAuthenticated: boolean }) => {
  const location = useLocation();
  const { userRole } = useAuth();
  const from = location.state?.from?.pathname || '/';

  if (isAuthenticated) {
    // Redirect based on user role
    const targetPath = userRole === 'admin' ? '/admin' : from;
    return <Navigate to={targetPath} replace />;
  }
  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AnimatedRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
