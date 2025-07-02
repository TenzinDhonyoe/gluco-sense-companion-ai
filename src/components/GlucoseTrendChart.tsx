import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, ReferenceArea, Label, Tooltip, ReferenceDot } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { downsampleLTTB, movingAverage } from "@/lib/chartUtils";
import { useMemo, useState, useEffect, useCallback } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

export interface GlucoseReading {
  time: string;
  value: number;
  timestamp: number;
  trendIndex: number;
  source?: string;
}

interface GlucoseTrendChartProps {
  data?: GlucoseReading[];
  trendDirection?: 'up' | 'down' | 'flat';
  containerClassName?: string;
  showTimeRangeFilter?: boolean;
  defaultTimeRange?: string;
  onDataUpdate?: (data: GlucoseReading[]) => void;
}

const GlucoseTrendChart = ({ 
  data: propData, 
  containerClassName, 
  showTimeRangeFilter = true,
  defaultTimeRange = '7',
  onDataUpdate
}: GlucoseTrendChartProps) => {
  const [timeRange, setTimeRange] = useState(defaultTimeRange);
  const [glucoseData, setGlucoseData] = useState<GlucoseReading[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGlucoseReadings = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user found');
        setLoading(false);
        return;
      }

      console.log('Fetching glucose readings from glucose_readings table...');
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

      console.log('Transformed glucose data from database:', transformedData.length, 'readings');
      if (transformedData.length > 0) {
        console.log('Latest reading timestamp:', new Date(transformedData[transformedData.length - 1].timestamp));
        console.log('Latest reading value:', transformedData[transformedData.length - 1].value);
      }
      
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
      console.log('Using provided prop data:', propData.length, 'readings');
      setGlucoseData(propData);
      setLoading(false);
    } else {
      fetchGlucoseReadings();
    }
  }, [propData, fetchGlucoseReadings]);

  useEffect(() => {
    console.log('Setting up real-time subscription for glucose_readings table...');
    
    const channel = supabase
      .channel('glucose-readings-changes', {
        config: {
          broadcast: { self: true },
          presence: { key: 'glucose-chart' }
        }
      })
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'glucose_readings'
        },
        (payload) => {
          console.log('Real-time glucose reading change detected:', payload.eventType, payload);
          setTimeout(() => {
            fetchGlucoseReadings();
          }, 100);
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status for glucose_readings:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to glucose_readings changes');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('Subscription issue, retrying...', status);
          setTimeout(() => {
            channel.unsubscribe();
          }, 2000);
        }
      });

    const intervalId = setInterval(() => {
      console.log('Periodic refresh of glucose data');
      fetchGlucoseReadings();
    }, 30000);

    const handleGlucoseReadingChanged = () => {
      console.log('Custom glucose reading changed event received - refreshing data');
      fetchGlucoseReadings();
    };

    window.addEventListener('glucoseReadingChanged', handleGlucoseReadingChanged);

    return () => {
      console.log('Cleaning up glucose readings subscription and event listeners');
      clearInterval(intervalId);
      supabase.removeChannel(channel);
      window.removeEventListener('glucoseReadingChanged', handleGlucoseReadingChanged);
    };
  }, [fetchGlucoseReadings]);

  const processedData = useMemo(() => {
    if (!glucoseData || glucoseData.length === 0) {
      return { 
        finalData: [], 
        dataWithLatestFlag: [],
        xTicks: []
      };
    }
    
    const now = Date.now();
    const days = parseInt(timeRange);
    const fromTimestamp = now - days * 24 * 60 * 60 * 1000;
    const filteredData = glucoseData.filter(d => d.timestamp >= fromTimestamp);

    if (filteredData.length < 2) {
      return { 
        finalData: [], 
        dataWithLatestFlag: [],
        xTicks: []
      };
    }

    const MAX_VISIBLE_POINTS = 50;
    const points = filteredData.map(d => ({ ...d, x: d.timestamp, y: d.value }));
    const decimatedData = points.length > MAX_VISIBLE_POINTS
      ? downsampleLTTB(points, MAX_VISIBLE_POINTS)
      : points;

    // Use cubic spline-like smoothing for better visual appeal
    const finalData = movingAverage(decimatedData, 3);

    const dataWithLatestFlag = finalData.map((item, index) => ({
      ...item,
      isLatest: index === finalData.length - 1,
    }));

    // Calculate x-axis ticks - show time labels at key hours
    const ticks: number[] = [];
    const currentTime = Date.now();
    const timeRangeDays = parseInt(timeRange);
    
    // For shorter time ranges, show hourly markers
    if (timeRangeDays <= 1) {
      // Show every 4 hours for daily view
      const hourlyTicks = [8, 12, 16, 20]; // 8 AM, 12 PM, 4 PM, 8 PM
      hourlyTicks.forEach(hour => {
        const today = new Date();
        today.setHours(hour, 0, 0, 0);
        if (today.getTime() >= currentTime - timeRangeDays * 24 * 60 * 60 * 1000) {
          ticks.push(today.getTime());
        }
      });
    } else {
      // For longer ranges, show daily markers
      dataWithLatestFlag.forEach(d => {
        const date = new Date(d.timestamp);
        const dateKey = date.toDateString();
        if (ticks.length === 0 || Math.abs(ticks[ticks.length - 1] - d.timestamp) > 24 * 60 * 60 * 1000) {
          ticks.push(d.timestamp);
        }
      });
    }

    return { 
      finalData: dataWithLatestFlag, 
      dataWithLatestFlag: dataWithLatestFlag,
      xTicks: ticks
    };
  }, [glucoseData, timeRange]);

  const chartConfig = {
    value: {
      label: "Your Glucose (mg/dL)",
      color: "#3B82F6", // Soft blue instead of harsh colors
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      const date = new Date(point.timestamp);
      const formattedTime = date.toLocaleString('en-US', {
        weekday: 'short',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
      
      // Glucose zone indicator
      let zoneInfo = "";
      let zoneColor = "";
      if (point.value < 80) {
        zoneInfo = "Low";
        zoneColor = "text-orange-600";
      } else if (point.value < 130) {
        zoneInfo = "Normal";
        zoneColor = "text-green-600";
      } else if (point.value < 160) {
        zoneInfo = "Elevated";
        zoneColor = "text-yellow-600";
      } else {
        zoneInfo = "High";
        zoneColor = "text-red-600";
      }

      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-3 shadow-xl max-w-xs">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-bold text-gray-900 text-lg">{`${point.value} mg/dL`}</p>
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${zoneColor} bg-current/10`}>
              {zoneInfo}
            </span>
          </div>
          <p className="text-sm text-gray-600 font-medium">{formattedTime}</p>
          {point.source && (
            <p className="text-xs text-gray-500 capitalize mt-1">Source: {point.source}</p>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomXAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const date = new Date(payload.value);
    const hour = date.getHours();
    const timeRangeDays = parseInt(timeRange);
    
    // Show time labels for daily view, date labels for longer ranges
    let label = "";
    if (timeRangeDays <= 1) {
      if (hour === 8) label = "8 AM";
      else if (hour === 12) label = "12 PM";
      else if (hour === 16) label = "4 PM";
      else if (hour === 20) label = "8 PM";
      else label = `${hour > 12 ? hour - 12 : hour || 12}${hour >= 12 ? 'PM' : 'AM'}`;
    } else {
      label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={16} textAnchor="middle" fill="#6B7280" fontSize={11} fontWeight={500}>
          {label}
        </text>
      </g>
    );
  };

  const handleTimeRangeChange = (value: string | undefined) => {
    if (value) {
      setTimeRange(value);
    }
  };

  const getGlucoseColor = (value: number) => {
    if (value < 80) return "#F97316"; // Orange/red for low
    if (value > 160) return "#EF4444"; // Red for high
    if (value > 130) return "#F59E0B"; // Yellow for elevated
    return "#22C55E"; // Green for normal
  };

  if (loading) {
    return (
      <div className={cn("h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl", containerClassName)}>
        <div className="text-center px-4">
          <div className="text-gray-400 text-base sm:text-lg font-medium">Loading...</div>
          <div className="text-gray-300 text-xs sm:text-sm mt-1">Fetching glucose data from database</div>
        </div>
      </div>
    );
  }

  const { dataWithLatestFlag, xTicks } = processedData;

  if (dataWithLatestFlag.length < 2) {
    return (
      <div className={cn("h-full w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl", containerClassName)}>
        <div className="text-center px-4">
          <div className="text-gray-400 text-base sm:text-lg font-medium">Not enough data yet</div>
          <div className="text-gray-300 text-xs sm:text-sm mt-1">Need at least 2 readings to show trend</div>
        </div>
      </div>
    );
  }

  const yAxisDomain = [60, 200];
  const yTicks = [70, 100, 130, 160, 190];
  
    return (
      <div className={cn("h-full w-full relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-sm border border-blue-100", containerClassName)}>
        {/* Chart Content */}
        <div className="h-full w-full p-4">
          <ChartContainer config={chartConfig} className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={dataWithLatestFlag} 
                margin={{ top: 10, right: 15, left: 15, bottom: 40 }}
              >
              <CartesianGrid strokeDasharray="none" className="stroke-gray-200/30" horizontal={true} vertical={false} />
              
              <XAxis 
                dataKey="timestamp" 
                type="number"
                domain={['dataMin', 'dataMax']}
                ticks={xTicks}
                tick={<CustomXAxisTick />}
                axisLine={{ stroke: '#E5E7EB', strokeWidth: 1 }}
                tickLine={{ stroke: '#E5E7EB', strokeWidth: 1 }}
                padding={{ left: 10, right: 10 }}
                height={50}
              />
              
              <YAxis 
                orientation="left"
                domain={yAxisDomain}
                ticks={yTicks}
                tick={{ fontSize: 10, fill: "#6B7280", fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                width={30}
                tickFormatter={(value) => `${value}`}
              >
                <Label
                  value="mg/dL"
                  angle={-90}
                  position="insideLeft"
                  style={{ textAnchor: 'middle', fill: '#6B7280', fontSize: 10, fontWeight: 600 }}
                  offset={-2}
                />
              </YAxis>
              
              {/* Stronger background zones with better color coding */}
              <ReferenceArea y1={60} y2={80} fill="#EF4444" fillOpacity={0.15} />
              <ReferenceArea y1={80} y2={130} fill="#22C55E" fillOpacity={0.15} />
              <ReferenceArea y1={130} y2={160} fill="#F59E0B" fillOpacity={0.15} />
              <ReferenceArea y1={160} y2={200} fill="#EF4444" fillOpacity={0.15} />

              {/* Clear zone boundary lines */}
              <ReferenceLine y={80} stroke="#F97316" strokeWidth={1.5} opacity={0.8} />
              <ReferenceLine y={130} stroke="#F59E0B" strokeWidth={1.5} opacity={0.8} />
              <ReferenceLine y={160} stroke="#EF4444" strokeWidth={1.5} opacity={0.8} />
              
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#9CA3AF', strokeWidth: 1, strokeDasharray: '2 2', opacity: 0.7 }}/>
              
              {/* Enhanced glucose line with smooth curves */}
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#3B82F6"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  if (!payload) return null;
                  
                  const color = getGlucoseColor(payload.value);
                  const size = 5;
                  
                  return (
                    <circle 
                      cx={cx} 
                      cy={cy} 
                      r={size} 
                      fill="white"
                      stroke={color}
                      strokeWidth={2}
                      className="cursor-pointer hover:r-6 transition-all duration-200"
                    />
                  );
                }}
                activeDot={{ r: 7, fill: "#3B82F6", stroke: "white", strokeWidth: 3 }}
              />
              
              {/* Latest reading highlight */}
              <Line 
                type="monotone" 
                dataKey="value"
                stroke="transparent"
                strokeWidth={0}
                activeDot={false}
                dot={(props) => {
                  const { cx, cy, payload, index } = props;
                  if (payload?.isLatest) {
                    return (
                      <g key={`latest-${index}`}>
                        <circle 
                          cx={cx} 
                          cy={cy} 
                          r={6} 
                          fill="white" 
                          stroke="#3B82F6" 
                          strokeWidth={2}
                        />
                        <circle 
                          cx={cx} 
                          cy={cy} 
                          r={3} 
                          fill="#3B82F6" 
                        />
                      </g>
                    );
                  }
                  return null;
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Time Range Filter - Positioned at bottom right */}
      {showTimeRangeFilter && (
        <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2">
          <ToggleGroup 
            type="single" 
            value={timeRange}
            onValueChange={handleTimeRangeChange}
            size="sm" 
            className="bg-white/90 backdrop-blur-sm rounded-lg p-1 shadow-sm border border-gray-200/50"
          >
            <ToggleGroupItem value="3" className="text-xs px-1.5 py-1 sm:px-2">3D</ToggleGroupItem>
            <ToggleGroupItem value="7" className="text-xs px-1.5 py-1 sm:px-2">7D</ToggleGroupItem>
            <ToggleGroupItem value="14" className="text-xs px-1.5 py-1 sm:px-2">14D</ToggleGroupItem>
            <ToggleGroupItem value="30" className="text-xs px-1.5 py-1 sm:px-2">30D</ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}
    </div>
  );
};

export default GlucoseTrendChart;
