
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, RefreshCw } from "lucide-react";
import { type GlucoseReading } from "@/components/GlucoseTrendChart";
import { type LogEntry } from "@/lib/logStore";
import { getSuggestions, type Suggestion, type GlucoseReading as AIGlucoseReading, type MealLog, type ExerciseLog } from "@/lib/ai";

interface AISuggestionsCardProps {
  glucoseData: GlucoseReading[];
  logs: LogEntry[];
}

const AISuggestionsCard = ({ glucoseData, logs }: AISuggestionsCardProps) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateSuggestions = () => {
    if (glucoseData.length === 0) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      // Transform glucose data to AI format
      const aiGlucoseReadings: AIGlucoseReading[] = glucoseData.map(reading => ({
        id: reading.id || String(reading.timestamp),
        value: reading.value,
        timestamp: new Date(reading.timestamp).toISOString(),
        tag: reading.timestamp ? 'general' : undefined
      }));

      // Transform logs to AI format
      const meals: MealLog[] = logs
        .filter(log => log.type === 'meal')
        .map(log => ({
          id: log.id,
          description: log.description,
          timestamp: new Date(log.timestamp).toISOString(),
          calories: log.calories || undefined,
          carbs: log.carbs || undefined
        }));

      const exercises: ExerciseLog[] = logs
        .filter(log => log.type === 'exercise')
        .map(log => ({
          id: log.id,
          description: log.description,
          timestamp: new Date(log.timestamp).toISOString(),
          duration: log.duration || undefined,
          intensity: log.intensity as 'low' | 'moderate' | 'high' | 'very_high' || undefined
        }));

      // Generate suggestions using rule-based engine
      const newSuggestions = getSuggestions(aiGlucoseReadings, meals, exercises);
      setSuggestions(newSuggestions);
    } catch (error) {
      console.error('Error generating suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    generateSuggestions();
  }, [glucoseData, logs]);

  const getSuggestionColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'border-red-400 bg-red-50';
      case 'medium':
        return 'border-yellow-400 bg-yellow-50';
      case 'low':
        return 'border-blue-400 bg-blue-50';
      default:
        return 'border-blue-400 bg-blue-50';
    }
  };

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Lightbulb className="w-5 h-5 text-yellow-500" />
            <span className="text-gray-900">AI Suggestions</span>
          </div>
          <Button
            onClick={generateSuggestions}
            disabled={isLoading}
            variant="ghost"
            size="sm"
            className="text-blue-600 hover:text-blue-700 disabled:text-gray-400"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-gray-200 rounded animate-pulse w-full" />
            ))}
          </div>
        ) : suggestions.length > 0 ? (
          suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border-l-4 ${getSuggestionColor(suggestion.level)}`}
            >
              <p className="text-sm text-gray-700">{suggestion.text}</p>
              <span className={`text-xs font-medium ${
                suggestion.level === 'high' ? 'text-red-600' :
                suggestion.level === 'medium' ? 'text-yellow-600' :
                'text-blue-600'
              }`}>
                {suggestion.category} • {suggestion.level} priority
              </span>
            </div>
          ))
        ) : (
          <p className="text-sm text-gray-600">
            {glucoseData.length === 0 
              ? "Add some glucose readings to get personalized suggestions." 
              : "No suggestions available based on your recent data."}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default AISuggestionsCard;
