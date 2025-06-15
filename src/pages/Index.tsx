
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Heart, Target, Trophy } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Simulate checking if user is onboarded
    const timer = setTimeout(() => {
      // For prototype, auto-navigate to dashboard
      // navigate("/dashboard");
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center mb-6 animate-fade-in">
          <div className="mb-4">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
              <Activity className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              GlucoSense
            </h1>
            <p className="text-lg text-gray-600">
              Your AI-powered wellness companion
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6 w-full max-w-lg">
          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4 text-center">
              <Heart className="w-8 h-8 text-red-500 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">Live Monitoring</h3>
              <p className="text-sm text-gray-600">Real-time glucose trends from your NIR watch</p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4 text-center">
              <Target className="w-8 h-8 text-blue-500 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">AI Insights</h3>
              <p className="text-sm text-gray-600">Personalized suggestions for better health</p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4 text-center">
              <Activity className="w-8 h-8 text-green-500 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">Quick Logging</h3>
              <p className="text-sm text-gray-600">Log meals & workouts in under 10 seconds</p>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-4 text-center">
              <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
              <h3 className="font-semibold text-gray-800 mb-2">Rewards</h3>
              <p className="text-sm text-gray-600">Earn points and streaks for healthy habits</p>
            </CardContent>
          </Card>
        </div>

        <Button 
          onClick={() => navigate("/dashboard")} 
          className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
        >
          Get Started
        </Button>
      </div>
    </div>
  );
};

export default Index;
