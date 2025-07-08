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

  // Calculate time in range with time window filtering
  const timeInRangeData = useMemo(() => {
    if (!glucoseData.length) return { normal: 0, elevated: 0, high: 0, low: 0, weeklyTrend: 0, label: "all day" };
    
    const now = Date.now();
    const last5Days = glucoseData.filter(reading => 
      reading.timestamp >= now - 5 * 24 * 60 * 60 * 1000
    );
    const previous5Days = glucoseData.filter(reading => 
      reading.timestamp >= now - 10 * 24 * 60 * 60 * 1000 && 
      reading.timestamp < now - 5 * 24 * 60 * 60 * 1000
    );

    if (!last5Days.length) return { normal: 0, elevated: 0, high: 0, low: 0, weeklyTrend: 0, label: "all day" };

    // Filter by time window
    const filterByTimeWindow = (readings: GlucoseReading[]) => {
      if (timeWindow === 'all') return readings;
      return readings.filter(reading => {
        const hour = new Date(reading.timestamp).getHours();
        if (timeWindow === 'waking') return hour >= 6 && hour <= 22;
        if (timeWindow === 'sleeping') return hour < 6 || hour > 22;
        return true;
      });
    };

    const filteredCurrent = filterByTimeWindow(last5Days);
    const filteredPrevious = filterByTimeWindow(previous5Days);

    const calculateTimeInRange = (readings: GlucoseReading[]) => {
      if (!readings.length) return 0;
      const total = readings.length;
      const normal = readings.filter(r => r.value >= 80 && r.value <= 130).length;
      return Math.round((normal / total) * 100);
    };

    const currentInRange = calculateTimeInRange(filteredCurrent);
    const previousInRange = calculateTimeInRange(filteredPrevious);
    const weeklyTrend = previousInRange > 0 ? currentInRange - previousInRange : 0;

    const total = filteredCurrent.length;
    const normal = filteredCurrent.filter(r => r.value >= 80 && r.value <= 130).length;
    const elevated = filteredCurrent.filter(r => r.value > 130 && r.value <= 160).length;
    const high = filteredCurrent.filter(r => r.value > 160).length;
    const low = filteredCurrent.filter(r => r.value < 80).length;

    const labels = {
      all: "all day",
      waking: "waking hours",
      sleeping: "overnight"
    };

    return {
      normal: Math.round((normal / total) * 100),
      elevated: Math.round((elevated / total) * 100),
      high: Math.round((high / total) * 100),
      low: Math.round((low / total) * 100),
      weeklyTrend,
      label: labels[timeWindow]
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

  // Enhanced data processing with 5-day focus
  const processedData = useMemo(() => {
    if (!glucoseData.length) return { chartData: [], weeklyAverage: 0, dailyStats: [], aiSummary: "", contextualInsight: "" };
    
    const last5Days = glucoseData.filter(reading => 
      reading.timestamp >= Date.now() - 5 * 24 * 60 * 60 * 1000
    );

    if (viewMode === 'trend') {
      // Daily readings view - show individual readings, not aggregated
      const last7Days = glucoseData.filter(reading => 
        reading.timestamp >= Date.now() - 7 * 24 * 60 * 60 * 1000
      );

      // Group readings by day to calculate daily stats for tooltips
      const dailyStatsMap = new Map();
      last7Days.forEach(reading => {
        const day = new Date(reading.timestamp).toDateString();
        if (!dailyStatsMap.has(day)) {
          dailyStatsMap.set(day, []);
        }
        dailyStatsMap.get(day).push(reading.value);
      });

      // Add daily stats to each reading for hover information
      const enrichedReadings = last7Days.map(reading => {
        const day = new Date(reading.timestamp).toDateString();
        const dayReadings = dailyStatsMap.get(day) || [];
        const minValue = Math.min(...dayReadings);
        const maxValue = Math.max(...dayReadings);
        const avgValue = Math.round(dayReadings.reduce((sum, val) => sum + val, 0) / dayReadings.length);
        
        return {
          ...reading,
          day: new Date(reading.timestamp).toLocaleDateString('en-US', { weekday: 'short' }),
          time: new Date(reading.timestamp).toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
          }),
          dayMin: minValue,
          dayMax: maxValue,
          dayAverage: avgValue,
          dayReadingCount: dayReadings.length,
          isLatest: reading.timestamp === Math.max(...last7Days.map(r => r.timestamp))
        };
      });

      // Generate contextual insights based on patterns
      let contextualInsight = "";
      const morningReadings = enrichedReadings.filter(reading => {
        const hour = new Date(reading.timestamp).getHours();
        return hour >= 6 && hour <= 9;
      });
      
      const eveningReadings = enrichedReadings.filter(reading => {
        const hour = new Date(reading.timestamp).getHours();
        return hour >= 18 && hour <= 21;
      });

      if (morningReadings.length > 0 && eveningReadings.length > 0) {
        const avgMorning = morningReadings.reduce((sum, r) => sum + r.value, 0) / morningReadings.length;
        const avgEvening = eveningReadings.reduce((sum, r) => sum + r.value, 0) / eveningReadings.length;
        const difference = Math.round(avgEvening - avgMorning);
        
        if (difference > 30) {
          contextualInsight = `Evening levels average ${difference} mg/dL higher than mornings. Consider lighter dinners.`;
        } else if (difference < -10) {
          contextualInsight = `Morning levels tend to be higher than evenings. Check overnight snacking.`;
        } else {
          contextualInsight = `Stable day-to-day pattern. Keep up the consistent routine!`;
        }
      } else if (enrichedReadings.length > 0) {
        const highReadings = enrichedReadings.filter(r => r.value > 160).length;
        const totalReadings = enrichedReadings.length;
        const highPercentage = Math.round((highReadings / totalReadings) * 100);
        
        if (highPercentage > 20) {
          contextualInsight = `${highPercentage}% of readings are elevated. Try walking after meals.`;
        } else {
          contextualInsight = "Good glucose control overall. Keep logging consistently.";
        }
      }

      return { 
        chartData: enrichedReadings, 
        weeklyAverage: 0, 
        dailyStats: [], 
        aiSummary: "", 
        contextualInsight 
      };
    }

    if (viewMode === 'dailyChange') {
      // Show daily averages and changes
      const last7Days = glucoseData.filter(reading => 
        reading.timestamp >= Date.now() - 7 * 24 * 60 * 60 * 1000
      );

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
          day: new Date(day).toLocaleDateString('en-US', { weekday: 'short' }),
          timestamp: new Date(day).getTime(),
          average: Math.round(avg * 10) / 10,
          readingCount: values.length
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

        {/* Time in Range with Interactive Window Toggle */}
        {viewMode === 'trend' && (
          <div className="flex flex-col items-center mb-2 space-y-2">
            <button
              onClick={() => {
                const windows: TimeWindow[] = ['all', 'waking', 'sleeping'];
                const currentIndex = windows.indexOf(timeWindow);
                const nextIndex = (currentIndex + 1) % windows.length;
                setTimeWindow(windows[nextIndex]);
              }}
              className="group"
            >
              <Badge className="bg-green-100 text-green-800 border-green-200 cursor-pointer hover:bg-green-200 transition-colors">
                {timeInRangeData.normal}% in range during {timeInRangeData.label}
              </Badge>
              <div className="text-xs text-muted-foreground mt-1 opacity-70 group-hover:opacity-100">
                Tap to toggle time window
              </div>
            </button>
            {timeInRangeData.weeklyTrend !== 0 && (
              <div className="text-xs text-muted-foreground flex items-center gap-1">
                {timeInRangeData.weeklyTrend > 0 ? (
                  <>
                    <TrendingUp className="w-3 h-3 text-green-600" />
                    <span className="text-green-600">↑ {Math.abs(timeInRangeData.weeklyTrend)}% from last period</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="w-3 h-3 text-red-600" />
                    <span className="text-red-600">↓ {Math.abs(timeInRangeData.weeklyTrend)}% from last period</span>
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
                  <Tooltip content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const point = payload[0].payload;
                      return (
                        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
                          <p className="font-medium text-gray-900">{point.day}</p>
                          <p className="text-sm text-gray-600">Average: {point.average} mg/dL</p>
                          <p className="text-sm text-gray-600">{point.readingCount} readings</p>
                          {point.change !== 0 && (
                            <p className={`text-sm ${point.isImprovement ? 'text-green-600' : 'text-red-600'}`}>
                              {point.change > 0 ? '+' : ''}{Math.round(point.change * 10) / 10} mg/dL from yesterday
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }} />
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
                <LineChart data={processedData.chartData} margin={{ top: 20, right: 15, left: 15, bottom: 35 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200/40" />
                  <XAxis 
                    dataKey="timestamp"
                    type="number"
                    scale="time"
                    domain={['dataMin', 'dataMax']}
                    tickFormatter={(value) => {
                      const date = new Date(value);
                      return date.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric' 
                      });
                    }}
                    tick={{ fontSize: 10, fill: "#6B7280" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis 
                    domain={[60, 220]}
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                    axisLine={false}
                    tickLine={false}
                    width={35}
                  />
                  
                  {/* Glucose zones */}
                  <ReferenceArea y1={60} y2={80} fill="#f97316" fillOpacity={0.06} />
                  <ReferenceArea y1={80} y2={130} fill="#22c55e" fillOpacity={0.08} />
                  <ReferenceArea y1={130} y2={160} fill="#f59e0b" fillOpacity={0.06} />
                  <ReferenceArea y1={160} y2={220} fill="#ef4444" fillOpacity={0.06} />

                  {/* Zone boundary lines */}
                  <ReferenceLine y={80} stroke="#f97316" strokeWidth={1} strokeDasharray="4 4" opacity={0.4} />
                  <ReferenceLine y={130} stroke="#f59e0b" strokeWidth={1} strokeDasharray="4 4" opacity={0.4} />
                  <ReferenceLine y={160} stroke="#ef4444" strokeWidth={1} strokeDasharray="4 4" opacity={0.4} />
                  
                  <Tooltip content={({ active, payload }: any) => {
                    if (active && payload && payload.length) {
                      const point = payload[0].payload;
                      return (
                        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg max-w-xs">
                          <div className="space-y-1">
                            <p className="font-semibold text-gray-900">{point.value} mg/dL</p>
                            <p className="text-sm text-gray-600">{point.day} at {point.time}</p>
                            <div className="border-t pt-2 mt-2">
                              <p className="text-xs text-gray-500 font-medium">Daily Range:</p>
                              <p className="text-sm text-gray-700">
                                {point.dayMin} - {point.dayMax} mg/dL
                              </p>
                              <p className="text-xs text-gray-500">
                                Avg: {point.dayAverage} mg/dL ({point.dayReadingCount} readings)
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }} />
                  
                  {/* Main glucose line */}
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    dot={(props: any) => {
                      const { payload, cx, cy } = props;
                      if (!payload) return null;
                      
                      const getColor = (value: number) => {
                        if (value < 80) return "#f97316";
                        if (value > 160) return "#ef4444";
                        if (value > 130) return "#f59e0b";
                        return "#22c55e";
                      };
                      
                      const isLatest = payload.isLatest;
                      
                      return (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isLatest ? 5 : 3}
                          fill={getColor(payload.value)}
                          stroke="white"
                          strokeWidth={isLatest ? 2 : 1}
                        />
                      );
                    }}
                    activeDot={{ 
                      r: 6, 
                      fill: "hsl(var(--primary))", 
                      stroke: "white", 
                      strokeWidth: 2 
                    }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Contextual Insight for Trend View */}
        {viewMode === 'trend' && processedData.contextualInsight && (
          <div className="mt-3 p-3 bg-blue-50/70 rounded-lg border border-blue-200/50">
            <div className="flex items-start gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500 flex-shrink-0 flex items-center justify-center mt-0.5">
                <span className="text-white text-xs font-bold">💡</span>
              </div>
              <p className="text-sm text-blue-800 leading-relaxed">{processedData.contextualInsight}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PreDiabeticGlucoseChart;