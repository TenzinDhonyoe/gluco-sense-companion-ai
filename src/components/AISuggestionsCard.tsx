
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lightbulb, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { type GlucoseReading } from "@/components/GlucoseTrendChart";
import { GoogleGenerativeAI } from "@google/generative-ai";

interface AISuggestionsCardProps {
  glucoseData: GlucoseReading[];
}

const AISuggestionsCard = ({ glucoseData }: AISuggestionsCardProps) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [tempApiKey, setTempApiKey] =useState("");

  useEffect(() => {
    const storedKey = localStorage.getItem("googleApiKey");
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  useEffect(() => {
    if (apiKey && glucoseData.length > 0) {
      fetchSuggestions();
    }
  }, [apiKey, glucoseData]);

  const handleSaveKey = () => {
    if (tempApiKey) {
      localStorage.setItem("googleApiKey", tempApiKey);
      setApiKey(tempApiKey);
      toast({ title: "API Key Saved", description: "Your Google AI API key has been saved." });
    }
  };

  const fetchSuggestions = async () => {
    if (!apiKey) return;

    setIsLoading(true);
    setSuggestions([]);
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

      const glucose_series = glucoseData.slice(-20).map(d => `${d.value} at ${d.time}`).join(', ');
      const meal_log = "Lunch: Salad with grilled chicken. Dinner: Salmon with quinoa and roasted vegetables.";
      const exercise_log = "20-minute brisk walk after dinner.";
      const sleep_hours = 7;
      const steps = 8500;

      const prompt = `You are a certified diabetes educator focusing on pre-diabetes prevention. Your tone is encouraging and actionable.

      Based on the following data, return exactly 3 bullet-point suggestions to help keep glucose in a healthy range.
      Each suggestion must be 75 characters or less.
      Start each suggestion with a '•' character, and separate them with a new line.
      Do not include any other text, titles, or pleasantries in your response. Just the 3 bullet points.
      
      ---
      DATA:
      Past 24h readings (mg/dL): ${glucose_series}
      Logs:
        – Meals: ${meal_log} 
        – Exercise: ${exercise_log}
      Vitals: ${sleep_hours}h sleep, ${steps} steps
      ---`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const parsedSuggestions = text.split('•').map(s => s.trim()).filter(s => s.length > 0);

      if (parsedSuggestions.length === 0) throw new Error("AI returned no suggestions.");

      setSuggestions(parsedSuggestions);
      toast({
        title: "AI Suggestions Updated",
        description: "New personalized recommendations are ready!",
      });
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      let description = "Failed to fetch suggestions. Please try again.";
      if (error instanceof Error && error.message.includes('API key not valid')) {
        description = "Your API key seems invalid. Please check and save it again.";
        localStorage.removeItem("googleApiKey");
        setApiKey(null);
      }
      toast({ title: "Error", description, variant: "destructive" });
    } finally {
      setIsLoading(false);
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
            onClick={fetchSuggestions}
            disabled={isLoading || !apiKey}
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
        ) : !apiKey ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Enter your Google AI API key to get personalized suggestions.</p>
            <div className="flex space-x-2">
              <Input 
                type="password"
                placeholder="Your Google AI API Key"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                className="bg-white"
              />
              <Button onClick={handleSaveKey}>Save</Button>
            </div>
            <p className="text-xs text-gray-500">Your key is stored only in your browser's local storage.</p>
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
