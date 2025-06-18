import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Camera, Clock, Apple, Dumbbell, Coffee, UtensilsCrossed, Brain, Loader2 } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { getLogs, addLog as addLogToStore, type LogEntry as StoredLogEntry } from "@/lib/logStore";
import MealCamera from "@/components/MealCamera";
import QuickGlucoseEntry from "@/components/QuickGlucoseEntry";
import { supabase } from "@/integrations/supabase/client";

// This interface is now for documentation, the source of truth is in logStore.ts
export interface LogEntry {
  id: string;
  type: 'meal' | 'exercise' | 'snack' | 'beverage';
  description: string;
  time: Date; // The component will work with Date objects
  points?: number;
}

const Logs = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  useEffect(() => {
    const fetchLogs = () => {
      const storedLogs = getLogs().map(log => ({
        ...log,
        time: new Date(log.time) // Convert ISO string back to Date
      }));
      setLogs(storedLogs);
    };

    fetchLogs(); // Initial fetch

    const handleLogsChanged = () => fetchLogs();
    window.addEventListener('logsChanged', handleLogsChanged);

    return () => {
      window.removeEventListener('logsChanged', handleLogsChanged);
    };
  }, []);

  const handleAISubmit = async () => {
    if (!input.trim()) {
      toast({
        title: "Input Required",
        description: "Please describe what you ate or your exercise activity.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please sign in to use this feature');
      }

      const response = await supabase.functions.invoke('parse-user-input', {
        body: { input: input.trim() }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to parse input');
      }

      const result = response.data;
      if (result.success) {
        toast({
          title: "Successfully Logged!",
          description: result.message,
        });
        setInput("");
        
        // Trigger logs refresh
        window.dispatchEvent(new CustomEvent('logsChanged'));
      } else {
        throw new Error(result.error || 'Unknown error occurred');
      }
    } catch (error) {
      console.error('Error parsing input:', error);
      toast({
        title: "Error",
        description: error.message || 'Failed to process your input. Please try again.',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCaptureMeal = (imageDataUrl: string) => {
    console.log("Captured meal image:", imageDataUrl.substring(0, 50) + "...");
    addLogToStore({
      type: 'meal',
      description: "Logged via photo",
      points: 15
    });

    toast({
      title: "Log Added!",
      description: `+15 points earned!`
    });
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'meal':
        return <UtensilsCrossed className="w-5 h-5 text-green-500" />;
      case 'exercise':
        return <Dumbbell className="w-5 h-5 text-blue-500" />;
      case 'snack':
        return <Apple className="w-5 h-5 text-orange-500" />;
      case 'beverage':
        return <Coffee className="w-5 h-5 text-purple-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return "Just now";
    if (diffInHours === 1) return "1 hour ago";
    return `${diffInHours} hours ago`;
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-20">
        <div className="p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Log Activity</h1>
            <p className="text-gray-600">Track your meals, workouts, and glucose</p>
          </div>

          {/* Combined Logging Section */}
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardContent className="space-y-4 pt-6">
              <Textarea
                placeholder="Describe what you ate or your exercise... 
                
Examples:
• Had 2 slices of pepperoni pizza and a Coke
• Jogged for 30 minutes at moderate pace  
• Ate a chicken caesar salad with dressing
• Did 45 minutes of weight training"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="min-h-[100px] border-gray-200"
                disabled={isLoading}
              />
              
              <Button
                onClick={handleAISubmit}
                disabled={isLoading || !input.trim()}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white h-12"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing with AI...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Log with AI
                  </>
                )}
              </Button>
              
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button
                  onClick={() => setIsCameraOpen(true)}
                  variant="outline"
                  className="border-blue-200 hover:bg-blue-50 h-12"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Take Photo
                </Button>
                
                <QuickGlucoseEntry />
              </div>
              
              <p className="text-xs text-gray-500 text-center">
                AI will automatically detect if it's a meal or exercise and log it with nutrition/activity data
              </p>
            </CardContent>
          </Card>

          {/* Recent Logs */}
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Recent Logs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-100 hover:shadow-md transition-shadow"
                  >
                    {getLogIcon(log.type)}
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{log.description}</p>
                      <p className="text-sm text-gray-500">{formatTime(log.time)}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary" className="capitalize">
                        {log.type}
                      </Badge>
                      {log.points && (
                        <Badge className="bg-yellow-500 text-white">
                          +{log.points}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <BottomNav />
      </div>
      <MealCamera
        open={isCameraOpen}
        onOpenChange={setIsCameraOpen}
        onCapture={handleCaptureMeal}
      />
    </>
  );
};

export default Logs;
