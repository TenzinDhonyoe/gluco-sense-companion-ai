import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Activity, Footprints, Flame, Moon, Plus, TrendingUp, Clock, Utensils } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import GlucoseTrendCard from "@/components/GlucoseTrendCard";
import QuickAddDrawer from "@/components/QuickAddDrawer";
import AISuggestionsCard from "@/components/AISuggestionsCard";
import RewardsCard from "@/components/RewardsCard";
import { supabase } from "@/integrations/supabase/client";
import { type GlucoseReading } from "@/components/GlucoseTrendChart";
import { type LogEntry } from "@/lib/logStore";
import DynamicAvatar from "@/components/DynamicAvatar";
import ClearDataButton from "@/components/ClearDataButton";

const Dashboard = () => {
  const navigate = useNavigate();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [glucoseData, setGlucoseData] = useState<GlucoseReading[]>([]);
  const [todaysProgress, setTodaysProgress] = useState({
    steps: 8432,
    stepsGoal: 10000,
    sleep: 7,
    sleepGoal: 8,
    meals: 2,
    mealsGoal: 3
  });

  // Function to manually trigger glucose reading generation
  const generateSensorReading = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('generate-glucose-reading', {
        body: { manual: true }
      });
      
      if (error) {
        console.error('Error generating sensor reading:', error);
      } else {
        console.log('Sensor reading generated:', data);
      }
    } catch (error) {
      console.error('Error invoking generate-glucose-reading function:', error);
    }
  };

  // Callback to handle glucose data updates from the chart component
  const handleGlucoseDataUpdate = useCallback((data: GlucoseReading[]) => {
    console.log('Dashboard received glucose data update:', data.length, 'readings');
    setGlucoseData(data);
  }, []);

  // Calculate latest value and trend direction from real data
  const latestReading = glucoseData[glucoseData.length - 1];
  const previousReading = glucoseData[glucoseData.length - 2];
  
  const calculateTrendDirection = (): 'up' | 'down' | 'flat' => {
    if (!latestReading || !previousReading) return 'flat';
    const difference = latestReading.value - previousReading.value;
    if (difference > 5) return 'up';
    if (difference < -5) return 'down';
    return 'flat';
  };

  const calculateTrendCategory = (): 'low' | 'normal' | 'high' => {
    if (!latestReading) return 'normal';
    if (latestReading.value < 70) return 'low';
    if (latestReading.value > 180) return 'high';
    return 'normal';
  };

  // Mock log entries for demonstration
  const mockLogs: LogEntry[] = [
    {
      id: '1',
      type: 'meal',
      description: 'Grilled chicken salad with mixed vegetables',
      time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      points: 15
    },
    {
      id: '2', 
      type: 'exercise',
      description: 'Morning walk - 30 minutes',
      time: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      points: 25
    }
  ];

  useEffect(() => {
    // Check if user is authenticated
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/");
      } else {
        // Generate a sensor reading immediately on dashboard load
        generateSensorReading();
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate("/");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  // Calculate progress percentages
  const stepsProgress = (todaysProgress.steps / todaysProgress.stepsGoal) * 100;
  const sleepProgress = (todaysProgress.sleep / todaysProgress.sleepGoal) * 100;
  const mealsProgress = (todaysProgress.meals / todaysProgress.mealsGoal) * 100;

  const CircularProgress = ({ value, size = 80, strokeWidth = 6, color = "text-blue-500" }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-gray-200"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={color}
            strokeLinecap="round"
          />
        </svg>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-20">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <img 
              src="/lovable-uploads/f14763b5-4ed6-4cf3-a397-11d1095ce3e2.png" 
              alt="Logo" 
              className="h-12 w-12"
            />
          </div>
          <div className="flex items-center gap-3">
            <ClearDataButton />
            <DynamicAvatar 
              onClick={() => navigate("/profile")} 
              size={48}
            />
          </div>
        </div>

        {/* Current Glucose - Chart will fetch its own data and notify us of updates */}
        <GlucoseTrendCard 
          trend={calculateTrendCategory()}
          lastReading={new Date(latestReading?.timestamp || Date.now())}
          latestValue={latestReading?.value}
          trendDirection={calculateTrendDirection()}
          glucoseData={glucoseData}
          onDataUpdate={handleGlucoseDataUpdate}
        />

        {/* AI Suggestions */}
        <AISuggestionsCard glucoseData={glucoseData} logs={mockLogs} />

        {/* Today's Progress */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span>Today's Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              <div className="flex flex-col items-center space-y-2">
                <div className="relative">
                  <CircularProgress value={stepsProgress} color="text-teal-500" size={70} strokeWidth={5} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-sm font-bold text-gray-900 leading-none">{Math.round(todaysProgress.steps / 1000)}k</span>
                    <span className="text-xs text-gray-500 leading-none">steps</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-900">Steps</p>
                  <p className="text-xs text-gray-500">{Math.round(stepsProgress)}% of goal</p>
                </div>
              </div>
              
              <div className="flex flex-col items-center space-y-2">
                <div className="relative">
                  <CircularProgress value={sleepProgress} color="text-purple-500" size={70} strokeWidth={5} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-sm font-bold text-gray-900 leading-none">{todaysProgress.sleep}h</span>
                    <span className="text-xs text-gray-500 leading-none">sleep</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-900">Sleep</p>
                  <p className="text-xs text-gray-500">{Math.round(sleepProgress)}% of goal</p>
                </div>
              </div>
              
              <div className="flex flex-col items-center space-y-2">
                <div className="relative">
                  <CircularProgress value={mealsProgress} color="text-orange-500" size={70} strokeWidth={5} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-sm font-bold text-gray-900 leading-none">{todaysProgress.meals}</span>
                    <span className="text-xs text-gray-500 leading-none">meals</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-gray-900">Meals</p>
                  <p className="text-xs text-gray-500">{Math.round(mealsProgress)}% of goal</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rewards */}
        <RewardsCard />
      </div>

      {/* Quick Add Button - Fixed position bottom right */}
      <div className="fixed bottom-24 right-6 z-10">
        <QuickAddDrawer />
      </div>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
