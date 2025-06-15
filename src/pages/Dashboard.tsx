
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Lightbulb, 
  Camera, 
  Dumbbell,
  Trophy,
  Bluetooth
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import BottomNav from "@/components/BottomNav";
import GlucoseTrendCard from "@/components/GlucoseTrendCard";
import AISuggestionsCard from "@/components/AISuggestionsCard";
import HbA1cCard from "@/components/HbA1cCard";
import QuickActionsCard from "@/components/QuickActionsCard";
import RewardsCard from "@/components/RewardsCard";

const Dashboard = () => {
  const { toast } = useToast();
  const [glucoseTrend, setGlucoseTrend] = useState<'low' | 'normal' | 'high'>('normal');
  const [lastReading, setLastReading] = useState(new Date());
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    // Simulate live data updates every 15 minutes
    const interval = setInterval(() => {
      const trends = ['low', 'normal', 'high'] as const;
      const randomTrend = trends[Math.floor(Math.random() * trends.length)];
      setGlucoseTrend(randomTrend);
      setLastReading(new Date());
      
      if (randomTrend === 'high') {
        toast({
          title: "Glucose Alert",
          description: "Your glucose trend is elevated. Consider reviewing your recent meals.",
          variant: "destructive",
        });
      }
    }, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(interval);
  }, [toast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-20">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
            <p className="text-gray-600">Here's your glucose overview</p>
          </div>
          <div className="flex items-center space-x-2">
            <Bluetooth className={`w-5 h-5 ${isConnected ? 'text-blue-500' : 'text-gray-400'}`} />
            <Badge variant={isConnected ? "default" : "secondary"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
          </div>
        </div>

        {/* Main Glucose Trend */}
        <GlucoseTrendCard 
          trend={glucoseTrend} 
          lastReading={lastReading}
        />

        {/* AI Suggestions */}
        <AISuggestionsCard />

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
