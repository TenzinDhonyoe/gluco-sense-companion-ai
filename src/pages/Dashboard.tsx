
import { useState, useEffect, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";
import GlucoseTrendCard from "@/components/GlucoseTrendCard";
import AISuggestionsCard from "@/components/AISuggestionsCard";
import RewardsCard from "@/components/RewardsCard";
import QuickAddDrawer from "@/components/QuickAddDrawer";
import { Bluetooth, Footprints, Flame, Moon, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type GlucoseReading } from "@/components/GlucoseTrendChart";
import { getLogs, type LogEntry } from "@/lib/logStore";

const Dashboard = () => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(true);
  const [glucoseData, setGlucoseData] = useState<GlucoseReading[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    const fetchLogs = () => setLogs(getLogs());
    fetchLogs();
    window.addEventListener('logsChanged', fetchLogs);
    return () => window.removeEventListener('logsChanged', fetchLogs);
  }, []);

  // Generate simulated glucose readings with trend index
  const generateGlucoseReading = (timestamp: number): { value: number; trendIndex: number } => {
    const baseValue = 100;
    const timeOfDay = (timestamp % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000); // Hours in day
    const dailyPattern = Math.sin((timeOfDay - 6) * Math.PI / 12) * 15;
    const trend = Math.sin(timestamp / (4 * 60 * 60 * 1000)) * 20; // 4-hour cycles
    const noise = (Math.random() - 0.5) * 8;
    const value = Math.max(60, Math.min(200, baseValue + dailyPattern + trend + noise));
    const trendIndex = Math.round((value - 100) / 10);
    return { value: Math.round(value), trendIndex };
  };

  useEffect(() => {
    const now = Date.now();
    const initialData: GlucoseReading[] = [];
    for (let i = 96; i >= 0; i--) {
      const timestamp = now - (i * 15 * 60 * 1000);
      const time = new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false });
      const { value, trendIndex } = generateGlucoseReading(timestamp);
      initialData.push({ time, value, timestamp, trendIndex });
    }
    setGlucoseData(initialData);

    const interval = setInterval(() => {
      const newTimestamp = Date.now();
      const newTime = new Date(newTimestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: false });
      const { value, trendIndex } = generateGlucoseReading(newTimestamp);
      const newReading: GlucoseReading = { time: newTime, value, timestamp: newTimestamp, trendIndex };

      setGlucoseData(prevData => {
        const newData = [...prevData.slice(1), newReading];
        if (value > 180) { // Higher threshold for alerts
          toast({
            title: "Glucose Alert",
            description: "Your glucose level is high. Consider light activity.",
            variant: "destructive",
          });
        }
        return newData;
      });
    }, 15 * 60 * 1000);

    return () => clearInterval(interval);
  }, [toast]);

  const latestReading = glucoseData.length > 0 ? glucoseData[glucoseData.length - 1] : undefined;
  const lastReadingTime = latestReading ? new Date(latestReading.timestamp) : new Date();
  
  const last24HoursData = useMemo(() => {
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
    return glucoseData.filter(d => d.timestamp >= twentyFourHoursAgo);
  }, [glucoseData]);
  
  let glucoseTrend: 'low' | 'normal' | 'high' = 'normal';
  if (latestReading) {
      if (latestReading.value < 70) glucoseTrend = 'low';
      else if (latestReading.value > 140) glucoseTrend = 'high';
  }

  let trendDirection: 'up' | 'down' | 'flat' = 'flat';
  if (glucoseData.length >= 2) {
    const lastValue = glucoseData[glucoseData.length - 1].value;
    const secondLastValue = glucoseData[glucoseData.length - 2].value;
    const diff = lastValue - secondLastValue;
    if (diff > 2) trendDirection = 'up';
    else if (diff < -2) trendDirection = 'down';
  }

  // Mock data for Today's Progress
  const todaysProgress = {
    steps: 8247,
    stepGoal: 10000,
    calories: 342,
    calorieGoal: 500,
    sleep: 7.2,
    sleepGoal: 8
  };

  // Recent activities from logs (last 3)
  const recentActivities = logs.slice(0, 3);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-20">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <img src="/lovable-uploads/db00049f-c25d-44f0-af01-f9d23b4a024c.png" alt="Logo" className="h-10" />
          <div className="flex items-center space-x-2">
            <Bluetooth className={`w-5 h-5 ${isConnected ? 'text-blue-500' : 'text-gray-400'}`} />
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
        </div>

        {/* Main Glucose Trend */}
        {glucoseData.length > 0 && (
          <div className="relative">
            <GlucoseTrendCard 
              trend={glucoseTrend} 
              lastReading={lastReadingTime}
              latestValue={latestReading?.value}
              trendDirection={trendDirection}
              glucoseData={last24HoursData}
            />
          </div>
        )}

        {/* Today's Progress */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-500" />
              <span>Today's Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <Footprints className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{todaysProgress.steps.toLocaleString()}</div>
                <div className="text-sm text-gray-600">/{todaysProgress.stepGoal.toLocaleString()} steps</div>
              </div>
              <div className="text-center">
                <Flame className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{todaysProgress.calories}</div>
                <div className="text-sm text-gray-600">/{todaysProgress.calorieGoal} cal burned</div>
              </div>
              <div className="text-center">
                <Moon className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-gray-900">{todaysProgress.sleep}h</div>
                <div className="text-sm text-gray-600">/{todaysProgress.sleepGoal}h sleep</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.map(activity => (
                <div key={activity.id} className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-100">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{activity.description}</p>
                    <p className="text-sm text-gray-500 capitalize">{activity.type}</p>
                  </div>
                  <Badge className="bg-yellow-500 text-white">
                    +{activity.points}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Suggestions */}
        <AISuggestionsCard glucoseData={last24HoursData} logs={logs} />

        {/* Rewards */}
        <RewardsCard />
      </div>

      {/* Floating Quick Add Button */}
      <div className="fixed bottom-24 right-6 z-50">
        <QuickAddDrawer />
      </div>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
