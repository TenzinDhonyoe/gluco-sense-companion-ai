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

const PreDiabeticGlucoseChart = ({ 
  data: propData, 
  containerClassName, 
  onDataUpdate
}: PreDiabeticGlucoseChartProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>('trend');
  const [glucoseData, setGlucoseData] = useState<GlucoseReading[]>([]);
  const [loading, setLoading] = useState(true);

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
      
      setGlucoseData(transformedData);
      
      if (onDataUpdate) {
        onDataUpdate(transformedData);
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

  type TimeWindow = 'all' | 'waking' | 'sleeping';
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('all');

  // Calculate time in range with different time windows
  const timeInRangeData = useMemo(() => {
    if (!glucoseData.length) return { normal: 0, elevated: 0, high: 0, low: 0, weeklyTrend: 0, timeWindow: 'all' };
    
    const now = Date.now();
    const last5Days = glucoseData.filter(reading => 
      reading.timestamp >= now - 5 * 24 * 60 * 60 * 1000
    );
    const previous5Days = glucoseData.filter(reading => 
      reading.timestamp >= now - 10 * 24 * 60 * 60 * 1000 && 
      reading.timestamp < now - 5 * 24 * 60 * 60 * 1000
    );

    if (!last5Days.length) return { normal: 0, elevated: 0, high: 0, low: 0, weeklyTrend: 0, timeWindow };

    const filterByTimeWindow = (readings: GlucoseReading[]) => {
      if (timeWindow === 'all') return readings;
      
      return readings.filter(reading => {
        const hour = new Date(reading.timestamp).getHours();
        if (timeWindow === 'waking') return hour >= 6 && hour <= 22; // 6AM-10PM
        if (timeWindow === 'sleeping') return hour < 6 || hour > 22; // 10PM-6AM
        return true;
      });
    };

    const currentPeriod = filterByTimeWindow(last5Days);
    const previousPeriod = filterByTimeWindow(previous5Days);

    const calculateTimeInRange = (readings: GlucoseReading[]) => {
      if (!readings.length) return 0;
      const total = readings.length;
      const normal = readings.filter(r => r.value >= 80 && r.value <= 130).length;
      return Math.round((normal / total) * 100);
    };

    const currentInRange = calculateTimeInRange(currentPeriod);
    const previousInRange = calculateTimeInRange(previousPeriod);
    const weeklyTrend = previousInRange > 0 ? currentInRange - previousInRange : 0;

    const total = currentPeriod.length;
    const normal = currentPeriod.filter(r => r.value >= 80 && r.value <= 130).length;
    const elevated = currentPeriod.filter(r => r.value > 130 && r.value <= 160).length;
    const high = currentPeriod.filter(r => r.value > 160).length;
    const low = currentPeriod.filter(r => r.value < 80).length;

    return {
      normal: Math.round((normal / total) * 100),
      elevated: Math.round((elevated / total) * 100),
      high: Math.round((high / total) * 100),
      low: Math.round((low / total) * 100),
      weeklyTrend,
      timeWindow
    };
  }, [glucoseData, timeWindow]);

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
    if (timeInRangeData.normal >= 70) {
      return "Great glucose control this week!";
    }

    // Check for consistent logging
    if (last7Days.length >= 14) {
      return "Consistent tracking builds better habits";
    }

    // Default encouragement
    return "Try logging after meals for better trends";
  }, [glucoseData, timeInRangeData.normal]);

  // Enhanced data processing for 5-day trend and detailed daily view
  const processedData = useMemo(() => {
    if (!glucoseData.length) return { chartData: [], weeklyAverage: 0, dailyStats: [], aiSummary: "", contextualInsight: "" };
    
    const last5Days = glucoseData.filter(reading => 
      reading.timestamp >= Date.now() - 5 * 24 * 60 * 60 * 1000
    );

    if (viewMode === 'trend') {
      // 5-day trend view with simplified daily averages
      const dailyData = new Map();
      
      last5Days.forEach(reading => {
        const day = new Date(reading.timestamp).toDateString();
        if (!dailyData.has(day)) {
          dailyData.set(day, []);
        }
        dailyData.get(day).push(reading.value);
      });

      const dailyStats = Array.from(dailyData.entries()).map(([day, values]) => {
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
        const lastValue = values[values.length - 1]; // Most recent reading of the day
        const maxValue = Math.max(...values);
        const minValue = Math.min(...values);
        const range = maxValue - minValue;
        
        return {
          day: new Date(day).toLocaleDateString('en-US', { weekday: 'short' }),
          fullDate: new Date(day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          timestamp: new Date(day).getTime(),
          average: Math.round(avg),
          lastValue: lastValue,
          maxValue,
          minValue,
          range,
          readingCount: values.length,
          isElevated: avg > 140,
          changeFromPrevious: 0 // Will be calculated after sorting
        };
      }).sort((a, b) => a.timestamp - b.timestamp);

      // Calculate day-to-day changes
      dailyStats.forEach((day, index) => {
        if (index > 0) {
          day.changeFromPrevious = day.average - dailyStats[index - 1].average;
        }
      });

      // Generate contextual insight based on patterns
      let contextualInsight = "";
      const eveningReadings = last5Days.filter(reading => {
        const hour = new Date(reading.timestamp).getHours();
        return hour >= 18 && hour <= 22; // 6PM-10PM
      });

      const morningReadings = last5Days.filter(reading => {
        const hour = new Date(reading.timestamp).getHours();
        return hour >= 6 && hour <= 10; // 6AM-10AM
      });

      if (eveningReadings.length >= 3) {
        const avgEvening = eveningReadings.reduce((sum, r) => sum + r.value, 0) / eveningReadings.length;
        const avgMorning = morningReadings.length ? morningReadings.reduce((sum, r) => sum + r.value, 0) / morningReadings.length : 0;
        
        if (avgEvening > avgMorning + 20) {
          contextualInsight = "Your glucose rises ~20 mg/dL after dinner. Try walking post-meal.";
        } else if (avgEvening < avgMorning - 10) {
          contextualInsight = "Evening readings look stable. Great dinner portion control!";
        }
      }

      if (!contextualInsight && dailyStats.length >= 3) {
        const recentTrend = dailyStats.slice(-3);
        const avgChange = recentTrend.reduce((sum, day) => sum + Math.abs(day.changeFromPrevious), 0) / recentTrend.length;
        
        if (avgChange > 15) {
          contextualInsight = "Glucose varies significantly day-to-day. Consider meal timing consistency.";
        } else if (avgChange < 5) {
          contextualInsight = "Very stable glucose pattern. Excellent consistency!";
        }
      }

      if (!contextualInsight) {
        contextualInsight = "Track post-meal readings to identify food impact patterns.";
      }

      return { 
        chartData: dailyStats, 
        weeklyAverage: 0, 
        dailyStats, 
        aiSummary: "", 
        contextualInsight 
      };
    }

    if (viewMode === 'dailyChange') {
      // Group by day and calculate daily averages and changes
      const dailyAverages = new Map();
      
      last5Days.forEach(reading => {
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

      return { chartData: processedDailyData, weeklyAverage: 0, dailyStats: [], aiSummary: "", contextualInsight: "" };
    }

    return { chartData: last5Days, weeklyAverage: 0, dailyStats: [], aiSummary: "", contextualInsight: "" };
  }, [glucoseData, viewMode]);

  // Generate insights
  const insights = useMemo(() => {
    if (!glucoseData.length) return [];
    
    const last7Days = glucoseData.filter(reading => 
      reading.timestamp >= Date.now() - 7 * 24 * 60 * 60 * 1000
    );

    if (!last7Days.length) return [];

    const lowest = last7Days.reduce((min, reading) => reading.value < min.value ? reading : min);
    const highest = last7Days.reduce((max, reading) => reading.value > max.value ? reading : max);
    
    // Calculate most stable day (lowest variance)
    const dailyVariances = new Map();
    last7Days.forEach(reading => {
      const day = new Date(reading.timestamp).toDateString();
      if (!dailyVariances.has(day)) {
        dailyVariances.set(day, []);
      }
      dailyVariances.get(day).push(reading.value);
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
        text: `Lowest reading: ${lowest.value} mg/dL`,
        subtext: new Date(lowest.timestamp).toLocaleDateString(),
        color: 'text-green-600'
      },
      {
        icon: TrendingUp,
        text: `Highest reading: ${highest.value} mg/dL`,
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
  }, [glucoseData]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      
      if (viewMode === 'dailyChange') {
        return (
          <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
            <p className="font-medium text-gray-900">{point.day}</p>
            <p className="text-sm text-gray-600">Average: {point.average} mg/dL</p>
            {point.change !== 0 && (
              <p className={`text-sm ${point.isImprovement ? 'text-green-600' : 'text-red-600'}`}>
                {point.change > 0 ? '+' : ''}{Math.round(point.change * 10) / 10} mg/dL from yesterday
              </p>
            )}
          </div>
        );
      }

      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="font-medium text-gray-900">{point.value} mg/dL</p>
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

        {/* Time in Range Badge and Controls for Trend View */}
        {viewMode === 'trend' && (
          <div className="flex flex-col items-center mb-2 space-y-2">
            {/* Clickable Time Window Badge */}
            <button
              onClick={() => {
                const windows: TimeWindow[] = ['all', 'waking', 'sleeping'];
                const currentIndex = windows.indexOf(timeWindow);
                const nextIndex = (currentIndex + 1) % windows.length;
                setTimeWindow(windows[nextIndex]);
              }}
              className="bg-green-100 text-green-800 border-green-200 px-3 py-1 rounded-full text-sm font-medium hover:bg-green-200 transition-colors cursor-pointer"
            >
              {timeInRangeData.normal}% in range during {
                timeWindow === 'all' ? 'all day' : 
                timeWindow === 'waking' ? 'waking hours' : 
                'sleeping hours'
              }
            </button>
            
            {/* Trend Indicator */}
            {timeInRangeData.weeklyTrend !== 0 && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                {timeInRangeData.weeklyTrend > 0 ? (
                  <>
                    <TrendingUp className="w-3 h-3 text-green-600" />
                    <span className="text-green-600">↑ {Math.abs(timeInRangeData.weeklyTrend)}% from last week</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-3 h-3 text-red-600" />
                    <span className="text-red-600">↓ {Math.abs(timeInRangeData.weeklyTrend)}% from last week</span>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Enhanced Chart */}
        <div className="h-[200px] w-full animate-fade-in">
          <ChartContainer 
            config={{ 
              glucose: { label: "Glucose (mg/dL)", color: "#3B82F6" },
              change: { label: "Daily Change", color: "#10B981" }
            }} 
            className="h-full w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              {viewMode === 'dailyChange' ? (
                <BarChart data={processedData.chartData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="2 4" className="stroke-gray-200/60" />
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
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <ReferenceLine y={0} stroke="#6B7280" strokeDasharray="2 2" />
                  <Bar 
                    dataKey="change" 
                    fill="#3B82F6"
                    radius={[4, 4, 0, 0]}
                    shape={(props: any) => {
                      const { payload, ...rest } = props;
                      const color = payload?.isImprovement ? "#10B981" : "#EF4444";
                      return <rect {...rest} fill={color} />;
                    }}
                  />
                </BarChart>
              ) : (
                <ComposedChart data={processedData.chartData} margin={{ top: 20, right: 10, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="2 4" className="stroke-gray-200/60" />
                  <XAxis 
                    dataKey="day" 
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                   <YAxis 
                     domain={[60, 200]}
                     tick={false}
                     axisLine={false}
                     tickLine={false}
                     width={0}
                   />
                  
                  {/* Glucose zones with labels */}
                  <ReferenceArea y1={60} y2={80} fill="#f97316" fillOpacity={0.08} />
                  <ReferenceArea y1={80} y2={130} fill="#22c55e" fillOpacity={0.08} />
                  <ReferenceArea y1={130} y2={160} fill="#f59e0b" fillOpacity={0.08} />
                  <ReferenceArea y1={160} y2={200} fill="#ef4444" fillOpacity={0.08} />

                  {/* Zone boundary lines */}
                  <ReferenceLine y={80} stroke="#f97316" strokeWidth={1} strokeDasharray="4 4" opacity={0.5} />
                  <ReferenceLine y={130} stroke="#f59e0b" strokeWidth={1} strokeDasharray="4 4" opacity={0.5} />
                  <ReferenceLine y={160} stroke="#ef4444" strokeWidth={1} strokeDasharray="4 4" opacity={0.5} />
                  
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
                         <div className="bg-white border border-gray-200 rounded-lg p-2 shadow-sm max-w-[140px]">
                           <p className="font-medium text-gray-900 text-xs">{point.day}</p>
                           <p className="text-xs text-gray-600">{point.average} mg/dL avg</p>
                           {point.readingCount > 1 && (
                             <p className="text-xs text-gray-500">{point.readingCount} readings</p>
                           )}
                         </div>
                       );
                     }
                     return null;
                   }} />
                  
                   {/* Main glucose line with change indicators on final point */}
                   <Line 
                     type="monotone" 
                     dataKey="average" 
                     stroke="hsl(var(--primary))"
                     strokeWidth={3}
                     strokeLinecap="round"
                     strokeLinejoin="round"
                     dot={(props: any) => {
                       const { payload, cx, cy, index } = props;
                       const isLast = index === processedData.chartData.length - 1;
                       const isElevated = payload?.isElevated;
                       
                       return (
                         <circle
                           cx={cx}
                           cy={cy}
                           r={isLast ? 6 : 4}
                           fill={isElevated ? "#ef4444" : "hsl(var(--primary))"}
                           stroke="white"
                           strokeWidth={isLast ? 3 : 2}
                           className="cursor-pointer transition-all"
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

        {/* Contextual Insight for Trend View */}
        {viewMode === 'trend' && processedData.contextualInsight && (
          <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-amber-500 flex-shrink-0 flex items-center justify-center mt-0.5">
                <span className="text-white text-xs font-bold">💡</span>
              </div>
              <p className="text-sm text-amber-800 leading-relaxed">{processedData.contextualInsight}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreDiabeticGlucoseChart;