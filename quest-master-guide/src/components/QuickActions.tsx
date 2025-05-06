import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ChartBar, Book, Calendar } from "lucide-react";

const QuickActions = () => {
  const actions = [
    { 
      title: "Start Practice Test", 
      description: "Begin a new practice test session",
      icon: Calendar,
      link: "/practice-tests",
      primary: true
    },
    { 
      title: "View Analytics", 
      description: "Check your performance insights",
      icon: ChartBar,
      link: "/analytics",
      primary: false
    },
    { 
      title: "Study Resources", 
      description: "Access guides and preparation materials",
      icon: Book,
      link: "/resources",
      primary: false
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {actions.map((action, index) => (
        <Card key={index} className={action.primary ? "border-exam-primary border-2" : ""}>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className={`rounded-full p-3 ${action.primary ? 'bg-exam-primary' : 'bg-exam-secondary'} text-white`}>
                <action.icon size={24} />
              </div>
              <h3 className="font-medium text-lg">{action.title}</h3>
              <p className="text-sm text-muted-foreground">{action.description}</p>
              <Button variant={action.primary ? "default" : "outline"} asChild className="mt-2">
                <Link to={action.link}>{action.primary ? "Start Now" : "View"}</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default QuickActions;
