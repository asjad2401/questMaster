import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import ResourceCard from "@/components/ResourceCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";
import { toast } from "@/components/ui/use-toast";
import api from '@/lib/api';

// Resource interface to match database schema
interface Resource {
  _id: string;
  title: string;
  description: string;
  type: 'document' | 'video' | 'link' | 'quiz';
  url: string;
  category: string;
  tags: string[];
  viewCount: number;
  isPublic: boolean;
  createdAt: string;
}

const Resources = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all-types");
  const [filterCategory, setFilterCategory] = useState<string>("all-categories");
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch resources from API
  useEffect(() => {
    const fetchResources = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/resources');
        // Only show public resources
        const publicResources = response.data.data.resources.filter(
          (resource: Resource) => resource.isPublic
        );
        setResources(publicResources);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to fetch resources",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchResources();
  }, []);
  
  // Filter resources based on search and filters
  const filteredResources = resources.filter(resource => {
    const matchesSearch = 
      searchTerm === "" || 
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
      
    const matchesType = filterType === "all-types" || resource.type === filterType;
    const matchesCategory = filterCategory === "all-categories" || resource.category.includes(filterCategory);
    
    return matchesSearch && matchesType && matchesCategory;
  });
  
  // Group resources by category
  const groupedResources = filteredResources.reduce((acc, resource) => {
    // Extract main subject (e.g., "Physics" from "Physics - Mechanics")
    const mainSubject = resource.category.split(' - ')[0];
    
    if (!acc[mainSubject]) {
      acc[mainSubject] = [];
    }
    acc[mainSubject].push(resource);
    return acc;
  }, {} as Record<string, Resource[]>);
  
  // Get all unique categories for the filter
  const allCategories = [...new Set(resources.map(r => r.category))];
  
  // Get recommended resources (based on view count, showing top 6)
  const recommendedResources = [...filteredResources]
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 6);

  if (isLoading) {
    return (
      <Layout title="Study Resources" description="Loading resources...">
        {/* Loading content */}
      </Layout>
    );
  }

  return (
    <Layout title="Study Resources" description="Curated learning materials to help you prepare">
      <div className="mb-8 flex flex-col md:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            placeholder="Search resources..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Resource Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-types">All Types</SelectItem>
              <SelectItem value="document">Document</SelectItem>
              <SelectItem value="video">Video</SelectItem>
              <SelectItem value="link">Link</SelectItem>
              <SelectItem value="quiz">Quiz</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-categories">All Categories</SelectItem>
              <SelectItem value="Physics">Physics</SelectItem>
              <SelectItem value="Chemistry">Chemistry</SelectItem>
              <SelectItem value="Math">Math</SelectItem>
              <SelectItem value="Biology">Biology</SelectItem>
              <SelectItem value="CS">Computer Science</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <Tabs defaultValue="recommended" className="space-y-6">
        <TabsList>
          <TabsTrigger value="recommended">Recommended</TabsTrigger>
          <TabsTrigger value="all">All Resources</TabsTrigger>
          <TabsTrigger value="Physics">Physics</TabsTrigger>
          <TabsTrigger value="Chemistry">Chemistry</TabsTrigger>
          <TabsTrigger value="Math">Math</TabsTrigger>
          <TabsTrigger value="Biology">Biology</TabsTrigger>
          <TabsTrigger value="CS">Computer Science</TabsTrigger>
        </TabsList>
        
        <TabsContent value="recommended" className="space-y-6">
          {recommendedResources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedResources.map(resource => (
                <ResourceCard
                  key={resource._id}
                  title={resource.title}
                  description={resource.description}
                  type={mapResourceType(resource.type)}
                  difficulty={determineDifficulty(resource.category)}
                  tags={resource.tags}
                  link={resource.url}
                  recommended={true}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500 dark:text-gray-400">No recommended resources match your filters.</p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="all" className="space-y-6">
          {filteredResources.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map(resource => (
                <ResourceCard
                  key={resource._id}
                  title={resource.title}
                  description={resource.description}
                  type={mapResourceType(resource.type)}
                  difficulty={determineDifficulty(resource.category)}
                  tags={resource.tags}
                  link={resource.url}
                  recommended={recommendedResources.includes(resource)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-gray-500 dark:text-gray-400">No resources match your search criteria.</p>
            </div>
          )}
        </TabsContent>
        
        {/* Create tab content for each subject category */}
        {Object.keys(groupedResources).map(category => (
          <TabsContent key={category} value={category} className="space-y-6">
            {groupedResources[category].length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groupedResources[category].map(resource => (
                  <ResourceCard
                    key={resource._id}
                    title={resource.title}
                    description={resource.description}
                    type={mapResourceType(resource.type)}
                    difficulty={determineDifficulty(resource.category)}
                    tags={resource.tags}
                    link={resource.url}
                    recommended={recommendedResources.includes(resource)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-gray-500 dark:text-gray-400">No {category} resources match your filters.</p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </Layout>
  );
};

// Helper functions
function mapResourceType(type: string): "video" | "article" | "quiz" | "book" {
  switch (type) {
    case "video": return "video";
    case "document": return "book";
    case "quiz": return "quiz";
    default: return "article";
  }
}

function determineDifficulty(category: string): "beginner" | "intermediate" | "advanced" {
  const lowerCategory = category.toLowerCase();
  if (lowerCategory.includes("basic") || lowerCategory.includes("intro")) {
    return "beginner";
  } else if (lowerCategory.includes("advanced")) {
    return "advanced";
  } else {
    return "intermediate";
  }
}

export default Resources;
