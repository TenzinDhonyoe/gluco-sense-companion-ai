import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Activity, Footprints, Flame, Moon, Plus, TrendingUp, Clock, Utensils, RotateCcw } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import GlucoseTrendCard from "@/components/GlucoseTrendCard";
import PreDiabeticGlucoseChart from "@/components/PreDiabeticGlucoseChart";
import QuickAddDrawer from "@/components/QuickAddDrawer";
import AISuggestionsCard from "@/components/AISuggestionsCard";
import StabilityPill from "@/components/StabilityPill";
import { supabase } from "@/integrations/supabase/client";
import { type GlucoseReading } from "@/components/GlucoseTrendChart";
import { type LogEntry } from "@/lib/logStore";
import DynamicAvatar from "@/components/DynamicAvatar";
import ClearDataButton from "@/components/ClearDataButton";
import Timeline from "@/components/Timeline";
import { 
  loadUserPreferences, 
  updatePreferredUnit, 
  formatGlucoseValue,
  type GlucoseUnit 
} from "@/lib/units";
import { 
  calculateStabilityScore, 
  getWeeklyStabilityScore,
  type StabilityScore 
} from "@/lib/analysis/stabilityScore";
import { getLogs, type LogEntry as StoredLogEntry } from "@/lib/logStore";
import { shouldShowSampleData, generateSampleLogs } from "@/lib/sampleData";
import { healthKitService, type HealthKitData } from "@/lib/healthKit";
const Dashboard = () => {
  const navigate = useNavigate();
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [glucoseData, setGlucoseData] = useState<GlucoseReading[]>([]);
  const [preferredUnit, setPreferredUnit] = useState<GlucoseUnit>('mg/dL');
  const [stabilityScore, setStabilityScore] = useState<StabilityScore | null>(null);
  const [realLogs, setRealLogs] = useState<LogEntry[]>([]);
  const [displayLogs, setDisplayLogs] = useState<LogEntry[]>([]);
  const [userName, setUserName] = useState<string>("User");
  const [todaysProgress, setTodaysProgress] = useState({
    steps: 0,
    stepsGoal: 10000,
    sleep: 0,
    sleepGoal: 8,
    meals: 0,
    mealsGoal: 3
  });
  const [healthKitData, setHealthKitData] = useState<HealthKitData | null>(null);

  // Initialize user preferences
  useEffect(() => {
    const preferences = loadUserPreferences();
    setPreferredUnit(preferences.preferredUnit);
  }, []);

  // Fetch user profile
  useEffect(() => {
    const fetchUserProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('name')
          .eq('id', user.id)
          .single();

        if (profile && profile.name) {
          const firstName = profile.name.split(' ')[0];
          setUserName(firstName);
        }
      }
    };

    fetchUserProfile();
  }, []);

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Load HealthKit data and update today's progress
  useEffect(() => {
    const loadHealthKitData = async () => {
      try {
        console.log('Fetching HealthKit data...');
        const healthData = await healthKitService.getTodayHealthData();
        setHealthKitData(healthData);
        
        // Only update if we have valid data
        if (healthData.steps > 0 || healthData.sleep > 0 || healthData.hasPermissions) {
          setTodaysProgress(prev => ({
            ...prev,
            steps: healthData.steps || prev.steps,
            sleep: healthData.sleep || prev.sleep
          }));
          console.log('HealthKit data loaded successfully:', healthData);
        } else {
          console.log('HealthKit data unavailable, using fallback values');
          // Set reasonable fallback values if HealthKit returns zeros
          setTodaysProgress(prev => ({
            ...prev,
            steps: 6500, // Reasonable default
            sleep: 7.2   // Reasonable default
          }));
        }
      } catch (error) {
        console.error('Failed to load HealthKit data:', error);
        // Set fallback values on error
        setTodaysProgress(prev => ({
          ...prev,
          steps: 6500,
          sleep: 7.2
        }));
        
        // Set error state for debugging
        setHealthKitData({
          steps: 0,
          sleep: 0,
          hasPermissions: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        });
      }
    };

    loadHealthKitData();
  }, []);

  // Load real logs and listen for changes
  useEffect(() => {
    const loadLogs = () => {
      const storedLogs = getLogs().map(log => ({
        ...log,
        time: new Date(log.time) // Convert ISO string back to Date
      }));
      setRealLogs(storedLogs);
      console.log('Dashboard loaded', storedLogs.length, 'real logs');
    };

    loadLogs(); // Initial load

    // Listen for real-time updates
    const handleLogsChanged = () => {
      console.log('Dashboard detected logs change - updating...');
      loadLogs();
    };

    window.addEventListener('logsChanged', handleLogsChanged);
    return () => {
      window.removeEventListener('logsChanged', handleLogsChanged);
    };
  }, []);

  // Callback to handle glucose data updates from the chart component
  const handleGlucoseDataUpdate = useCallback((data: GlucoseReading[]) => {
    console.log('Dashboard received glucose data update:', data.length, 'readings');
    setGlucoseData(data);
    
    // Calculate stability score when glucose data updates
    if (data.length > 0) {
      const mockMeals = []; // TODO: Load real meal data
      const score = getWeeklyStabilityScore(
        data.map(d => ({ value: d.value, timestamp: d.timestamp })),
        mockMeals
      );
      setStabilityScore(score);
    }
  }, []);

  // Update display logs and meal count based on whether we should show sample data
  useEffect(() => {
    const shouldUseSampleData = shouldShowSampleData(glucoseData, realLogs);
    
    if (shouldUseSampleData) {
      const sampleLogs = generateSampleLogs();
      setDisplayLogs(sampleLogs);
      // For sample data, use a mock meal count
      setTodaysProgress(prev => ({ ...prev, meals: 2 }));
    } else {
      setDisplayLogs(realLogs);
      // Calculate today's meal count from real logs
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);
      
      const todaysMealLogs = realLogs.filter(log => {
        const logDate = new Date(log.time);
        return log.type === 'meal' && logDate >= startOfDay && logDate <= endOfDay;
      });
      
      setTodaysProgress(prev => ({ ...prev, meals: todaysMealLogs.length }));
    }
  }, [glucoseData, realLogs]);

  const toggleUnit = () => {
    const newUnit = preferredUnit === 'mg/dL' ? 'mmol/L' : 'mg/dL';
    setPreferredUnit(newUnit);
    updatePreferredUnit(newUnit);
  };

  // Calculate weekly summary from glucose data
  const weeklySummary = useMemo(() => {
    if (!glucoseData.length) return {
      average: 0,
      inRange: 0,
      elevated: 0,
      status: 'normal',
      statusText: 'Looking steady',
      statusColor: 'green'
    };
    const last7Days = glucoseData.filter(reading => reading.timestamp >= Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (!last7Days.length) return {
      average: 0,
      inRange: 0,
      elevated: 0,
      status: 'normal',
      statusText: 'Looking steady',
      statusColor: 'green'
    };
    const total = last7Days.length;
    const average = Math.round(last7Days.reduce((sum, reading) => sum + reading.value, 0) / total);
    const inRange = Math.round(last7Days.filter(r => r.value >= 80 && r.value <= 130).length / total * 100);
    const elevated = Math.round(last7Days.filter(r => r.value > 130).length / total * 100);

    // Determine status based on average glucose (using wellness-safe language)
    let status = 'normal';
    let statusText = 'Looking steady';
    let statusColor = 'green';
    if (average >= 80 && average <= 130) {
      status = 'normal';
      statusText = 'Looking steady';
      statusColor = 'green';
    } else if (average > 130 && average <= 160) {
      status = 'elevated';
      statusText = 'Some variation';
      statusColor = 'yellow';
    } else if (average > 160) {
      status = 'high';
      statusText = 'Wide patterns';
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
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative" style={{
    paddingTop: 'max(3rem, env(safe-area-inset-top))',
    paddingLeft: 'env(safe-area-inset-left)',
    paddingRight: 'env(safe-area-inset-right)',
    paddingBottom: 'calc(env(safe-area-inset-bottom) + 8rem)',
    zIndex: 1
  }}>
      <div className="px-4 space-y-6">
        {/* Header - Apple HIG compliant */}
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center pl-2">
            <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
              Hi <span className="text-blue-600">{userName}</span>
            </h1>
          </div>
          <div className="flex items-center">
            <DynamicAvatar onClick={() => {
              navigate("/profile");
              // Reset scroll position to top after navigation
              setTimeout(() => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }, 0);
            }} size={44} className="w-11 h-11 rounded-full shadow-sm" />
          </div>
        </div>

        {/* Weekly Summary Card */}
        <Card className="bg-white rounded-full shadow-sm border-2">
          <CardContent className="px-6 py-4">
            <div className="text-center space-y-3">
              <p className="text-sm text-muted-foreground uppercase tracking-wide">Weekly Average</p>
              
              <p className="text-3xl font-bold">
                {formatGlucoseValue(weeklySummary.average, preferredUnit)}
              </p>
              
              <div className="flex items-center justify-center gap-3">
                {/* Show stability score if available (more accurate), otherwise show basic status */}
                {stabilityScore ? (
                  <StabilityPill score={stabilityScore} size="sm" showValue={false} />
                ) : (
                  <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${weeklySummary.statusColor === 'green' ? 'bg-green-100 text-green-700' : weeklySummary.statusColor === 'yellow' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full ${weeklySummary.statusColor === 'green' ? 'bg-green-500' : weeklySummary.statusColor === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                    {weeklySummary.statusText}
                  </div>
                )}
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
          <AISuggestionsCard glucoseData={glucoseData} logs={displayLogs} />
        </div>

        {/* Today's Progress - Harmonized spacing */}
        <Card className="bg-white rounded-2xl shadow-sm">
          <CardHeader className="px-6 py-[18px]">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              <span>Today's Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 sm:px-6 pb-6 pt-0">
            <div className="grid grid-cols-3 gap-3 sm:gap-6">
              <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3 min-h-[120px] justify-between">
                <div className="relative flex-shrink-0">
                  <CircularProgress value={stepsProgress} color="text-blue-500" size={56} strokeWidth={4} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg sm:text-xl font-bold text-gray-900 leading-none">
                      {Math.round(todaysProgress.steps / 1000)}k
                    </span>
                  </div>
                </div>
                <div className="space-y-1 flex-1 flex flex-col justify-center">
                  <p className="text-xs sm:text-sm font-medium text-gray-900">Steps</p>
                  <p className="text-xs text-gray-500">{Math.round(stepsProgress)}% of goal</p>
                </div>
              </div>
              
              <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3 min-h-[120px] justify-between">
                <div className="relative flex-shrink-0">
                  <CircularProgress value={sleepProgress} color="text-green-500" size={56} strokeWidth={4} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg sm:text-xl font-bold text-gray-900 leading-none">
                      {todaysProgress.sleep}h
                    </span>
                  </div>
                </div>
                <div className="space-y-1 flex-1 flex flex-col justify-center">
                  <p className="text-xs sm:text-sm font-medium text-gray-900">Sleep</p>
                  <p className="text-xs text-gray-500">{Math.round(sleepProgress)}% of goal</p>
                </div>
              </div>
              
              <div className="flex flex-col items-center text-center space-y-2 sm:space-y-3 min-h-[120px] justify-between">
                <div className="relative flex-shrink-0">
                  <CircularProgress value={mealsProgress} color="text-amber-500" size={56} strokeWidth={4} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg sm:text-xl font-bold text-gray-900 leading-none">
                      {todaysProgress.meals}
                    </span>
                  </div>
                </div>
                <div className="space-y-1 flex-1 flex flex-col justify-center">
                  <p className="text-xs sm:text-sm font-medium text-gray-900">Meals</p>
                  <p className="text-xs text-gray-500">{Math.round(mealsProgress)}% of goal</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>


        {/* Timeline - Chronological list of all activity */}
        <div className="w-full">
          <Timeline glucoseData={glucoseData} logs={displayLogs} />
        </div>

        {/* Clear Data Button - Apple HIG compliant */}
        <div className="flex justify-center pt-4 border-t border-gray-200 mb-6">
          <ClearDataButton />
        </div>
      </div>

      {/* Floating Action Button - Improved design */}
      <div className="fixed bottom-6 right-6 z-40" style={{
      bottom: 'calc(6rem + env(safe-area-inset-bottom))'
    }}>
        <QuickAddDrawer />
      </div>

      <BottomNav />
    </div>;
};
export default Dashboard;