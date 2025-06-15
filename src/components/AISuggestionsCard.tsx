
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AISuggestionsCard = () => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const mockSuggestions = [
    "Try a 10-minute walk after meals to help glucose absorption",
    "Consider reducing portion sizes by 20% at dinner",
    "Your glucose responds well to morning exercise - keep it up!",
    "Stay hydrated - aim for 8 glasses of water today",
    "Your glucose is stable - great job with consistent meal timing!"
  ];

  const fetchSuggestions = async () => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock response - in real app, would call /suggestions endpoint
      const randomSuggestions = mockSuggestions
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      
      setSuggestions(randomSuggestions);
      
      toast({
        title: "AI Suggestions Updated",
        description: "New personalized recommendations are ready!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch suggestions. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, []);

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            <span className="text-gray-900">AI Suggestions</span>
          </div>
          <Button
            onClick={fetchSuggestions}
            disabled={isLoading}
            variant="ghost"
            size="sm"
            className="text-blue-600 hover:text-blue-700"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        ) : (
          suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400"
            >
              <p className="text-sm text-gray-700">{suggestion}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};

export default AISuggestionsCard;
