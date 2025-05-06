
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ResourceCardProps {
  title: string;
  description: string;
  type: "video" | "article" | "quiz" | "book";
  difficulty: "beginner" | "intermediate" | "advanced";
  tags: string[];
  link: string;
  recommended?: boolean;
}

const ResourceCard = ({
  title,
  description,
  type,
  difficulty,
  tags,
  link,
  recommended = false
}: ResourceCardProps) => {
  const getTypeColor = () => {
    switch (type) {
      case "video": return "bg-blue-100 text-blue-800";
      case "article": return "bg-green-100 text-green-800";
      case "quiz": return "bg-purple-100 text-purple-800";
      case "book": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  
  const getDifficultyColor = () => {
    switch (difficulty) {
      case "beginner": return "bg-green-100 text-green-800";
      case "intermediate": return "bg-yellow-100 text-yellow-800";
      case "advanced": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  
  return (
    <Card className={recommended ? "border-exam-primary border-2" : ""}>
      <CardHeader>
        <div className="flex justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>

        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor()}`}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor()}`}>
            {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
          </span>
          {tags.map((tag, index) => (
            <Badge key={index} variant="secondary">{tag}</Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full">
          <a href={link} target="_blank" rel="noopener noreferrer">
            {type === "video" ? "Watch" : type === "quiz" ? "Take Quiz" : "View"}
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ResourceCard;
