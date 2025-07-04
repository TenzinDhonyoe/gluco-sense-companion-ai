import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Activity, Footprints, Flame, Moon, Plus, TrendingUp, Clock, Utensils } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import GlucoseTrendCard from "@/components/GlucoseTrendCard";
import PreDiabeticGlucoseChart from "@/components/PreDiabeticGlucoseChart";
import QuickAddDrawer from "@/components/QuickAddDrawer";
import AISuggestionsCard from "@/components/AISuggestionsCard";
import TimeInRangeCard from "@/components/TimeInRangeCard";
import RecentLogsTimeline from "@/components/RecentLogsTimeline";
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

  // Calculate weekly summary from glucose data
  const weeklySummary = useMemo(() => {
    if (!glucoseData.length) return { average: 0, inRange: 0, elevated: 0, status: 'normal', statusText: 'Good control', statusColor: 'green' };
    
    const last7Days = glucoseData.filter(reading => 
      reading.timestamp >= Date.now() - 7 * 24 * 60 * 60 * 1000
    );

    if (!last7Days.length) return { average: 0, inRange: 0, elevated: 0, status: 'normal', statusText: 'Good control', statusColor: 'green' };

    const total = last7Days.length;
    const average = Math.round(last7Days.reduce((sum, reading) => sum + reading.value, 0) / total);
    const inRange = Math.round((last7Days.filter(r => r.value >= 80 && r.value <= 130).length / total) * 100);
    const elevated = Math.round((last7Days.filter(r => r.value > 130).length / total) * 100);

    // Determine status based on average glucose
    let status = 'normal';
    let statusText = 'Good control';
    let statusColor = 'green';

    if (average >= 80 && average <= 130) {
      status = 'normal';
      statusText = 'Good control';
      statusColor = 'green';
    } else if (average > 130 && average <= 160) {
      status = 'elevated';
      statusText = 'Elevated';
      statusColor = 'yellow';
    } else if (average > 160) {
      status = 'high';
      statusText = 'Needs attention';
      statusColor = 'red';
    }

    return { average, inRange, elevated, status, statusText, statusColor };
  }, [glucoseData]);

  // Mock log entries for recent logs timeline
  const recentLogsData = useMemo(() => [
    {
      id: '1',
      type: 'glucose' as const,
      description: 'Glucose reading',
      value: 118,
      unit: 'mg/dL',
      time: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
      category: 'post-meal'
    },
    {
      id: '2',
      type: 'meal' as const,
      description: 'Grilled chicken salad with mixed vegetables',
      time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
      category: 'lunch'
    },
    {
      id: '3',
      type: 'exercise' as const,
      description: 'Morning walk - 30 minutes',
      time: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
      category: 'cardio'
    },
    {
      id: '4',
      type: 'glucose' as const,
      description: 'Fasting glucose',
      value: 102,
      unit: 'mg/dL',
      time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // yesterday
      category: 'fasting'
    }
  ], []);

  // Mock log entries for AI suggestions (legacy format)
  const mockLogs: LogEntry[] = [{
    id: '1',
    type: 'meal',
    description: 'Grilled chicken salad with mixed vegetables',
    time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    points: 15
  }, {
    id: '2',
    type: 'exercise',
    description: 'Morning walk - 30 minutes',
    time: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    points: 25
  }];
  useEffect(() => {
    // Check if user is authenticated
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      if (!session) {
        navigate("/");
      }
    });

    // Listen for auth changes
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((_event, session) => {
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
  const stepsProgress = todaysProgress.steps / todaysProgress.stepsGoal * 100;
  const sleepProgress = todaysProgress.sleep / todaysProgress.sleepGoal * 100;
  const mealsProgress = todaysProgress.meals / todaysProgress.mealsGoal * 100;

  // CircularProgress component
  const CircularProgress = ({
    value,
    size = 60,
    strokeWidth = 4,
    color = "text-blue-500"
  }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - value / 100 * circumference;
    return <div className="relative flex-shrink-0" style={{
      width: size,
      height: size
    }}>
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" className="text-gray-200" />
          <circle cx={size / 2} cy={size / 2} r={radius} stroke="currentColor" strokeWidth={strokeWidth} fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} className={color} strokeLinecap="round" />
        </svg>
      </div>;
  };
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" style={{
    paddingTop: 'max(env(safe-area-inset-top), 1rem)',
    paddingBottom: 'calc(env(safe-area-inset-bottom) + 8rem)'
  }}>
      <div className="px-4 space-y-5">
        {/* Header - Apple HIG compliant */}
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <img src="/lovable-uploads/f14763b5-4ed6-4cf3-a397-11d1095ce3e2.png" alt="Logo" className="w-10 h-10" />
          </div>
          <div className="flex items-center">
            <DynamicAvatar onClick={() => navigate("/profile")} size={44} className="w-11 h-11 rounded-full shadow-sm" />
          </div>
        </div>

        {/* 📊 Weekly Average Card */}
        <Card className="bg-white rounded-xl shadow-sm">
          <CardContent className="p-4 text-center">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-medium">Weekly Average</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-2xl font-bold">{weeklySummary.average} mg/dL</span>
                <Badge className={`${
                  weeklySummary.statusColor === 'green' ? 'bg-green-100 text-green-700 border-green-200' :
                  weeklySummary.statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                  'bg-red-100 text-red-700 border-red-200'
                }`}>
                  {weeklySummary.statusColor === 'green' ? '🟢' : 
                   weeklySummary.statusColor === 'yellow' ? '🟡' : '🔴'} {weeklySummary.statusText}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 📈 Glucose Graph */}
        <div className="w-full">
          <PreDiabeticGlucoseChart 
            onDataUpdate={handleGlucoseDataUpdate} 
            containerClassName="bg-white rounded-xl shadow-sm" 
          />
        </div>

        {/* 🧩 Time in Range Card */}
        <TimeInRangeCard glucoseData={glucoseData} />

        {/* 🔄 Recent Logs Timeline */}
        <RecentLogsTimeline logs={recentLogsData} />

        {/* ⚡ Quick Actions */}
        <Card className="bg-white rounded-xl shadow-sm">
          <CardContent className="p-4">
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                className="h-12 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-medium rounded-lg shadow-sm"
                onClick={() => navigate("/glucose-tracker")}
              >
                📊 Log Glucose
              </Button>
              <Button 
                variant="outline"
                className="h-12 border-2 border-blue-200 hover:bg-blue-50 font-medium rounded-lg"
                onClick={() => navigate("/chat")}
              >
                🤖 Ask AI Coach
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <Button 
                variant="outline"
                className="h-10 text-sm"
                onClick={() => navigate("/logs")}
              >
                🍽️ Log Meal
              </Button>
              <Button 
                variant="outline"
                className="h-10 text-sm"
                onClick={() => navigate("/logs")}
              >
                🏃‍♂️ Log Exercise
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 💡 AI Suggestion Card */}
        <div className="w-full">
          <AISuggestionsCard glucoseData={glucoseData} logs={mockLogs} />
        </div>

        {/* Clear Data Button - Apple HIG compliant */}
        <div className="flex justify-center pt-4 border-t border-gray-200">
          <ClearDataButton />
        </div>
      </div>

      <BottomNav />
    </div>;
};
export default Dashboard;