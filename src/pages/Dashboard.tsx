import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Activity, Footprints, Flame, Moon, Plus, TrendingUp, Clock, Utensils, Bell } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import GlucoseTrendCard from "@/components/GlucoseTrendCard";
import QuickAddDrawer from "@/components/QuickAddDrawer";
import AISuggestionsCard from "@/components/AISuggestionsCard";
import RewardsCard from "@/components/RewardsCard";
import { supabase } from "@/integrations/supabase/client";
import { type GlucoseReading } from "@/components/GlucoseTrendChart";
import { type LogEntry } from "@/lib/logStore";

const Dashboard = () => {
  const navigate = useNavigate();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [todaysProgress, setTodaysProgress] = useState({
    steps: 8432,
    stepsGoal: 10000,
    sleep: 7,
    sleepGoal: 8,
    meals: 2,
    mealsGoal: 3
  });

  // Mock glucose data for demonstration
  const mockGlucoseData: GlucoseReading[] = [
    { time: '6:00 AM', value: 95, timestamp: Date.now() - 8 * 60 * 60 * 1000, trendIndex: 0 },
    { time: '8:00 AM', value: 142, timestamp: Date.now() - 6 * 60 * 60 * 1000, trendIndex: 1 },
    { time: '10:00 AM', value: 128, timestamp: Date.now() - 4 * 60 * 60 * 1000, trendIndex: 2 },
    { time: '12:00 PM', value: 156, timestamp: Date.now() - 2 * 60 * 60 * 1000, trendIndex: 3 },
    { time: '2:00 PM', value: 134, timestamp: Date.now() - 1 * 60 * 60 * 1000, trendIndex: 4 },
    { time: '4:00 PM', value: 118, timestamp: Date.now() - 0.5 * 60 * 60 * 1000, trendIndex: 5 },
    { time: '6:00 PM', value: 145, timestamp: Date.now() - 0.25 * 60 * 60 * 1000, trendIndex: 6 },
    { time: '8:00 PM', value: 122, timestamp: Date.now(), trendIndex: 7 },
  ];

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

  const recentActivities = [
    { type: "meal", time: "2 hours ago", description: "Logged lunch: Grilled chicken salad", icon: Utensils, color: "text-green-600" },
    { type: "glucose", time: "3 hours ago", description: "Glucose reading: 142 mg/dL", icon: Activity, color: "text-blue-600" },
    { type: "exercise", time: "5 hours ago", description: "Morning walk: 30 minutes", icon: Footprints, color: "text-orange-600" },
    { type: "medication", time: "8 hours ago", description: "Insulin dose logged", icon: Clock, color: "text-purple-600" },
  ];

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
          <Bell className="w-6 h-6 text-gray-600" />
        </div>

        {/* Current Glucose */}
        <GlucoseTrendCard 
          trend="normal"
          lastReading={new Date()}
          latestValue={122}
          trendDirection="flat"
          glucoseData={mockGlucoseData}
        />

        {/* AI Suggestions */}
        <AISuggestionsCard glucoseData={mockGlucoseData} logs={mockLogs} />

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

        {/* Recent Activities */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Clock className="w-5 h-5 text-gray-600" />
              <span>Recent Activities</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="space-y-2">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded-lg">
                  <activity.icon className={`w-4 h-4 ${activity.color} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{activity.description}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
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
