import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Camera, Clock, Apple, Dumbbell, Coffee, UtensilsCrossed, Brain, Loader2, Filter } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { getLogs, addLog as addLogToStore, type LogEntry as StoredLogEntry } from "@/lib/logStore";
import MealCamera from "@/components/MealCamera";
import QuickGlucoseEntry from "@/components/QuickGlucoseEntry";
import LogDetailModal from "@/components/LogDetailModal";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// This interface is now for documentation, the source of truth is in logStore.ts
export interface LogEntry {
  id: string;
  type: 'meal' | 'exercise' | 'snack' | 'beverage';
  description: string;
  time: Date; // The component will work with Date objects
  points?: number;
}
interface DatabaseLog {
  id: string;
  type: 'meal' | 'exercise';
  description: string;
  time: Date;
  calories?: number;
  duration?: number;
  // Additional meal properties
  total_carbs?: number;
  total_protein?: number;
  total_fat?: number;
  total_fiber?: number;
  meal_type?: string;
  notes?: string;
  // Additional exercise properties
  intensity?: string;
  exercise_type?: string;
  calories_burned?: number;
  average_heart_rate?: number;
  max_heart_rate?: number;
}
const Logs = () => {
  const {
    toast
  } = useToast();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [databaseLogs, setDatabaseLogs] = useState<DatabaseLog[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [logFilter, setLogFilter] = useState<'all' | 'meal' | 'exercise'>('all');
  const [isLoadingDatabase, setIsLoadingDatabase] = useState(true);
  const [selectedLog, setSelectedLog] = useState<DatabaseLog | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
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
  useEffect(() => {
    fetchDetailedDatabaseLogs();
  }, []);
  const fetchDetailedDatabaseLogs = async () => {
    setIsLoadingDatabase(true);
    try {
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) {
        setIsLoadingDatabase(false);
        return;
      }

      // Fetch meals with all nutrition data
      const {
        data: mealsData,
        error: mealsError
      } = await supabase.from('meals').select('id, meal_name, meal_type, timestamp, total_calories, total_carbs, total_protein, total_fat, total_fiber, notes').eq('user_id', user.id).order('timestamp', {
        ascending: false
      }).limit(10);

      // Fetch exercises with all workout data
      const {
        data: exercisesData,
        error: exercisesError
      } = await supabase.from('exercises').select('id, exercise_name, exercise_type, timestamp, duration_minutes, intensity, calories_burned, average_heart_rate, max_heart_rate, notes').eq('user_id', user.id).order('timestamp', {
        ascending: false
      }).limit(10);
      if (mealsError) {
        console.error('Error fetching meals:', mealsError);
      }
      if (exercisesError) {
        console.error('Error fetching exercises:', exercisesError);
      }
      const combinedLogs: DatabaseLog[] = [];

      // Add meals with detailed data
      if (mealsData) {
        mealsData.forEach(meal => {
          combinedLogs.push({
            id: meal.id,
            type: 'meal',
            description: meal.meal_name,
            time: new Date(meal.timestamp),
            calories: meal.total_calories || undefined,
            total_carbs: meal.total_carbs || undefined,
            total_protein: meal.total_protein || undefined,
            total_fat: meal.total_fat || undefined,
            total_fiber: meal.total_fiber || undefined,
            meal_type: meal.meal_type || undefined,
            notes: meal.notes || undefined
          });
        });
      }

      // Add exercises with detailed data
      if (exercisesData) {
        exercisesData.forEach(exercise => {
          combinedLogs.push({
            id: exercise.id,
            type: 'exercise',
            description: exercise.exercise_name,
            time: new Date(exercise.timestamp),
            duration: exercise.duration_minutes,
            intensity: exercise.intensity || undefined,
            exercise_type: exercise.exercise_type || undefined,
            calories_burned: exercise.calories_burned || undefined,
            average_heart_rate: exercise.average_heart_rate || undefined,
            max_heart_rate: exercise.max_heart_rate || undefined,
            notes: exercise.notes || undefined
          });
        });
      }

      // Sort by time (most recent first)
      combinedLogs.sort((a, b) => b.time.getTime() - a.time.getTime());
      setDatabaseLogs(combinedLogs);
    } catch (error) {
      console.error('Error fetching database logs:', error);
    } finally {
      setIsLoadingDatabase(false);
    }
  };
  const handleLogClick = (log: DatabaseLog) => {
    setSelectedLog(log);
    setIsDetailModalOpen(true);
  };
  const handleLogUpdate = () => {
    // Refresh the database logs after an update
    fetchDetailedDatabaseLogs();
  };
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
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please sign in to use this feature');
      }
      const response = await supabase.functions.invoke('parse-user-input', {
        body: {
          input: input.trim()
        }
      });
      if (response.error) {
        throw new Error(response.error.message || 'Failed to parse input');
      }
      const result = response.data;
      if (result.success) {
        toast({
          title: "Successfully Logged!",
          description: result.message
        });
        setInput("");

        // Trigger logs refresh
        window.dispatchEvent(new CustomEvent('logsChanged'));
        // Refresh database logs
        fetchDetailedDatabaseLogs();
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
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "1 day ago";
    return `${diffInDays} days ago`;
  };
  const filteredDatabaseLogs = databaseLogs.filter(log => {
    if (logFilter === 'all') return true;
    return log.type === logFilter;
  });
  return <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" style={{
      paddingTop: 'max(3rem, env(safe-area-inset-top))',
      paddingLeft: 'env(safe-area-inset-left)',
      paddingRight: 'env(safe-area-inset-right)',
      paddingBottom: 'calc(env(safe-area-inset-bottom) + 8rem)'
    }}>
        <div className="px-4 space-y-6">
          {/* Header - Apple HIG compliant */}
          <div className="py-4 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Log Activity</h1>
            <p className="text-sm text-muted-foreground">Track your meals, workouts, and glucose</p>
          </div>

          {/* ✍️ New Entry Section */}
          <Card className="bg-white rounded-2xl shadow-md">
            <CardContent className="space-y-4 px-6 py-6">
              <div className="relative">
                <Textarea placeholder="🍽️ What did you eat or do? 🏃‍♂️" value={input} onChange={e => setInput(e.target.value)} className="h-24 rounded-xl shadow-sm border-gray-200 text-base resize-none" disabled={isLoading} />
              </div>
              
              <Button onClick={handleAISubmit} disabled={isLoading || !input.trim()} className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white py-3 text-base rounded-xl">
                {isLoading ? <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing with AI...
                  </> : <>
                    <Brain className="w-5 h-5 mr-2" />
                    Generate Log with AI
                  </>}
              </Button>
              
              <div className="grid grid-cols-2 gap-4">
                <Button onClick={() => setIsCameraOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 py-2.5 gap-2 text-sm rounded-xl">
                  <Camera className="w-4 h-4" />
                  Take Photo
                </Button>
                
                <QuickGlucoseEntry />
              </div>
              
              <p className="text-xs text-muted-foreground text-center mt-3">
                AI will automatically detect if it's a meal or exercise and log it with nutrition/activity data
              </p>
            </CardContent>
          </Card>

          {/* 📄 Recent Logs */}
          <Card className="bg-white rounded-2xl shadow-md">
            <CardHeader className="px-6 py-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">Recent Logs</CardTitle>
                <div className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1">
                  <span className="text-xs text-muted-foreground">Filter:</span>
                  <Filter className="w-3 h-3 text-muted-foreground" />
                  <Select value={logFilter} onValueChange={(value: 'all' | 'meal' | 'exercise') => setLogFilter(value)}>
                    <SelectTrigger className="w-20 h-7 text-xs border-none bg-transparent">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="meal">Meals</SelectItem>
                      <SelectItem value="exercise">Exercise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 pt-0">
              <div className="space-y-3">
                {isLoadingDatabase ? <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                  </div> : filteredDatabaseLogs.length > 0 ? filteredDatabaseLogs.map(log => <div key={log.id} onClick={() => handleLogClick(log)} className="bg-white shadow-sm rounded-lg p-3 border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex items-center gap-3">
                        {getLogIcon(log.type)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-base truncate">{log.description}</p>
                          <p className="text-xs text-muted-foreground">{formatTime(log.time)}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Badge variant="secondary" className="capitalize text-xs">
                            {log.type}
                          </Badge>
                          {log.type === 'meal' && log.calories && <Badge className="bg-orange-500 text-white text-xs">
                              {log.calories} cal
                            </Badge>}
                          {log.type === 'exercise' && log.duration && <Badge className="bg-blue-500 text-white text-xs">
                              {log.duration}min
                            </Badge>}
                        </div>
                      </div>
                    </div>) : <div className="text-center py-8 text-muted-foreground">
                    <p className="text-base">No logs found</p>
                    <p className="text-sm">Start logging your meals and exercises!</p>
                  </div>}
              </div>
            </CardContent>
          </Card>
        </div>

        <BottomNav />
      </div>

      <MealCamera open={isCameraOpen} onOpenChange={setIsCameraOpen} onCapture={handleCaptureMeal} />

      <LogDetailModal log={selectedLog} open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen} onLogUpdate={handleLogUpdate} />
    </>;
};
export default Logs;