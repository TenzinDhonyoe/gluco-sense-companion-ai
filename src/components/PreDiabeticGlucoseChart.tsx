import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, ReferenceArea, Tooltip, BarChart, Bar } from "recharts";
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
import { TrendingUp, TrendingDown, Utensils, Activity, Moon, Calendar } from "lucide-react";

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

type ViewMode = 'trend' | 'timeInRange' | 'dailyChange' | 'byMeal';

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

  // Calculate time in range for last 7 days
  const timeInRangeData = useMemo(() => {
    if (!glucoseData.length) return { normal: 0, elevated: 0, high: 0, low: 0 };
    
    const last7Days = glucoseData.filter(reading => 
      reading.timestamp >= Date.now() - 7 * 24 * 60 * 60 * 1000
    );

    if (!last7Days.length) return { normal: 0, elevated: 0, high: 0, low: 0 };

    const total = last7Days.length;
    const normal = last7Days.filter(r => r.value >= 80 && r.value <= 130).length;
    const elevated = last7Days.filter(r => r.value > 130 && r.value <= 160).length;
    const high = last7Days.filter(r => r.value > 160).length;
    const low = last7Days.filter(r => r.value < 80).length;

    return {
      normal: Math.round((normal / total) * 100),
      elevated: Math.round((elevated / total) * 100),
      high: Math.round((high / total) * 100),
      low: Math.round((low / total) * 100)
    };
  }, [glucoseData]);

  // Process data for different chart modes
  const processedData = useMemo(() => {
    if (!glucoseData.length) return [];
    
    const last7Days = glucoseData.filter(reading => 
      reading.timestamp >= Date.now() - 7 * 24 * 60 * 60 * 1000
    );

    if (viewMode === 'trend') {
      // Smooth the data using moving average
      const points = last7Days.map(d => ({ ...d, x: d.timestamp, y: d.value }));
      return movingAverage(points, 3);
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

      return dailyData.map((item, index) => ({
        ...item,
        change: index > 0 ? item.average - dailyData[index - 1].average : 0,
        isImprovement: index > 0 ? item.average < dailyData[index - 1].average : false
      }));
    }

    return last7Days;
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
    <div className={cn("w-full bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl px-6 py-6 space-y-6", containerClassName)}>
      {/* Time in Range Progress Bar */}
      <div className="space-y-3">
        <div className="text-center">
          <h3 className="text-base font-semibold text-gray-900">Time in Range</h3>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {timeInRangeData.normal}% in target
          </p>
          <p className="text-sm text-muted-foreground">Last 7 days</p>
        </div>
        
        <div className="relative">
          <div className="flex rounded-full overflow-hidden h-4 bg-gray-100 shadow-inner">
            <div 
              className="bg-orange-300/60 transition-all duration-500" 
              style={{ width: `${timeInRangeData.low}%` }}
            />
            <div 
              className="bg-green-400 transition-all duration-500" 
              style={{ width: `${timeInRangeData.normal}%` }}
            />
            <div 
              className="bg-yellow-400/80 transition-all duration-500" 
              style={{ width: `${timeInRangeData.elevated}%` }}
            />
            <div 
              className="bg-red-300/60 transition-all duration-500" 
              style={{ width: `${timeInRangeData.high}%` }}
            />
          </div>
          
          {/* Inline segment labels */}
          <div className="flex justify-center gap-4 mt-3">
            {timeInRangeData.low > 0 && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-orange-300/60"></div>
                <span className="text-xs text-gray-600">{timeInRangeData.low}%</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span className="text-xs font-medium text-gray-700">{timeInRangeData.normal}%</span>
            </div>
            {timeInRangeData.elevated > 0 && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-yellow-400/80"></div>
                <span className="text-xs text-gray-600">{timeInRangeData.elevated}%</span>
              </div>
            )}
            {timeInRangeData.high > 0 && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-red-300/60"></div>
                <span className="text-xs text-gray-600">{timeInRangeData.high}%</span>
              </div>
            )}
          </div>
        </div>

        {/* Encouraging caption */}
        <div className="text-center">
          {timeInRangeData.normal >= 70 ? (
            <p className="text-sm text-green-600 font-medium">✅ Excellent glucose control this week!</p>
          ) : timeInRangeData.normal >= 50 ? (
            <p className="text-sm text-blue-600 font-medium">📈 You're making great progress!</p>
          ) : (
            <p className="text-sm text-gray-600 font-medium">🎯 Keep tracking for better insights</p>
          )}
        </div>
      </div>


      {/* Graph Section */}
      <div className="space-y-4">
        {/* View Mode Pills */}
        <div className="flex justify-center">
          <div className="bg-muted rounded-full p-1 inline-flex">
            <button
              onClick={() => setViewMode('trend')}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                viewMode === 'trend' 
                  ? "bg-white text-gray-900 shadow-sm" 
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              Trend
            </button>
            <button
              onClick={() => setViewMode('dailyChange')}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                viewMode === 'dailyChange' 
                  ? "bg-white text-gray-900 shadow-sm" 
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              Daily Change
            </button>
            <button
              onClick={() => setViewMode('timeInRange')}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                viewMode === 'timeInRange' 
                  ? "bg-white text-gray-900 shadow-sm" 
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              Weekly View
            </button>
          </div>
        </div>

        {/* Enhanced Chart */}
        <div className="h-[200px] w-full">
          <ChartContainer 
            config={{ 
              glucose: { label: "Glucose (mg/dL)", color: "#3B82F6" },
              change: { label: "Daily Change", color: "#10B981" }
            }} 
            className="h-full w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              {viewMode === 'dailyChange' ? (
                <BarChart data={processedData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
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
                <LineChart data={processedData} margin={{ top: 10, right: 10, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="2 4" className="stroke-gray-200/60" />
                  <XAxis 
                    dataKey="timestamp" 
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis 
                    domain={[60, 200]}
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                    axisLine={false}
                    tickLine={false}
                    width={35}
                  />
                  
                  {/* Glucose zones with softer colors */}
                  <ReferenceArea y1={60} y2={80} fill="#f97316" fillOpacity={0.06} />
                  <ReferenceArea y1={80} y2={130} fill="#22c55e" fillOpacity={0.06} />
                  <ReferenceArea y1={130} y2={160} fill="#f59e0b" fillOpacity={0.06} />
                  <ReferenceArea y1={160} y2={200} fill="#ef4444" fillOpacity={0.06} />

                  <ReferenceLine y={80} stroke="#f97316" strokeWidth={1} strokeDasharray="4 4" opacity={0.4} />
                  <ReferenceLine y={130} stroke="#f59e0b" strokeWidth={1} strokeDasharray="4 4" opacity={0.4} />
                  <ReferenceLine y={160} stroke="#ef4444" strokeWidth={1} strokeDasharray="4 4" opacity={0.4} />
                  
                  <Tooltip content={<CustomTooltip />} />
                  
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3B82F6"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    dot={{ r: 5, fill: "#3B82F6", stroke: "white", strokeWidth: 2 }}
                    activeDot={{ 
                      r: 7, 
                      fill: "#3B82F6", 
                      stroke: "white", 
                      strokeWidth: 3,
                      className: "animate-pulse"
                    }}
                  />
                </LineChart>
              )}
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
};

export default PreDiabeticGlucoseChart;