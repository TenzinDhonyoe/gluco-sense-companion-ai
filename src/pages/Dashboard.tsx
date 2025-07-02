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

  // Callback to handle glucose data updates from the chart component
  const handleGlucoseDataUpdate = useCallback((data: GlucoseReading[]) => {
    console.log('Dashboard received glucose data update:', data.length, 'readings');
    setGlucoseData(data);
  }, []);

  // Calculate latest value and trend direction from real database data
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

  // Get the actual timestamp from the latest reading, not mock data
  const getLastReadingTime = (): Date => {
    if (!latestReading) return new Date();
    return new Date(latestReading.timestamp);
  };

  // Mock log entries for demonstration - these should also come from database eventually
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

  // CircularProgress component
  const CircularProgress = ({ value, size = 60, strokeWidth = 4, color = "text-blue-500" }) => {
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
    <div 
      className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
      style={{ 
        paddingTop: 'calc(env(safe-area-inset-top) + 0.5rem)', 
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 6rem)' 
      }}
    >
      <div className="px-2 sm:px-4 lg:px-6 space-y-2 sm:space-y-3 lg:space-y-4 max-w-4xl mx-auto">
        {/* Header - Mobile-optimized spacing */}
        <div className="flex justify-between items-center py-1 sm:py-2 lg:py-3">
          <div className="flex items-center flex-shrink-0">
            <img 
              src="/lovable-uploads/f14763b5-4ed6-4cf3-a397-11d1095ce3e2.png" 
              alt="Logo" 
              className="h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10"
            />
          </div>
          <div className="flex items-center">
            <DynamicAvatar 
              onClick={() => navigate("/profile")} 
              size={28}
              className="w-7 h-7 sm:w-8 sm:h-8 lg:w-10 lg:h-10"
            />
          </div>
        </div>

        {/* Current Glucose - Full width responsive */}
        <div className="w-full">
          <GlucoseTrendCard 
            trend={calculateTrendCategory()}
            lastReading={getLastReadingTime()}
            latestValue={latestReading?.value}
            trendDirection={calculateTrendDirection()}
            glucoseData={glucoseData}
            onDataUpdate={handleGlucoseDataUpdate}
          />
        </div>

        {/* AI Suggestions - Responsive card */}
        <div className="w-full">
          <AISuggestionsCard glucoseData={glucoseData} logs={mockLogs} />
        </div>

        {/* Today's Progress - Mobile-optimized */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg w-full">
          <CardHeader className="pb-1 px-2 sm:px-4 lg:px-6 pt-2 sm:pt-4">
            <CardTitle className="flex items-center space-x-1 sm:space-x-2 text-sm sm:text-base lg:text-lg">
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 lg:w-5 lg:h-5 text-blue-500 flex-shrink-0" />
              <span>Today's Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-1 px-2 sm:px-4 lg:px-6 pb-2 sm:pb-4">
            <div className="grid grid-cols-3 gap-1 sm:gap-2 lg:gap-3">
              <div className="flex flex-col items-center space-y-0.5 sm:space-y-1">
                <div className="relative">
                  <CircularProgress 
                    value={stepsProgress} 
                    color="text-teal-500" 
                    size={40}
                    strokeWidth={3}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-gray-900 leading-none">
                      {Math.round(todaysProgress.steps / 1000)}k
                    </span>
                    <span className="text-xs text-gray-500 leading-none">steps</span>
                  </div>
                </div>
                <div className="text-center min-h-[2rem] flex flex-col justify-center">
                  <p className="text-xs font-medium text-gray-900 leading-tight">Steps</p>
                  <p className="text-xs text-gray-500 leading-tight">{Math.round(stepsProgress)}%</p>
                </div>
              </div>
              
              <div className="flex flex-col items-center space-y-0.5 sm:space-y-1">
                <div className="relative">
                  <CircularProgress 
                    value={sleepProgress} 
                    color="text-purple-500" 
                    size={40}
                    strokeWidth={3}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-gray-900 leading-none">
                      {todaysProgress.sleep}h
                    </span>
                    <span className="text-xs text-gray-500 leading-none">sleep</span>
                  </div>
                </div>
                <div className="text-center min-h-[2rem] flex flex-col justify-center">
                  <p className="text-xs font-medium text-gray-900 leading-tight">Sleep</p>
                  <p className="text-xs text-gray-500 leading-tight">{Math.round(sleepProgress)}%</p>
                </div>
              </div>
              
              <div className="flex flex-col items-center space-y-0.5 sm:space-y-1">
                <div className="relative">
                  <CircularProgress 
                    value={mealsProgress} 
                    color="text-orange-500" 
                    size={40}
                    strokeWidth={3}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xs font-bold text-gray-900 leading-none">
                      {todaysProgress.meals}
                    </span>
                    <span className="text-xs text-gray-500 leading-none">meals</span>
                  </div>
                </div>
                <div className="text-center min-h-[2rem] flex flex-col justify-center">
                  <p className="text-xs font-medium text-gray-900 leading-tight">Meals</p>
                  <p className="text-xs text-gray-500 leading-tight">{Math.round(mealsProgress)}%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rewards - Responsive card */}
        <div className="w-full">
          <RewardsCard />
        </div>

        {/* Clear Data Button - Mobile-optimized */}
        <div className="flex justify-center pt-2 sm:pt-3 border-t border-gray-200/50">
          <ClearDataButton />
        </div>
      </div>

      {/* Quick Add Button - Mobile-optimized fixed position */}
      <div 
        className="fixed bottom-16 right-2 sm:bottom-20 sm:right-3 lg:right-4 z-10"
        style={{ bottom: 'calc(4.5rem + env(safe-area-inset-bottom))' }}
      >
        <QuickAddDrawer />
      </div>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
