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
    if (!glucoseData.length) return {
      average: 0,
      inRange: 0,
      elevated: 0,
      status: 'normal',
      statusText: 'Good control',
      statusColor: 'green'
    };
    const last7Days = glucoseData.filter(reading => reading.timestamp >= Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (!last7Days.length) return {
      average: 0,
      inRange: 0,
      elevated: 0,
      status: 'normal',
      statusText: 'Good control',
      statusColor: 'green'
    };
    const total = last7Days.length;
    const average = Math.round(last7Days.reduce((sum, reading) => sum + reading.value, 0) / total);
    const inRange = Math.round(last7Days.filter(r => r.value >= 80 && r.value <= 130).length / total * 100);
    const elevated = Math.round(last7Days.filter(r => r.value > 130).length / total * 100);

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
    return {
      average,
      inRange,
      elevated,
      status,
      statusText,
      statusColor
    };
  }, [glucoseData]);

  // Mock log entries for demonstration - these should also come from database eventually
  const mockLogs: LogEntry[] = [{
    id: '1',
    type: 'meal',
    description: 'Grilled chicken salad with mixed vegetables',
    time: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    // 2 hours ago
    points: 15
  }, {
    id: '2',
    type: 'exercise',
    description: 'Morning walk - 30 minutes',
    time: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    // 5 hours ago
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

        {/* Clean Weekly Summary Card - Centered Layout */}
        <Card className="bg-white rounded-full shadow-sm border-2">
          <CardContent className="px-6 py-3 text-center">
            <div className="space-y-1.5">
              <p className="text-sm text-muted-foreground uppercase tracking-wide">Weekly Average</p>
              <p className="text-2xl font-bold">{weeklySummary.average} mg/dL</p>
              <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${weeklySummary.statusColor === 'green' ? 'bg-green-100 text-green-700' : weeklySummary.statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${weeklySummary.statusColor === 'green' ? 'bg-green-500' : weeklySummary.statusColor === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                {weeklySummary.statusText}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Glucose Chart for Prediabetic Users */}
        <div className="w-full mt-5">
          <PreDiabeticGlucoseChart onDataUpdate={handleGlucoseDataUpdate} containerClassName="bg-white" />
        </div>

        {/* Quick Actions */}
        

        {/* AI Suggestions - Responsive card */}
        <div className="w-full">
          <AISuggestionsCard glucoseData={glucoseData} logs={mockLogs} />
        </div>

        {/* Today's Progress - Harmonized spacing */}
        <Card className="bg-white rounded-2xl shadow-sm">
          <CardHeader className="px-6 py-[18px]">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span>Today's Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0">
            <div className="grid grid-cols-3 gap-6">
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="relative">
                  <CircularProgress value={stepsProgress} color="text-blue-500" size={64} strokeWidth={5} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-gray-900 leading-none">
                      {Math.round(todaysProgress.steps / 1000)}k
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-900">Steps</p>
                  <p className="text-xs text-gray-500">{Math.round(stepsProgress)}% of goal</p>
                </div>
              </div>
              
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="relative">
                  <CircularProgress value={sleepProgress} color="text-green-500" size={64} strokeWidth={5} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-gray-900 leading-none">
                      {todaysProgress.sleep}h
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-900">Sleep</p>
                  <p className="text-xs text-gray-500">{Math.round(sleepProgress)}% of goal</p>
                </div>
              </div>
              
              <div className="flex flex-col items-center text-center space-y-3">
                <div className="relative">
                  <CircularProgress value={mealsProgress} color="text-amber-500" size={64} strokeWidth={5} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold text-gray-900 leading-none">
                      {todaysProgress.meals}
                    </span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-900">Meals</p>
                  <p className="text-xs text-gray-500">{Math.round(mealsProgress)}% of goal</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rewards - Responsive card */}
        <div className="w-full">
          <RewardsCard />
        </div>

        {/* Clear Data Button - Apple HIG compliant */}
        <div className="flex justify-center pt-4 border-t border-gray-200">
          <ClearDataButton />
        </div>
      </div>

      {/* Floating Action Button - Improved design */}
      <div className="fixed bottom-6 right-6 z-50" style={{
      bottom: 'calc(6rem + env(safe-area-inset-bottom))'
    }}>
        <QuickAddDrawer />
      </div>

      <BottomNav />
    </div>;
};
export default Dashboard;