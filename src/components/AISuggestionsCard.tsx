import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, RefreshCw, CheckCircle, Clock, X, HelpCircle } from "lucide-react";
import { type GlucoseReading } from "@/components/GlucoseTrendChart";
import { type LogEntry } from "@/lib/logStore";
import { getSuggestions, type Suggestion, type GlucoseReading as AIGlucoseReading, type MealLog, type ExerciseLog } from "@/lib/ai";
import { shouldShowSampleData, generateSampleInsights } from "@/lib/sampleData";
import SampleDataWatermark from "@/components/SampleDataWatermark";
interface AISuggestionsCardProps {
  glucoseData: GlucoseReading[];
  logs: LogEntry[];
}

interface SuggestionState {
  suggestionHash: string;
  action: 'try_for_week' | 'snooze' | 'not_relevant' | 'why_this';
  timestamp: number;
}

// Hash function to identify duplicate suggestions
const hashSuggestion = (text: string): string => {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
};
const AISuggestionsCard = ({
  glucoseData,
  logs
}: AISuggestionsCardProps) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestionStates, setSuggestionStates] = useState<SuggestionState[]>([]);

  // Load suggestion states from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('ai_suggestion_states');
    if (saved) {
      try {
        setSuggestionStates(JSON.parse(saved));
      } catch (error) {
        console.error('Failed to load suggestion states:', error);
      }
    }
  }, []);

  // Save suggestion states to localStorage
  const saveSuggestionStates = (states: SuggestionState[]) => {
    try {
      localStorage.setItem('ai_suggestion_states', JSON.stringify(states));
      setSuggestionStates(states);
    } catch (error) {
      console.error('Failed to save suggestion states:', error);
    }
  };

  // Handle suggestion actions
  const handleSuggestionAction = (suggestion: Suggestion, action: SuggestionState['action']) => {
    const hash = hashSuggestion(suggestion.text);
    const newState: SuggestionState = {
      suggestionHash: hash,
      action,
      timestamp: Date.now()
    };

    // Remove existing state for this suggestion and add new one
    const updatedStates = suggestionStates.filter(s => s.suggestionHash !== hash);
    updatedStates.push(newState);
    
    saveSuggestionStates(updatedStates);

    // Remove suggestion from display if dismissed
    if (action === 'not_relevant' || action === 'snooze') {
      setSuggestions(prev => prev.filter(s => hashSuggestion(s.text) !== hash));
    }
  };

  // Check if suggestion should be shown based on previous actions
  const shouldShowSuggestion = (suggestion: Suggestion): boolean => {
    const hash = hashSuggestion(suggestion.text);
    const state = suggestionStates.find(s => s.suggestionHash === hash);
    
    if (!state) return true;
    
    // Don't show if marked as not relevant
    if (state.action === 'not_relevant') return false;
    
    // Show if snoozed more than 24 hours ago
    if (state.action === 'snooze') {
      const dayInMs = 24 * 60 * 60 * 1000;
      return Date.now() - state.timestamp > dayInMs;
    }
    
    return true;
  };
  const generateSuggestions = async () => {
    if (glucoseData.length === 0) {
      setSuggestions([]);
      return;
    }
    setIsLoading(true);

    // Check if showing sample data and use sample insights instead
    const isUsingSampleData = shouldShowSampleData(glucoseData, logs);
    if (isUsingSampleData) {
      const sampleInsights = generateSampleInsights();
      const mappedSuggestions = sampleInsights.map(insight => ({
        id: insight.id,
        text: insight.description,
        type: insight.type,
        priority: insight.priority,
        actionable: insight.actionable
      }));
      setSuggestions(mappedSuggestions.filter(shouldShowSuggestion));
      setIsLoading(false);
      return;
    }
    try {
      // Transform glucose data to AI format
      const aiGlucoseReadings: AIGlucoseReading[] = glucoseData.map((reading, index) => ({
        id: String(reading.timestamp || index),
        // Use timestamp as ID or fallback to index
        value: reading.value,
        timestamp: new Date(reading.timestamp).toISOString(),
        tag: 'general'
      }));

      // Transform logs to AI format
      const meals: MealLog[] = logs.filter(log => log.type === 'meal').map(log => ({
        id: log.id,
        description: log.description,
        timestamp: new Date(log.time).toISOString(),
        // Use 'time' property from LogEntry
        calories: undefined,
        // LogEntry doesn't have calories property
        carbs: undefined // LogEntry doesn't have carbs property
      }));
      const exercises: ExerciseLog[] = logs.filter(log => log.type === 'exercise').map(log => ({
        id: log.id,
        description: log.description,
        timestamp: new Date(log.time).toISOString(),
        // Use 'time' property from LogEntry
        duration: undefined,
        // LogEntry doesn't have duration property
        intensity: undefined // LogEntry doesn't have intensity property
      }));

      // Generate suggestions using AI-powered engine
      const newSuggestions = await getSuggestions(aiGlucoseReadings, meals, exercises);
      
      // Filter suggestions based on previous actions
      const filteredSuggestions = newSuggestions.filter(shouldShowSuggestion);
      setSuggestions(filteredSuggestions);
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
  const isUsingSampleData = shouldShowSampleData(glucoseData, logs);

  return <Card className="bg-white rounded-2xl shadow-md relative">
      {/* Sample Data Watermark */}
      {isUsingSampleData && <SampleDataWatermark size="sm" opacity={0.12} />}
      
      <CardHeader className="px-4 sm:px-6 py-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            <span className="text-base font-semibold text-gray-900">AI Suggestions</span>
          </div>
          <Button onClick={generateSuggestions} disabled={isLoading} variant="ghost" size="sm" className="w-11 h-11 text-blue-600 hover:text-blue-700 disabled:text-gray-400">
            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 sm:px-6 pb-6 pt-0">
        <div className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-200 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((suggestion, index) => {
              const hash = hashSuggestion(suggestion.text);
              const state = suggestionStates.find(s => s.suggestionHash === hash);
              
              return (
                <div key={index} className={`relative p-4 rounded-xl ${getSuggestionColor(suggestion.level)}`}>
                  {/* Priority indicator dot */}
                  <div className={`absolute top-3 right-3 w-2 h-2 rounded-full ${
                    suggestion.level === 'high' ? 'bg-red-500' : 
                    suggestion.level === 'medium' ? 'bg-yellow-500' : 
                    'bg-blue-500'
                  }`} />
                  
                  {/* Main suggestion text */}
                  <div className="pr-6 mb-4">
                    <p className="text-sm font-medium text-gray-800 leading-relaxed">
                      {suggestion.text}
                    </p>
                  </div>
                  
                  {/* Mobile-optimized action area */}
                  <div className="flex items-center justify-between">
                    {/* Category tag */}
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      suggestion.level === 'high' 
                        ? 'bg-red-100 text-red-700' 
                        : suggestion.level === 'medium' 
                        ? 'bg-yellow-100 text-yellow-700' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {suggestion.category === 'meal' ? '🍽️' : 
                       suggestion.category === 'exercise' ? '🏃' : 
                       suggestion.category === 'glucose' ? '📊' : '💡'} {suggestion.category}
                    </span>
                    
                    {/* Single primary action */}
                    <div className="flex items-center gap-2">
                      {state?.action === 'try_for_week' ? (
                        <span className="flex items-center gap-1 text-xs text-green-700 bg-green-100 px-3 py-2 rounded-full font-medium">
                          <CheckCircle className="w-4 h-4" />
                          Trying this week
                        </span>
                      ) : (
                        <>
                          {/* Primary action button - larger and more prominent */}
                          <Button
                            size="sm"
                            onClick={() => handleSuggestionAction(suggestion, 'try_for_week')}
                            className="h-9 px-4 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-sm font-medium"
                          >
                            Try it
                          </Button>
                          
                          {/* Secondary dismiss button - subtle */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleSuggestionAction(suggestion, 'not_relevant')}
                            className="h-9 w-9 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
                            title="Dismiss suggestion"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-gray-600 text-center py-4">
              {glucoseData.length === 0 
                ? "Add some glucose readings to get personalized suggestions." 
                : "No new suggestions available based on your recent data."
              }
            </p>
          )}
        </div>
      </CardContent>
    </Card>;
};
export default AISuggestionsCard;