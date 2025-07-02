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

    // Calculate x-axis ticks - show dates every day or two
    const ticks: number[] = [];
    const seenDates: { [key: string]: boolean } = {};
    
    dataWithLatestFlag.forEach(d => {
      const date = new Date(d.timestamp);
      const dateKey = date.toDateString();
      if (!seenDates[dateKey]) {
        ticks.push(d.timestamp);
        seenDates[dateKey] = true;
      }
    });

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
      const hour = date.getHours();
      const zone = getGlucoseZone(point.value);
      const color = getGlucoseColor(point.value);
      
      // Add lifestyle context based on time
      let lifestyleNote = "";
      if (hour >= 7 && hour <= 9) {
        lifestyleNote = "Morning reading";
      } else if (hour >= 12 && hour <= 14) {
        lifestyleNote = "Lunch period";
      } else if (hour >= 18 && hour <= 20) {
        lifestyleNote = "Dinner period";
      } else if (hour >= 22 || hour <= 6) {
        lifestyleNote = "Sleep hours";
      }

      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-3 shadow-xl max-w-xs">
          <div className="flex items-center gap-2 mb-2">
            <div 
              className="w-3 h-3 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: color }}
            />
            <p className="font-bold text-gray-900 text-base">{`${point.value} mg/dL`}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-gray-600">{date.toLocaleString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            })}</p>
            <div className="flex items-center justify-between">
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                zone === 'Normal' ? 'bg-green-100 text-green-700' :
                zone === 'Elevated' ? 'bg-yellow-100 text-yellow-700' :
                zone === 'High' ? 'bg-red-100 text-red-700' :
                'bg-orange-100 text-orange-700'
              }`}>
                {zone}
              </span>
              {point.source && (
                <span className="text-xs text-gray-500 capitalize">{point.source}</span>
              )}
            </div>
            {lifestyleNote && (
              <p className="text-xs text-blue-600 font-medium">{lifestyleNote}</p>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomXAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const date = new Date(payload.value);
    const hour = date.getHours();
    
    // Show time labels for better context
    let label;
    if (hour === 0) {
      label = '12 AM';
    } else if (hour < 12) {
      label = `${hour} AM`;
    } else if (hour === 12) {
      label = '12 PM';
    } else {
      label = `${hour - 12} PM`;
    }
    
    // For longer time periods, show date
    const timeRangeDays = parseInt(timeRange);
    if (timeRangeDays > 3) {
      label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={16} textAnchor="middle" fill="#6B7280" fontSize={10} fontWeight={500} className="sm:text-xs">
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
    if (value < 80) return "#F97316"; // Orange for low
    if (value > 160) return "#EF4444"; // Red for high
    if (value > 130) return "#F59E0B"; // Amber for elevated
    return "#22C55E"; // Green for normal
  };

  const getGlucoseZone = (value: number) => {
    if (value < 80) return 'Low';
    if (value > 160) return 'High';
    if (value > 130) return 'Elevated';
    return 'Normal';
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
    <div className={cn("h-full w-full relative bg-gradient-to-br from-blue-50/30 to-indigo-50/30 rounded-xl", containerClassName)}>
      {/* Chart Content */}
      <div className="h-full w-full p-4">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={dataWithLatestFlag} 
              margin={{ top: 10, right: 10, left: 25, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="none" className="stroke-gray-200/30" />
              
              {/* Hide X-axis on dashboard view */}
              <XAxis 
                dataKey="timestamp" 
                type="number"
                domain={['dataMin', 'dataMax']}
                hide={true}
              />
              
              <YAxis 
                orientation="left"
                domain={yAxisDomain}
                ticks={[80, 130, 160]}
                tick={{ fontSize: 9, fill: "#9CA3AF", fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                width={25}
                tickFormatter={(value) => `${value}`}
              />
              
              {/* Simplified glucose zones with subtle colors */}
              <ReferenceArea y1={60} y2={80} fill="#F97316" fillOpacity={0.06} />
              <ReferenceArea y1={80} y2={130} fill="#22C55E" fillOpacity={0.06} />
              <ReferenceArea y1={130} y2={160} fill="#F59E0B" fillOpacity={0.06} />
              <ReferenceArea y1={160} y2={200} fill="#EF4444" fillOpacity={0.06} />

              {/* Minimal zone boundary lines */}
              <ReferenceLine y={80} stroke="#F97316" strokeWidth={0.5} opacity={0.4} />
              <ReferenceLine y={130} stroke="#F59E0B" strokeWidth={0.5} opacity={0.4} />
              <ReferenceLine y={160} stroke="#EF4444" strokeWidth={0.5} opacity={0.4} />
              
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#9CA3AF', strokeWidth: 1, strokeDasharray: '2 2', opacity: 0.7 }}/>
              
              {/* Main glucose line with smooth curve */}
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#3B82F6"
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  if (!payload) return null;
                  
                  const color = getGlucoseColor(payload.value);
                  
                  return (
                    <circle 
                      cx={cx} 
                      cy={cy} 
                      r={3} 
                      fill={color}
                      stroke="white"
                      strokeWidth={2}
                      className="drop-shadow-sm cursor-pointer"
                    />
                  );
                }}
                activeDot={{ 
                  r: 5, 
                  fill: "#3B82F6", 
                  stroke: "white", 
                  strokeWidth: 2,
                  className: "drop-shadow-md"
                }}
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
                    const color = getGlucoseColor(payload.value);
                    return (
                      <g key={`latest-${index}`}>
                        <circle 
                          cx={cx} 
                          cy={cy} 
                          r={8} 
                          fill={color}
                          fillOpacity={0.2}
                          className="animate-pulse"
                        />
                        <circle 
                          cx={cx} 
                          cy={cy} 
                          r={6} 
                          fill="white" 
                          stroke={color} 
                          strokeWidth={3}
                          className="drop-shadow-lg"
                        />
                        <circle 
                          cx={cx} 
                          cy={cy} 
                          r={3} 
                          fill={color}
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
