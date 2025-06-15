import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type GlucoseReading } from "@/components/GlucoseTrendChart";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { type LogEntry } from "@/lib/logStore";

interface AISuggestionsCardProps {
  glucoseData: GlucoseReading[];
  logs: LogEntry[];
}

const AISuggestionsCard = ({ glucoseData, logs }: AISuggestionsCardProps) => {
  const { toast } = useToast();
  // NOTE: Storing API keys in frontend code is not secure.
  // This is for demonstration purposes only.
  const apiKey = "AIzaSyArfchp6gp_d33mKf3k0KsOfs5w9GheeQs";

  const {
    data: suggestions,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    isSuccess,
  } = useQuery({
    queryKey: ['ai-suggestions', logs],
    queryFn: async () => {
      if (!apiKey) return [];

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

      const glucose_series = glucoseData.slice(-20).map(d => `${d.value} at ${d.time}`).join(', ');
      
      const formatLogs = (logType: LogEntry['type'] | LogEntry['type'][], defaultText: string) => {
        const types = Array.isArray(logType) ? logType : [logType];
        const relevantLogs = logs.filter(log => types.includes(log.type));
        if (relevantLogs.length === 0) return defaultText;
        return relevantLogs.map(log => log.description).join('; ');
      };
      
      const meal_log = formatLogs(['meal', 'snack', 'beverage'], "No meals or snacks logged.");
      const exercise_log = formatLogs('exercise', "No exercise logged.");
      
      const sleep_hours = 7; // Placeholder
      const steps = 8500; // Placeholder

      const prompt = `You are a certified diabetes educator focusing on pre-diabetes prevention. Your tone is encouraging and actionable.

      Based on the following data for a user, return exactly 3 bullet-point suggestions to help keep glucose in a healthy range.
      Each suggestion must be 75 characters or less.
      Start each suggestion with a '•' character, and separate them with a new line.
      Do not include any other text, titles, or pleasantries in your response. Just the 3 bullet points.
      
      ---
      DATA:
      Past 24h readings (mg/dL): ${glucose_series}
      User's Recent Logs:
        – Meals/Snacks/Beverages: ${meal_log} 
        – Exercise: ${exercise_log}
      Vitals: ${sleep_hours}h sleep, ${steps} steps
      ---`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const parsedSuggestions = text.split('•').map(s => s.trim()).filter(s => s.length > 0);

      if (parsedSuggestions.length === 0) {
        throw new Error("AI returned no suggestions.");
      }

      return parsedSuggestions;
    },
    enabled: glucoseData.length > 0 && !!apiKey,
    refetchOnWindowFocus: false,
    retry: false, // Prevents retrying automatically on error, avoiding rate-limit loops.
  });

  useEffect(() => {
    if (isSuccess && suggestions) {
        toast({
            title: "AI Suggestions Updated",
            description: "New personalized recommendations are ready!",
        });
    }
  }, [isSuccess, suggestions, toast]);
  
  useEffect(() => {
    if (isError) {
        console.error("Error fetching suggestions:", error);
        let description = "Failed to fetch suggestions. Please try again.";
        if (error instanceof Error && (error.message.includes('API key not valid') || error.message.includes('quota'))) {
            description = "There was an issue with the AI service. Please try again later.";
        }
        toast({ title: "Error", description, variant: "destructive" });
    }
  }, [isError, error, toast]);

  const showLoading = isLoading || isFetching;

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 bg-gradient-to-br from-green-600 to-yellow-500 bg-clip-text text-transparent" strokeWidth={0} fill="currentColor" />
            <span className="text-gray-900">AI Suggestions</span>
          </div>
          <Button
            onClick={() => refetch()}
            disabled={showLoading || !apiKey}
            variant="ghost"
            size="sm"
            className="text-blue-600 hover:text-blue-700 disabled:text-gray-400"
          >
            <RefreshCw className={`w-4 h-4 ${showLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {showLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-gray-200 rounded animate-pulse w-full" />
            ))}
          </div>
        ) : (suggestions && suggestions.length > 0) ? (
          suggestions.map((suggestion, index) => (
            <div
              key={index}
              className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400"
            >
              <p className="text-sm text-gray-700">{suggestion}</p>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-600">{isError ? "Could not load AI suggestions. Please try refreshing." : "No suggestions available."}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default AISuggestionsCard;
