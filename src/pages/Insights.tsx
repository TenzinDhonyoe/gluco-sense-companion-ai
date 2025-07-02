
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Trophy, 
  Flame, 
  Target, 
  Activity, 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  HelpCircle,
  Moon,
  Utensils,
  Footprints,
  Award,
  Zap,
  Heart
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import HbA1cCard from "@/components/HbA1cCard";

const Insights = () => {
  // Streaks & Achievements data
  const achievements = [
    { 
      icon: <Flame className="w-6 h-6 text-orange-500" />, 
      title: "5 Day Streak", 
      description: "Logged meals consistently", 
      earned: true 
    },
    { 
      icon: <Target className="w-6 h-6 text-green-500" />, 
      title: "In Range Champion", 
      description: "3 days in target range", 
      earned: true 
    },
    { 
      icon: <Activity className="w-6 h-6 text-blue-500" />, 
      title: "Active Week", 
      description: "Hit step goal 6/7 days", 
      earned: true 
    },
    { 
      icon: <Award className="w-6 h-6 text-gray-400" />, 
      title: "Perfect Week", 
      description: "All goals met for 7 days", 
      earned: false 
    }
  ];

  // Lifestyle correlations
  const correlations = [
    {
      icon: <Footprints className="w-5 h-5 text-blue-500" />,
      text: "You tend to have 12% lower glucose on days with more than 8,000 steps"
    },
    {
      icon: <Moon className="w-5 h-5 text-purple-500" />,
      text: "Better sleep quality correlates with more stable morning readings"
    },
    {
      icon: <Utensils className="w-5 h-5 text-green-500" />,
      text: "Your glucose stays more stable when you eat protein-rich breakfasts"
    }
  ];

  // AI-powered insights
  const aiInsights = [
    {
      category: "Sleep",
      text: "You've been sleeping 45 minutes less this week. Consider adjusting your bedtime routine.",
      priority: "medium",
      icon: <Moon className="w-5 h-5 text-purple-500" />
    },
    {
      category: "Activity", 
      text: "Your body responds better to morning workouts - glucose stays stable for 6+ hours after.",
      priority: "low",
      icon: <Activity className="w-5 h-5 text-blue-500" />
    },
    {
      category: "Meals",
      text: "Post-meal spikes are 25% lower when you log meals with detailed carb counts.",
      priority: "medium",
      icon: <Utensils className="w-5 h-5 text-green-500" />
    }
  ];

  // Week comparison data
  const weekComparison = {
    glucose: { change: -3, isImprovement: true },
    timeInRange: { change: 5, isImprovement: true },
    logConsistency: { change: -15, isImprovement: false }
  };

  // Risk warnings
  const riskWarnings = [
    {
      text: "Meal logging has decreased by 40% this week. Trends may be less accurate.",
      priority: "medium"
    },
    {
      text: "Three high glucose events detected after late evening meals this week.",
      priority: "high"
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
      style={{ 
        paddingTop: 'max(env(safe-area-inset-top), 1rem)', 
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 8rem)' 
      }}
    >
      <div className="px-4 space-y-6">
        {/* Header */}
        <div className="py-4">
          <h1 className="text-2xl font-bold text-gray-900">Insights</h1>
          <p className="text-base text-gray-600">Your personalized glucose management insights</p>
        </div>

        {/* HbA1c Estimate */}
        <div className="w-full">
          <HbA1cCard />
        </div>

        {/* Streaks & Achievements */}
        <Card className="bg-white rounded-2xl shadow-md">
          <CardHeader className="px-6 py-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Trophy className="w-5 h-5 text-amber-500" />
              <span>Streaks & Achievements</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0">
            <div className="grid grid-cols-2 gap-4">
              {achievements.map((achievement, index) => (
                <div 
                  key={index} 
                  className={`p-4 rounded-xl border-2 ${achievement.earned ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}
                >
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div className={achievement.earned ? '' : 'opacity-40'}>
                      {achievement.icon}
                    </div>
                    <div>
                      <p className={`font-semibold text-sm ${achievement.earned ? 'text-gray-900' : 'text-gray-500'}`}>
                        {achievement.title}
                      </p>
                      <p className={`text-xs ${achievement.earned ? 'text-gray-600' : 'text-gray-400'}`}>
                        {achievement.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Week-over-Week Comparison */}
        <Card className="bg-white rounded-2xl shadow-md">
          <CardHeader className="px-6 py-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span>This Week vs Last Week</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0 space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Heart className="w-5 h-5 text-green-500" />
                <span className="font-medium text-gray-900">Average glucose</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-green-500" />
                <span className="font-bold text-green-600">3% lower</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-blue-500" />
                <span className="font-medium text-gray-900">Time in range</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-blue-500" />
                <span className="font-bold text-blue-600">5% higher</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-orange-500" />
                <span className="font-medium text-gray-900">Log consistency</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-orange-500" />
                <span className="font-bold text-orange-600">15% lower</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lifestyle Correlation Summary */}
        <Card className="bg-white rounded-2xl shadow-md">
          <CardHeader className="px-6 py-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Zap className="w-5 h-5 text-purple-500" />
              <span>Lifestyle Correlations</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0 space-y-4">
            {correlations.map((correlation, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                {correlation.icon}
                <p className="text-sm text-gray-700 leading-relaxed">{correlation.text}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* AI-Powered Insight Cards */}
        <Card className="bg-white rounded-2xl shadow-md">
          <CardHeader className="px-6 py-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Brain className="w-5 h-5 text-purple-500" />
              <span>AI Insights</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0 space-y-4">
            {aiInsights.map((insight, index) => (
              <div key={index} className={`p-4 rounded-xl border-l-4 ${getPriorityColor(insight.priority)}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {insight.icon}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 mb-2">{insight.text}</p>
                      <div className="flex items-center justify-between">
                        <Badge variant="secondary" className="text-xs">
                          {insight.category} • {insight.priority} priority
                        </Badge>
                        <Button variant="ghost" size="sm" className="text-xs text-purple-600 hover:text-purple-700 p-1 h-auto">
                          <HelpCircle className="w-3 h-3 mr-1" />
                          Explain This
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Risk Warnings */}
        <Card className="bg-white rounded-2xl shadow-md">
          <CardHeader className="px-6 py-4">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <span>Risk Warnings</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6 pt-0 space-y-4">
            {riskWarnings.map((warning, index) => (
              <div key={index} className={`p-4 rounded-xl border-l-4 ${getPriorityColor(warning.priority)}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 mb-2">{warning.text}</p>
                    <div className="flex items-center justify-between">
                      <Badge className={`text-xs ${warning.priority === 'high' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'}`}>
                        {warning.priority} priority
                      </Badge>
                      <Button variant="ghost" size="sm" className="text-xs text-purple-600 hover:text-purple-700 p-1 h-auto">
                        <HelpCircle className="w-3 h-3 mr-1" />
                        Ask AI
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default Insights;
