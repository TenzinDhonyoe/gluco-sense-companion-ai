import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, ReferenceArea, Tooltip, BarChart, Bar, Area, ComposedChart, LabelList } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { downsampleLTTB, movingAverage } from "@/lib/chartUtils";
import { useMemo, useState, useEffect, useCallback } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, Utensils, Activity, Moon, Calendar, AlertTriangle } from "lucide-react";
import { generateSampleGlucoseData, shouldShowSampleData } from "@/lib/sampleData";
import SampleDataWatermark from "@/components/SampleDataWatermark";
import { 
  loadUserPreferences, 
  formatGlucoseValue,
  convertGlucoseValue,
  type GlucoseUnit 
} from "@/lib/units";

export interface GlucoseReading {
  time: string;
  value: number;
  timestamp: number;
  trendIndex: number;
  source?: string;
}

interface PreDiabeticGlucoseChartProps {
  data?: GlucoseReading[];
  containerClassName?: string;
  onDataUpdate?: (data: GlucoseReading[]) => void;
}

type ViewMode = 'trend' | 'dailyChange';
type TimeWindow = 'all' | 'waking' | 'sleeping';

const PreDiabeticGlucoseChart = ({ 
  data: propData, 
  containerClassName, 
  onDataUpdate
}: PreDiabeticGlucoseChartProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('trend');
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('all');
  const [glucoseData, setGlucoseData] = useState<GlucoseReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [showingSampleData, setShowingSampleData] = useState(false);
  const [preferredUnit, setPreferredUnit] = useState<GlucoseUnit>('mg/dL');

  const fetchGlucoseReadings = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('glucose_readings')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(500);

      if (error) {
        console.error('Error fetching glucose readings:', error);
        setLoading(false);
        return;
      }

      const transformedData: GlucoseReading[] = (data || [])
        .reverse()
        .map((reading, index) => {
          const timestamp = new Date(reading.timestamp).getTime();
          return {
            time: new Date(timestamp).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric'
            }),
            value: Number(reading.value),
            timestamp: timestamp,
            trendIndex: index,
            source: reading.source || 'manual'
          };
        });
      
      // Check if we should show sample data
      const shouldUseSampleData = shouldShowSampleData(transformedData, []);
      
      if (shouldUseSampleData) {
        const sampleData = generateSampleGlucoseData();
        setGlucoseData(sampleData);
        setShowingSampleData(true);
        
        if (onDataUpdate) {
          onDataUpdate(sampleData);
        }
      } else {
        setGlucoseData(transformedData);
        setShowingSampleData(false);
        
        if (onDataUpdate) {
          onDataUpdate(transformedData);
        }
      }
    } catch (error) {
      console.error('Error in fetchGlucoseReadings:', error);
    } finally {
      setLoading(false);
    }
  }, [onDataUpdate]);

  useEffect(() => {
    if (propData && propData.length > 0) {
      setGlucoseData(propData);
      setLoading(false);
    } else {
      fetchGlucoseReadings();
    }
  }, [propData, fetchGlucoseReadings]);

  useEffect(() => {
    const channel = supabase
      .channel('glucose-readings-prediabetic')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'glucose_readings'
      }, () => {
        setTimeout(() => fetchGlucoseReadings(), 100);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchGlucoseReadings]);

  // Load user preferences and listen for unit changes
  useEffect(() => {
    const preferences = loadUserPreferences();
    setPreferredUnit(preferences.preferredUnit);

    // Listen for custom event to update units in real-time
    const handleUnitsChange = (e: CustomEvent) => {
      setPreferredUnit(e.detail.preferredUnit);
    };

    window.addEventListener('glucoseUnitsChanged', handleUnitsChange as EventListener);
    return () => {
      window.removeEventListener('glucoseUnitsChanged', handleUnitsChange as EventListener);
    };
  }, []);

  // Helper function to get Y-axis domain based on preferred unit
  const getYAxisDomain = useMemo(() => {
    if (preferredUnit === 'mmol/L') {
      return [3.0, 11.0]; // mmol/L range (roughly 54-200 mg/dL)
    }
    return [60, 200]; // mg/dL range
  }, [preferredUnit]);

  // Helper function to get daily change domain
  const getDailyChangeDomain = useMemo(() => {
    if (preferredUnit === 'mmol/L') {
      return [-1.1, 1.1]; // mmol/L change range (roughly -20 to +20 mg/dL)
    }
    return [-20, 20]; // mg/dL change range
  }, [preferredUnit]);

  // Helper function to get reference areas for glucose zones
  const getGlucoseZones = useMemo(() => {
    if (preferredUnit === 'mmol/L') {
      return {
        low: { y1: 3.0, y2: 4.4 }, // 54-80 mg/dL
        normal: { y1: 4.4, y2: 7.2 }, // 80-130 mg/dL  
        elevated: { y1: 7.2, y2: 8.9 }, // 130-160 mg/dL
        high: { y1: 8.9, y2: 11.0 } // 160-200 mg/dL
      };
    }
    return {
      low: { y1: 60, y2: 80 },
      normal: { y1: 80, y2: 130 },
      elevated: { y1: 130, y2: 160 },
      high: { y1: 160, y2: 200 }
    };
  }, [preferredUnit]);

  // Calculate time in range for all time windows with individual trends
  const timeInRangeData = useMemo(() => {
    if (!glucoseData.length) return { 
      allDay: 0, waking: 0, sleeping: 0, 
      allDayTrend: 0, wakingTrend: 0, sleepingTrend: 0,
      readingCount: 0
    };
    
    const now = Date.now();
    const last7Days = glucoseData.filter(reading => 
      reading.timestamp >= now - 7 * 24 * 60 * 60 * 1000
    );
    const previous7Days = glucoseData.filter(reading => 
      reading.timestamp >= now - 14 * 24 * 60 * 60 * 1000 && 
      reading.timestamp < now - 7 * 24 * 60 * 60 * 1000
    );

    if (!last7Days.length) return { 
      allDay: 0, waking: 0, sleeping: 0, 
      allDayTrend: 0, wakingTrend: 0, sleepingTrend: 0,
      readingCount: 0
    };

    const calculateTimeInRange = (readings: GlucoseReading[]) => {
      if (!readings.length) return 0;
      const total = readings.length;
      const normal = readings.filter(r => r.value >= 80 && r.value <= 130).length;
      return Math.round((normal / total) * 100);
    };

    // Calculate for all time windows - current week
    const allDayReadings = last7Days;
    const wakingReadings = last7Days.filter(reading => {
      const hour = new Date(reading.timestamp).getHours();
      return hour >= 6 && hour <= 22; // 6 AM to 10 PM
    });
    const sleepingReadings = last7Days.filter(reading => {
      const hour = new Date(reading.timestamp).getHours();
      return hour < 6 || hour > 22; // 10 PM to 6 AM
    });

    // Calculate for all time windows - previous week
    const previousAllDayReadings = previous7Days;
    const previousWakingReadings = previous7Days.filter(reading => {
      const hour = new Date(reading.timestamp).getHours();
      return hour >= 6 && hour <= 22;
    });
    const previousSleepingReadings = previous7Days.filter(reading => {
      const hour = new Date(reading.timestamp).getHours();
      return hour < 6 || hour > 22;
    });

    // Calculate trends for each time window
    const currentAllDay = calculateTimeInRange(allDayReadings);
    const currentWaking = calculateTimeInRange(wakingReadings);
    const currentSleeping = calculateTimeInRange(sleepingReadings);
    
    const previousAllDay = calculateTimeInRange(previousAllDayReadings);
    const previousWaking = calculateTimeInRange(previousWakingReadings);
    const previousSleeping = calculateTimeInRange(previousSleepingReadings);

    const allDayTrend = previousAllDay > 0 ? currentAllDay - previousAllDay : 0;
    const wakingTrend = previousWaking > 0 ? currentWaking - previousWaking : 0;
    const sleepingTrend = previousSleeping > 0 ? currentSleeping - previousSleeping : 0;

    return {
      allDay: currentAllDay,
      waking: currentWaking,
      sleeping: currentSleeping,
      allDayTrend,
      wakingTrend,
      sleepingTrend,
      readingCount: allDayReadings.length
    };
  }, [glucoseData]);

  // Calculate motivational insight
  const getMotivationalInsight = useMemo(() => {
    if (!glucoseData.length) return "Start tracking to see insights";
    
    const last7Days = glucoseData.filter(reading => 
      reading.timestamp >= Date.now() - 7 * 24 * 60 * 60 * 1000
    );

    if (!last7Days.length) return "Start tracking to see insights";

    // Check for stable mornings (fasting readings between 80-100)
    const morningReadings = last7Days.filter(reading => {
      const hour = new Date(reading.timestamp).getHours();
      return hour >= 6 && hour <= 9;
    });
    
    const stableMornings = morningReadings.filter(r => r.value >= 80 && r.value <= 100);
    
    if (stableMornings.length >= 3) {
      return "Stable mornings detected – nice work!";
    }

    // Check if user has good time in range
    if (timeInRangeData.allDay >= 70) {
      return "Great glucose control this week!";
    }

    // Check for consistent logging
    if (last7Days.length >= 14) {
      return "Consistent tracking builds better habits";
    }

    // Default encouragement
    return "Try logging after meals for better trends";
  }, [glucoseData, timeInRangeData.allDay]);

  // Enhanced data processing for Weekly View and other modes
  const processedData = useMemo(() => {
    if (!glucoseData.length) return { chartData: [], weeklyAverage: 0, dailyStats: [], aiSummary: "" };
    
    const last7Days = glucoseData.filter(reading => 
      reading.timestamp >= Date.now() - 7 * 24 * 60 * 60 * 1000
    );

    if (viewMode === 'trend') {
      // Weekly View with enhanced daily statistics
      const dailyData = new Map();
      
      last7Days.forEach(reading => {
        const day = new Date(reading.timestamp).toDateString();
        if (!dailyData.has(day)) {
          dailyData.set(day, []);
        }
        // Use native values based on preferred unit to avoid conversion rounding errors
        const nativeValue = preferredUnit === 'mmol/L' ? 
          (reading.value_mmol_l ?? convertGlucoseValue(reading.value, reading.unit || 'mg/dL', 'mmol/L')) :
          (reading.value_mg_dl ?? convertGlucoseValue(reading.value, reading.unit || 'mg/dL', 'mg/dL'));
        dailyData.get(day).push(nativeValue);
      });

      const dailyStats = Array.from(dailyData.entries()).map(([day, values]) => {
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
        const std = Math.sqrt(values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / values.length);
        const highReadings = values.filter(v => v > 160).length;
        const highPercentage = (highReadings / values.length) * 100;
        const inRangeReadings = values.filter(v => v >= 80 && v <= 130).length;
        const inRangePercentage = (inRangeReadings / values.length) * 100;
        
        return {
          day: new Date(day).toLocaleDateString('en-US', { weekday: 'short' }),
          fullDate: new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          timestamp: new Date(day).getTime(),
          average: preferredUnit === 'mmol/L' ? Math.round(avg * 10) / 10 : Math.round(avg),
          std: Math.round(std),
          upperBand: Math.round(avg + std),
          lowerBand: Math.round(avg - std),
          isProblematic: highPercentage > 30,
          inRangePercentage: Math.round(inRangePercentage),
          readingCount: values.length,
          highPercentage: Math.round(highPercentage)
        };
      }).sort((a, b) => a.timestamp - b.timestamp);

      const weeklyAverage = Math.round(
        last7Days.reduce((sum, reading) => sum + reading.value, 0) / last7Days.length
      );

      // AI Summary generation
      const problematicDays = dailyStats.filter(d => d.isProblematic);
      const avgInRange = Math.round(dailyStats.reduce((sum, d) => sum + d.inRangePercentage, 0) / dailyStats.length);
      
      let aiSummary = "";
      if (problematicDays.length > 2) {
        aiSummary = `High glucose spikes detected on ${problematicDays.length} days this week. Consider reviewing meal choices and timing.`;
      } else if (avgInRange >= 70) {
        aiSummary = `Excellent control with ${avgInRange}% in target range. Keep up the consistent routine!`;
      } else if (weeklyAverage > 140) {
        aiSummary = `Weekly average is elevated. Focus on reducing refined carbs and increasing activity after meals.`;
      } else {
        aiSummary = "Keep up the consistent tracking to identify patterns.";
      }

      return { chartData: dailyStats, weeklyAverage, dailyStats, aiSummary };
    }

    if (viewMode === 'dailyChange') {
      // Group by day and calculate daily averages and changes
      const dailyAverages = new Map();
      
      last7Days.forEach(reading => {
        const day = new Date(reading.timestamp).toDateString();
        if (!dailyAverages.has(day)) {
          dailyAverages.set(day, []);
        }
        dailyAverages.get(day).push(reading.value);
      });

      const dailyData = Array.from(dailyAverages.entries()).map(([day, values]) => {
        const avg = values.reduce((sum: number, val: number) => sum + val, 0) / values.length;
        return {
          day: new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          timestamp: new Date(day).getTime(),
          average: Math.round(avg * 10) / 10
        };
      }).sort((a, b) => a.timestamp - b.timestamp);

      const processedDailyData = dailyData.map((item, index) => ({
        ...item,
        change: index > 0 ? item.average - dailyData[index - 1].average : 0,
        isImprovement: index > 0 ? item.average < dailyData[index - 1].average : false
      }));

      return { chartData: processedDailyData, weeklyAverage: 0, dailyStats: [], aiSummary: "" };
    }

    // Use native values based on preferred unit to avoid conversion rounding errors
    const nativeReadings = last7Days.map(reading => ({
      ...reading,
      value: preferredUnit === 'mmol/L' ? 
        (reading.value_mmol_l ?? convertGlucoseValue(reading.value, reading.unit || 'mg/dL', 'mmol/L')) :
        (reading.value_mg_dl ?? convertGlucoseValue(reading.value, reading.unit || 'mg/dL', 'mg/dL'))
    }));
    
    return { chartData: nativeReadings, weeklyAverage: 0, dailyStats: [], aiSummary: "" };
  }, [glucoseData, viewMode, preferredUnit]);

  // Generate insights
  const insights = useMemo(() => {
    if (!glucoseData.length) return [];
    
    const last7Days = glucoseData.filter(reading => 
      reading.timestamp >= Date.now() - 7 * 24 * 60 * 60 * 1000
    );

    if (!last7Days.length) return [];

    // Get native values for accurate insights
    const readingsWithNativeValues = last7Days.map(reading => ({
      ...reading,
      nativeValue: preferredUnit === 'mmol/L' ? 
        (reading.value_mmol_l ?? convertGlucoseValue(reading.value, reading.unit || 'mg/dL', 'mmol/L')) :
        (reading.value_mg_dl ?? convertGlucoseValue(reading.value, reading.unit || 'mg/dL', 'mg/dL'))
    }));

    const lowest = readingsWithNativeValues.reduce((min, reading) => reading.nativeValue < min.nativeValue ? reading : min);
    const highest = readingsWithNativeValues.reduce((max, reading) => reading.nativeValue > max.nativeValue ? reading : max);
    
    // Calculate most stable day (lowest variance)
    const dailyVariances = new Map();
    readingsWithNativeValues.forEach(reading => {
      const day = new Date(reading.timestamp).toDateString();
      if (!dailyVariances.has(day)) {
        dailyVariances.set(day, []);
      }
      dailyVariances.get(day).push(reading.nativeValue);
    });

    let mostStableDay = '';
    let lowestVariance = Infinity;
    
    dailyVariances.forEach((values, day) => {
      if (values.length > 1) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        if (variance < lowestVariance) {
          lowestVariance = variance;
          mostStableDay = new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
      }
    });

    return [
      {
        icon: TrendingDown,
        text: `Lowest reading: ${lowest.nativeValue} ${preferredUnit}`,
        subtext: new Date(lowest.timestamp).toLocaleDateString(),
        color: 'text-green-600'
      },
      {
        icon: TrendingUp,
        text: `Highest reading: ${highest.nativeValue} ${preferredUnit}`,
        subtext: new Date(highest.timestamp).toLocaleDateString(),
        color: 'text-red-600'
      },
      ...(mostStableDay ? [{
        icon: Calendar,
        text: `Most stable day: ${mostStableDay}`,
        subtext: 'Lowest glucose variance',
        color: 'text-blue-600'
      }] : [])
    ];
  }, [glucoseData, preferredUnit]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      
      if (viewMode === 'dailyChange') {
        return (
          <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
            <p className="font-medium text-gray-900">{point.day}</p>
            <p className="text-sm text-gray-600">Average: {point.average} {preferredUnit}</p>
            {point.change !== 0 && (
              <p className={`text-sm ${point.isImprovement ? 'text-green-600' : 'text-red-600'}`}>
                {point.change > 0 ? '+' : ''}{formatGlucoseValue(Math.abs(point.change), preferredUnit, false)} from yesterday
              </p>
            )}
          </div>
        );
      }

      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="font-medium text-gray-900">{point.value} {preferredUnit}</p>
          <p className="text-sm text-gray-600">{new Date(point.timestamp).toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className={cn("w-full bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6", containerClassName)}>
        <div className="text-center">
          <div className="text-gray-400 text-lg font-medium">Loading...</div>
        </div>
      </div>
    );
  }

  if (!glucoseData.length) {
    return (
      <div className={cn("w-full bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6", containerClassName)}>
        <div className="text-center">
          <div className="text-gray-400 text-lg font-medium">No glucose data available</div>
        </div>
      </div>
    );
  }


  return (
    <div className={cn("w-full rounded-2xl px-4 py-5 space-y-4", containerClassName)}>
      {/* Graph Section */}
      <div className="space-y-3">
        {/* Refined View Mode Pills */}
        <div className="flex justify-center">
          <div className="bg-muted rounded-full p-1 inline-flex">
            <button
              onClick={() => setViewMode('trend')}
              className={cn(
                "rounded-full px-4 py-1 text-sm font-medium transition-all duration-200",
                viewMode === 'trend' 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Trend
            </button>
            <button
              onClick={() => setViewMode('dailyChange')}
              className={cn(
                "rounded-full px-4 py-1 text-sm font-medium transition-all duration-200",
                viewMode === 'dailyChange' 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Daily Change
            </button>
          </div>
        </div>


        {/* Enhanced Chart */}
        <div className="h-[200px] w-full animate-fade-in relative">
          {/* Sample Data Watermark */}
          {showingSampleData && <SampleDataWatermark />}
          
          <ChartContainer 
            config={{ 
              glucose: { label: `Glucose (${preferredUnit})`, color: "#3B82F6" },
              change: { label: "Daily Change", color: "#10B981" }
            }} 
            className="h-full w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              {viewMode === 'dailyChange' ? (
                <BarChart data={processedData.chartData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="none" className="stroke-transparent" />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                    axisLine={false}
                    tickLine={false}
                    width={35}
                    domain={getDailyChangeDomain}
                    tickFormatter={(value) => preferredUnit === 'mmol/L' ? value.toFixed(1) : Math.round(value).toString()}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={0} stroke="#6B7280" strokeDasharray="2 2" />
                  <Bar 
                    dataKey="change" 
                    shape={(props: any) => {
                      const { payload, x, y, width, height, ...rest } = props;
                      const isNegative = payload.change < 0;
                      const color = payload.change >= 0 ? "#EF4444" : "#10B981";
                      
                      // Ensure minimum visible height for small values
                      const minHeight = 3;
                      const actualHeight = Math.max(Math.abs(height), minHeight);
                      
                      // For negative values, adjust y position
                      const adjustedY = isNegative ? y - actualHeight : y;
                      
                      return (
                        <rect 
                          {...rest}
                          x={x}
                          y={adjustedY}
                          width={width}
                          height={actualHeight}
                          fill={color}
                          rx={2}
                          ry={2}
                        />
                      );
                    }}
                  />
                </BarChart>
              ) : (
                <ComposedChart data={processedData.chartData} margin={{ top: 20, right: 10, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="none" className="stroke-transparent" />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    domain={getYAxisDomain}
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                    axisLine={false}
                    tickLine={false}
                    width={35}
                    tickFormatter={(value) => preferredUnit === 'mmol/L' ? value.toFixed(1) : Math.round(value).toString()}
                  />
                  
                  {/* Glucose zones with labels */}
                  <ReferenceArea y1={getGlucoseZones.low.y1} y2={getGlucoseZones.low.y2} fill="#f97316" fillOpacity={0.08} />
                  <ReferenceArea y1={getGlucoseZones.normal.y1} y2={getGlucoseZones.normal.y2} fill="#22c55e" fillOpacity={0.08} />
                  <ReferenceArea y1={getGlucoseZones.elevated.y1} y2={getGlucoseZones.elevated.y2} fill="#f59e0b" fillOpacity={0.08} />
                  <ReferenceArea y1={getGlucoseZones.high.y1} y2={getGlucoseZones.high.y2} fill="#ef4444" fillOpacity={0.08} />

                  
                  {/* Weekly average line */}
                  {processedData.weeklyAverage > 0 && (
                    <ReferenceLine 
                      y={processedData.weeklyAverage} 
                      stroke="#3B82F6" 
                      strokeWidth={2} 
                      strokeDasharray="8 4" 
                      opacity={0.8}
                    />
                  )}
                  
                  {/* Variability bands */}
                  <Area 
                    type="monotone" 
                    dataKey="upperBand" 
                    stroke="none" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.1}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="lowerBand" 
                    stroke="none" 
                    fill="hsl(var(--primary))" 
                    fillOpacity={0.1}
                  />
                  
                  <Tooltip content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const point = payload[0].payload;
                      return (
                        <div className="bg-white border border-gray-200 rounded-lg p-2 shadow-lg">
                          <p className="font-medium text-gray-900 text-sm">{point.fullDate}</p>
                          <p className="text-xs text-gray-600">Avg: {point.average} {preferredUnit}</p>
                          <p className="text-xs text-gray-600">{point.readingCount} readings</p>
                        </div>
                      );
                    }
                    return null;
                  }} />
                  
                  {/* Main glucose line with enhanced styling for problematic days */}
                  <Line 
                    type="monotone" 
                    dataKey="average" 
                    stroke="hsl(var(--primary))"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    dot={(props: any) => {
                      const { payload, cx, cy } = props;
                      const isProblematic = payload?.isProblematic;
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isProblematic ? 6 : 4}
                          fill={isProblematic ? "#ef4444" : "hsl(var(--primary))"}
                          stroke="white"
                          strokeWidth={2}
                          className="cursor-pointer hover:r-8 transition-all"
                          onClick={() => {
                            // Handle day click for detailed view
                            console.log('Clicked day:', payload);
                          }}
                        />
                      );
                    }}
                    activeDot={{ 
                      r: 8, 
                      fill: "hsl(var(--primary))", 
                      stroke: "white", 
                      strokeWidth: 3,
                      className: "cursor-pointer"
                    }}
                  />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Time in Range Metrics Row - Horizontal Layout */}
        {viewMode === 'trend' && timeInRangeData.readingCount > 0 && (
          <div className="flex flex-row gap-2 mt-4 justify-center items-stretch">
            {/* All Day Metric */}
            <div className="flex-1 w-[48%] bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 border border-gray-100/80 shadow-sm hover:shadow-md transition-all duration-200 min-h-[60px] flex items-center">
              <div className="flex items-center justify-center gap-1 text-sm sm:text-base font-semibold text-gray-900 w-full">
                <span>{timeInRangeData.allDay}% All Day</span>
                {timeInRangeData.allDayTrend !== 0 && (
                  <span className={cn(
                    "text-xs sm:text-sm",
                    timeInRangeData.allDayTrend > 0 ? "text-emerald-600" : "text-orange-500"
                  )}>
                    {timeInRangeData.allDayTrend > 0 ? '↑' : '↓'}{Math.abs(timeInRangeData.allDayTrend)}%
                  </span>
                )}
              </div>
            </div>
            
            {/* Overnight Metric */}
            <div className="flex-1 w-[48%] bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 border border-gray-100/80 shadow-sm hover:shadow-md transition-all duration-200 min-h-[60px] flex items-center">
              <div className="flex items-center justify-center gap-1 text-sm sm:text-base font-semibold text-gray-900 w-full">
                <span>{timeInRangeData.sleeping}% Overnight</span>
                {timeInRangeData.sleepingTrend !== 0 && (
                  <span className={cn(
                    "text-xs sm:text-sm",
                    timeInRangeData.sleepingTrend > 0 ? "text-emerald-600" : "text-orange-500"
                  )}>
                    {timeInRangeData.sleepingTrend > 0 ? '↑' : '↓'}{Math.abs(timeInRangeData.sleepingTrend)}%
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreDiabeticGlucoseChart;