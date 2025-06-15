
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";
import GlucoseTrendCard from "@/components/GlucoseTrendCard";
import AISuggestionsCard from "@/components/AISuggestionsCard";
import HbA1cCard from "@/components/HbA1cCard";
import QuickActionsCard from "@/components/QuickActionsCard";
import RewardsCard from "@/components/RewardsCard";
import { Bluetooth } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { type GlucoseReading } from "@/components/GlucoseTrendChart";

const Dashboard = () => {
  const { toast } = useToast();
  const [isConnected, setIsConnected] = useState(true);
  const [glucoseData, setGlucoseData] = useState<GlucoseReading[]>([]);

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
  
  // Filter data to the last 24 hours for the trend card
  const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;
  const last24HoursData = glucoseData.filter(d => d.timestamp >= twentyFourHoursAgo);
  
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
          <GlucoseTrendCard 
            trend={glucoseTrend} 
            lastReading={lastReadingTime}
            latestValue={latestReading?.value}
            trendDirection={trendDirection}
            glucoseData={last24HoursData}
          />
        )}

        {/* AI Suggestions */}
        <AISuggestionsCard glucoseData={last24HoursData} />

        {/* HbA1c Estimate */}
        <HbA1cCard />

        {/* Quick Actions */}
        <QuickActionsCard />

        {/* Rewards */}
        <RewardsCard />
      </div>

      <BottomNav />
    </div>
  );
};

export default Dashboard;
