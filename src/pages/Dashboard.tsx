
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Footprints, Flame, Moon, Plus, TrendingUp, Clock, Utensils } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import GlucoseTrendCard from "@/components/GlucoseTrendCard";
import QuickAddDrawer from "@/components/QuickAddDrawer";
import AISuggestionsCard from "@/components/AISuggestionsCard";
import RewardsCard from "@/components/RewardsCard";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const navigate = useNavigate();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [todaysProgress, setTodaysProgress] = useState({
    steps: 7542,
    calories: 320,
    sleep: 7.5
  });

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-20">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Good morning! 👋</h1>
            <p className="text-gray-600">Let's check your health today</p>
          </div>
          <Button onClick={handleSignOut} variant="outline" size="sm">
            Sign Out
          </Button>
        </div>

        {/* Current Glucose */}
        <GlucoseTrendCard />

        {/* Today's Progress */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span>Today's Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <Footprints className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{todaysProgress.steps.toLocaleString()}</p>
                <p className="text-sm text-gray-600">Steps</p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <Flame className="w-6 h-6 text-orange-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{todaysProgress.calories}</p>
                <p className="text-sm text-gray-600">Calories</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <Moon className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{todaysProgress.sleep}h</p>
                <p className="text-sm text-gray-600">Sleep</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <Button 
                onClick={() => setIsQuickAddOpen(true)} 
                className="h-16 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
              >
                <Plus className="w-5 h-5 mr-2" />
                Log Entry
              </Button>
              <Button variant="outline" className="h-16 border-2 border-blue-200 hover:bg-blue-50">
                <Activity className="w-5 h-5 mr-2" />
                View Trends
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-gray-600" />
              <span>Recent Activities</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivities.map((activity, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <activity.icon className={`w-5 h-5 ${activity.color}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* AI Suggestions */}
        <AISuggestionsCard />

        {/* Rewards */}
        <RewardsCard />
      </div>

      <QuickAddDrawer isOpen={isQuickAddOpen} onClose={() => setIsQuickAddOpen(false)} />
      <BottomNav />
    </div>
  );
};

export default Dashboard;
