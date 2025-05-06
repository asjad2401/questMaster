import Navbar from "@/components/Navbar";
import UserSummary from "@/components/UserSummary";
import QuickActions from "@/components/QuickActions";

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <main className="exam-container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-exam-primary mb-2 dark:text-white">Your Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-300">Track your progress and prepare for success</p>
        </div>
        
        <div className="mb-10">
          <h2 className="text-xl font-medium mb-4 dark:text-white">Quick Actions</h2>
          <QuickActions />
        </div>
        
        <div>
          <h2 className="text-xl font-medium mb-4 dark:text-white">Your Performance Summary</h2>
          <UserSummary />
        </div>
      </main>
    </div>
  );
};

export default Index;
