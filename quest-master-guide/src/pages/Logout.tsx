import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "@/components/ui/use-toast";

const Logout = () => {
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(true);
  
  useEffect(() => {
    const performLogout = () => {
      try {
        // Clear all auth-related items from localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        
        // Add any other auth-related items that should be cleared
        sessionStorage.clear(); // Clear any session storage as well
        
        // Show success toast
        toast({
          title: "Logged out",
          description: "You have been successfully logged out.",
        });
        
        // Set a flag to track successful logout
        setIsLoggingOut(false);
        
        // Redirect to login page with a small delay to ensure state is updated
        setTimeout(() => {
          navigate('/login', { replace: true });
        }, 100);
      } catch (error) {
        console.error('Logout error:', error);
        // Force redirect on error
        navigate('/login', { replace: true });
      }
    };
    
    if (isLoggingOut) {
      performLogout();
    }
  }, [navigate, isLoggingOut]);
  
  // Show a minimal loading state while logout is processing
  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Logging out...</p>
    </div>
  );
};

export default Logout;
