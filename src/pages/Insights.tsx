
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingDown, TrendingUp, Target, Lightbulb, Focus } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import HbA1cCard from "@/components/HbA1cCard";

const Insights = () => {
  const [timeInRange, setTimeInRange] = useState(82);
  const [postMealSpikes, setPostMealSpikes] = useState(3);
  const [glucoseStability, setGlucoseStability] = useState(85);

  useEffect(() => {
    // Simulate fetching insights data
    setTimeInRange(78 + Math.random() * 15); // 78-93%
    setPostMealSpikes(Math.floor(Math.random() * 8) + 1); // 1-8 spikes
    setGlucoseStability(75 + Math.random() * 20); // 75-95%
  }, []);

  const glucoseFactors = [
    { factor: "Carbohydrate intake", impact: "High", color: "text-red-600" },
    { factor: "Exercise timing", impact: "Medium", color: "text-yellow-600" },
    { factor: "Sleep quality", impact: "Medium", color: "text-yellow-600" },
    { factor: "Stress levels", impact: "Low", color: "text-green-600" },
  ];

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
      style={{ 
        paddingTop: 'env(safe-area-inset-top)', 
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 5rem)' 
      }}
    >
      <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6 space-y-3 sm:space-y-4 lg:space-y-6">
        {/* Header - Mobile optimized */}
        <div className="pt-2 sm:pt-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Insights</h1>
          <p className="text-sm sm:text-base text-gray-600">Your glucose management overview</p>
        </div>

        {/* This Week's Focus - Mobile optimized */}
        <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-lg">
          <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <Focus className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span>This Week's Focus</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-start space-x-2 sm:space-x-3">
                <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 mt-1 text-yellow-300 flex-shrink-0" />
                <div className="min-w-0">
                  <h4 className="font-semibold mb-1 text-sm sm:text-base">Reduce post-meal spikes</h4>
                  <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">Try eating protein before carbs and take a 10-minute walk after meals</p>
                </div>
              </div>
              <div className="flex items-start space-x-2 sm:space-x-3">
                <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 mt-1 text-yellow-300 flex-shrink-0" />
                <div className="min-w-0">
                  <h4 className="font-semibold mb-1 text-sm sm:text-base">Improve sleep consistency</h4>
                  <p className="text-blue-100 text-xs sm:text-sm leading-relaxed">Aim for 7-8 hours of sleep with consistent bedtime to help stabilize glucose</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* HbA1c Estimate - Full width responsive */}
        <div className="w-full">
          <HbA1cCard />
        </div>

        {/* Key Insights - Mobile optimized */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 flex-shrink-0" />
              <span>Key Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-6">
            {/* Time in Range */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs sm:text-sm font-medium text-gray-700">Time in Range (70-180 mg/dL)</span>
                <span className="text-base sm:text-lg font-bold text-gray-900">{Math.round(timeInRange)}%</span>
              </div>
              <Progress value={timeInRange} className="h-2 sm:h-3" />
              <p className="text-xs text-gray-500 mt-1">Target: {">"}70%</p>
            </div>

            {/* Post Meal Spikes */}
            <div className="flex items-center justify-between p-2 sm:p-3 bg-orange-50 rounded-lg">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 text-sm sm:text-base">Post-meal spikes (last 7 days)</p>
                <p className="text-xs sm:text-sm text-gray-600">{postMealSpikes} episodes above 180 mg/dL</p>
              </div>
              <div className="text-xl sm:text-2xl font-bold text-orange-600 flex-shrink-0">{postMealSpikes}</div>
            </div>

            {/* Glucose Stability */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs sm:text-sm font-medium text-gray-700">Glucose Stability</span>
                <span className="text-base sm:text-lg font-bold text-gray-900">{Math.round(glucoseStability)}%</span>
              </div>
              <Progress value={glucoseStability} className="h-2 sm:h-3" />
              <p className="text-xs text-gray-500 mt-1">Based on glucose variability</p>
            </div>
          </CardContent>
        </Card>

        {/* What Affects Your Glucose - Mobile optimized */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="px-3 sm:px-6 py-3 sm:py-4">
            <CardTitle className="flex items-center space-x-2 text-base sm:text-lg">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 flex-shrink-0" />
              <span>What Affects Your Glucose</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="space-y-2 sm:space-y-3">
              {glucoseFactors.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-900 text-sm sm:text-base min-w-0 flex-1 pr-2">{item.factor}</span>
                  <Badge className={`${item.color} bg-transparent border text-xs flex-shrink-0`}>
                    {item.impact} impact
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default Insights;
