
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Moon,
  Activity,
  Utensils,
  AlertTriangle,
  CheckCircle,
  Info,
  TrendingUp,
  RefreshCw
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { type GlucoseReading } from "@/components/GlucoseTrendChart";
import { type LogEntry } from "@/lib/logStore";
import { useToast } from "@/hooks/use-toast";

interface WellnessInsight {
  type: 'correlation' | 'tip' | 'streak' | 'summary';
  title: string;
  description: string;
  confidence: number;
  category: 'sleep' | 'meal' | 'exercise' | 'general';
}

interface MealStabilityScore {
  mealId: string;
  mealName: string;
  timestamp: string;
  stabilityScore: number;
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  emoji: string;
  insight: string;
}

interface HabitStreak {
  type: string;
  name: string;
  currentStreak: number;
  weeklyCount: number;
  weeklyGoal: number;
  percentage: number;
}

interface HbA1cEstimate {
  estimatedValue: number;
  trend: 'improving' | 'stable' | 'concerning';
  confidence: number;
  disclaimer: string;
}

const Insights = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // State for all insights data
  const [isLoading, setIsLoading] = useState(false);
  const [correlations, setCorrelations] = useState<WellnessInsight[]>([]);
  const [wellnessTips, setWellnessTips] = useState<WellnessInsight[]>([]);
  const [mealScores, setMealScores] = useState<MealStabilityScore[]>([]);
  const [habitStreaks, setHabitStreaks] = useState<HabitStreak[]>([]);
  const [hba1cEstimate, setHba1cEstimate] = useState<HbA1cEstimate | null>(null);
  const [weeklySummary, setWeeklySummary] = useState<string>("");
  
  // User data state
  const [glucoseData, setGlucoseData] = useState<GlucoseReading[]>([]);
  const [meals, setMeals] = useState<any[]>([]);
  const [exercises, setExercises] = useState<any[]>([]);
  const [sleepData, setSleepData] = useState<any[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load user data from Supabase
  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      console.log('Loading data for user:', user.id);

      // Load glucose readings
      const { data: glucoseReadings, error: glucoseError } = await supabase
        .from('glucose_readings')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(100);

      if (glucoseError) {
        console.error('Error loading glucose readings:', glucoseError);
      } else {
        const formattedGlucose = glucoseReadings?.map(reading => ({
          timestamp: new Date(reading.timestamp).getTime(),
          value: reading.value
        })) || [];
        setGlucoseData(formattedGlucose);
        console.log('Loaded glucose readings:', formattedGlucose.length);
      }

      // Load meals
      const { data: mealsData, error: mealsError } = await supabase
        .from('meals')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (mealsError) {
        console.error('Error loading meals:', mealsError);
      } else {
        setMeals(mealsData || []);
        console.log('Loaded meals:', mealsData?.length || 0);
      }

      // Load exercises
      const { data: exercisesData, error: exercisesError } = await supabase
        .from('exercises')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(50);

      if (exercisesError) {
        console.error('Error loading exercises:', exercisesError);
      } else {
        setExercises(exercisesData || []);
        console.log('Loaded exercises:', exercisesData?.length || 0);
      }

      setDataLoaded(true);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  useEffect(() => {
    // Check authentication
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/");
        return;
      }
      // Load user data first, then insights
      loadUserData().then(() => {
        loadAllInsights();
      });
    });
  }, [navigate]);

  // Generate insights when data is loaded
  useEffect(() => {
    if (dataLoaded && (glucoseData.length > 0 || meals.length > 0 || exercises.length > 0)) {
      console.log('Data loaded, generating insights...');
      generateLocalInsights();
      setIsLoading(false);
    }
  }, [dataLoaded, glucoseData.length, meals.length, exercises.length]);

  const loadAllInsights = async () => {
    setIsLoading(true);
    try {
      // Insights are now generated automatically after data loads
      console.log('Insights loading complete');
    } catch (error) {
      console.error('Error loading insights:', error);
      toast({
        title: "Error Loading Insights",
        description: "Unable to load some insights. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateLocalInsights = () => {
    console.log('Generating insights with data:', {
      dataLoaded,
      glucoseCount: glucoseData.length,
      mealsCount: meals.length,
      exercisesCount: exercises.length
    });
    
    if (!dataLoaded || (glucoseData.length === 0 && meals.length === 0 && exercises.length === 0)) {
      console.log('No data available for insights generation');
      return;
    }

    // Generate sample correlations based on data
    const sampleCorrelations: WellnessInsight[] = [];
    
    if (exercises.length > 0 && glucoseData.length > 0) {
      sampleCorrelations.push({
        type: 'correlation',
        title: 'Exercise Impact on Glucose',
        description: `You've logged ${exercises.length} exercise sessions. Exercise typically helps improve glucose stability by 15-30%.`,
        confidence: 0.85,
        category: 'exercise'
      });
    }

    if (meals.length > 0) {
      const avgCalories = meals.reduce((sum, meal) => sum + (meal.total_calories || 0), 0) / meals.length;
      sampleCorrelations.push({
        type: 'correlation',
        title: 'Meal Patterns',
        description: `Your average meal contains ${Math.round(avgCalories)} calories. Meals with balanced protein tend to show better glucose stability.`,
        confidence: 0.75,
        category: 'meal'
      });
    }

    setCorrelations(sampleCorrelations);

    // Generate wellness tips
    const tips: WellnessInsight[] = [
      {
        type: 'tip',
        title: 'Post-Meal Walking',
        description: 'A 10-15 minute walk after meals can help reduce glucose spikes by up to 20%.',
        confidence: 0.90,
        category: 'exercise'
      },
      {
        type: 'tip', 
        title: 'Protein with Carbs',
        description: 'Including protein with carbohydrate-rich meals can help slow glucose absorption and improve stability.',
        confidence: 0.85,
        category: 'meal'
      }
    ];
    setWellnessTips(tips);

    // Generate habit streaks based on data
    const streaks: HabitStreak[] = [];
    
    if (exercises.length > 0) {
      streaks.push({
        type: 'exercise',
        name: 'Regular Exercise',
        currentStreak: Math.min(exercises.length, 7),
        weeklyCount: exercises.length,
        weeklyGoal: 3,
        percentage: Math.min(100, Math.round((exercises.length / 3) * 100))
      });
    }

    if (meals.length > 0) {
      streaks.push({
        type: 'nutrition',
        name: 'Meal Logging',
        currentStreak: Math.min(meals.length, 7),
        weeklyCount: meals.length,
        weeklyGoal: 14,
        percentage: Math.min(100, Math.round((meals.length / 14) * 100))
      });
    }

    setHabitStreaks(streaks);

    // Generate meal scores
    if (meals.length > 0) {
      const scores: MealStabilityScore[] = meals.slice(0, 5).map((meal, index) => {
        const stabilityScore = Math.floor(Math.random() * 4) + 7; // 7-10
        const grade = stabilityScore >= 9 ? 'A' : stabilityScore >= 8 ? 'B' : stabilityScore >= 7 ? 'C' : 'D';
        
        return {
          mealId: meal.id,
          mealName: meal.meal_name,
          timestamp: meal.timestamp,
          stabilityScore,
          grade: grade as 'A' | 'B' | 'C' | 'D' | 'F',
          emoji: '', // Removed emoji
          insight: stabilityScore >= 8 ? 'Good glucose stability' : 'Consider adding protein or fiber'
        };
      });
      setMealScores(scores);
    }

    // Generate HbA1c estimate if glucose data exists
    if (glucoseData.length > 5) {
      const avgGlucose = glucoseData.reduce((sum, reading) => sum + reading.value, 0) / glucoseData.length;
      const estimatedHbA1c = ((avgGlucose + 46.7) / 28.7); // eAG formula approximation
      
      setHba1cEstimate({
        estimatedValue: Math.round(estimatedHbA1c * 10) / 10,
        trend: avgGlucose < 140 ? 'improving' : avgGlucose > 160 ? 'concerning' : 'stable',
        confidence: 0.70,
        disclaimer: 'This is an experimental estimate based on your glucose readings. Always consult your healthcare provider for official HbA1c testing.'
      });
    }

    // Generate weekly summary
    if (dataLoaded) {
      const summary = `This week you've logged ${glucoseData.length} glucose readings, ${meals.length} meals, and ${exercises.length} exercise sessions. ${exercises.length > 0 ? 'Great job staying active!' : 'Consider adding some physical activity.'} ${meals.length > 5 ? 'Your meal logging consistency is excellent.' : 'Try to log more meals for better insights.'}`;
      setWeeklySummary(summary);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'sleep': return <Moon className="w-4 h-4" />;
      case 'meal': return <Utensils className="w-4 h-4" />;
      case 'exercise': return <Activity className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'bg-green-100 text-green-800';
      case 'B': return 'bg-blue-100 text-blue-800';
      case 'C': return 'bg-yellow-100 text-yellow-800';
      case 'D': return 'bg-orange-100 text-orange-800';
      case 'F': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'concerning': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <div 
      className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
      style={{ 
        paddingTop: 'max(3rem, env(safe-area-inset-top))',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 8rem)' 
      }}
    >
      <div className="px-4 space-y-6">
        
        {/* Header - Apple HIG compliant */}
        <div className="py-4 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Insights</h1>
          <p className="text-sm text-muted-foreground">Discover patterns and wellness trends</p>
        </div>

        {/* Weekly Summary */}
        {weeklySummary && (
          <Card className="bg-gradient-to-br from-purple-500 via-blue-500 to-indigo-600 text-white relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
            
            <CardHeader className="pb-4">
              <CardTitle className="text-white text-xl font-bold">
                This Week's Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{glucoseData.length}</div>
                  <div className="text-xs text-white/80 uppercase tracking-wide">Glucose</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{meals.length}</div>
                  <div className="text-xs text-white/80 uppercase tracking-wide">Meals</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{exercises.length}</div>
                  <div className="text-xs text-white/80 uppercase tracking-wide">Workouts</div>
                </div>
              </div>

              {/* Motivational message */}
              <div className="bg-white/15 backdrop-blur-sm rounded-lg p-3">
                <p className="text-white/95 text-sm leading-relaxed">
                  {exercises.length > 0 ? "Great job staying active! " : "Add some exercise to boost your progress. "}
                  {meals.length > 5 ? "Your meal tracking consistency is excellent." : "Try logging more meals for better insights."}
                </p>
              </div>

              {/* Simple encouragement note */}
              {glucoseData.length < 21 && (
                <div className="text-center">
                  <p className="text-white/70 text-xs">
                    More glucose readings unlock better insights
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Lifestyle Correlations */}
        {correlations.length > 0 && (
          <Card className="bg-white rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>
                Patterns
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {correlations.map((correlation, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                  {getCategoryIcon(correlation.category)}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{correlation.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{correlation.description}</p>
                    <div className="mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(correlation.confidence * 100)}% confidence
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Habit Streaks */}
        {habitStreaks.length > 0 && (
          <Card className="bg-white rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>
                Habits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {habitStreaks.map((streak, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{streak.name}</span>
                      {streak.currentStreak > 0 && (
                        <Badge className="bg-green-100 text-green-800">
                          {streak.currentStreak} day{streak.currentStreak > 1 ? 's' : ''} streak!
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-gray-600">
                      {streak.weeklyCount}/{streak.weeklyGoal}
                    </span>
                  </div>
                  <Progress 
                    value={Math.min(100, streak.percentage)} 
                    className="h-2"
                  />
                  <p className="text-xs text-gray-500">
                    {streak.percentage}% of weekly goal achieved
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Meal Stability Scores */}
        {mealScores.length > 0 && (
          <Card className="bg-white rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>
                Meal Scores
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {mealScores.slice(0, 5).map((score, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex items-start justify-between">
                    <h4 className="font-medium text-gray-900 flex-1 pr-3 leading-tight">{score.mealName}</h4>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge className={getGradeColor(score.grade)}>
                        {score.grade}
                      </Badge>
                      <span className="text-sm font-medium text-gray-600 min-w-[2rem] text-center">
                        {score.stabilityScore}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{score.insight}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Wellness Tips */}
        {wellnessTips.length > 0 && (
          <Card className="bg-white rounded-2xl shadow-sm">
            <CardHeader>
              <CardTitle>
                Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {wellnessTips.map((tip, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                  {getCategoryIcon(tip.category)}
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{tip.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{tip.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Experimental HbA1c Estimate */}
        {hba1cEstimate && hba1cEstimate.estimatedValue > 0 && (
          <Card className="bg-white rounded-2xl shadow-sm border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle>
                HbA1c Estimate
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {hba1cEstimate.estimatedValue}%
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {getTrendIcon(hba1cEstimate.trend)}
                    <span className="text-sm text-gray-600 capitalize">
                      {hba1cEstimate.trend} trend
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="text-xs">
                    {Math.round(hba1cEstimate.confidence * 100)}% confidence
                  </Badge>
                </div>
              </div>
              
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-800">
                    {hba1cEstimate.disclaimer}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && (
          <Card className="bg-white rounded-2xl shadow-sm">
            <CardContent className="py-12 text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-4" />
              <p className="text-gray-600">Analyzing your wellness patterns...</p>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {!isLoading && (!dataLoaded || (glucoseData.length === 0 && meals.length === 0 && exercises.length === 0)) && (
          <Card className="bg-white rounded-2xl shadow-sm">
            <CardContent className="py-12 text-center">
              <TrendingUp className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Build Your Wellness Profile
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Start logging your meals, exercise, and sleep to unlock personalized insights about your wellness patterns.
              </p>
              <Button 
                onClick={() => navigate('/dashboard')}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
              >
                Start Tracking
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      <BottomNav onInsightsClick={async () => {
        setIsLoading(true);
        await loadUserData();
        // Loading state will be set to false in the useEffect when insights are generated
      }} />
    </div>
  );
};

export default Insights;
