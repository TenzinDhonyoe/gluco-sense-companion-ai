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
      
      // Add lifestyle context based on time
      let lifestyleNote = "";
      if (hour >= 7 && hour <= 9) {
        lifestyleNote = "Morning time";
      } else if (hour >= 12 && hour <= 14) {
        lifestyleNote = "Lunch time";
      } else if (hour >= 18 && hour <= 20) {
        lifestyleNote = "Dinner time";
      } else if (hour >= 22 || hour <= 6) {
        lifestyleNote = "Sleep time";
      }

      return (
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-2 sm:p-3 shadow-xl max-w-xs">
          <p className="font-semibold text-gray-900 mb-1 text-sm sm:text-base">{`${point.value} mg/dL`}</p>
          <p className="text-xs sm:text-sm text-gray-600">{date.toLocaleString()}</p>
          {lifestyleNote && (
            <p className="text-xs text-blue-600 font-medium mt-1">{lifestyleNote}</p>
          )}
          {point.source && (
            <p className="text-xs text-gray-500 capitalize">{point.source}</p>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomXAxisTick = (props: any) => {
    const { x, y, payload } = props;
    const date = new Date(payload.value);
    const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
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
    if (value < 70) return "#F97316"; // Orange for low (more accessible than red)
    if (value > 160) return "#EF4444"; // Red for high
    if (value > 140) return "#F59E0B"; // Amber for elevated
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
    <div className={cn("h-full w-full relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl", containerClassName)}>
      {/* Chart Content */}
      <div className="h-full w-full p-1 sm:p-2">
        <ChartContainer config={chartConfig} className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={dataWithLatestFlag} 
              margin={{ top: 5, right: 5, left: 5, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="2 4" className="stroke-gray-200/60" />
              
              <XAxis 
                dataKey="timestamp" 
                type="number"
                domain={['dataMin', 'dataMax']}
                ticks={xTicks}
                tick={<CustomXAxisTick />}
                axisLine={false}
                tickLine={false}
                padding={{ left: 5, right: 5 }}
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
              />
              
              {/* Soft, accessible glucose zones */}
              <ReferenceArea y1={60} y2={70} fill="#F97316" fillOpacity={0.08} />
              <ReferenceArea y1={70} y2={140} fill="#22C55E" fillOpacity={0.08} />
              <ReferenceArea y1={140} y2={160} fill="#F59E0B" fillOpacity={0.08} />
              <ReferenceArea y1={160} y2={200} fill="#EF4444" fillOpacity={0.08} />

              {/* Softer reference lines */}
              <ReferenceLine y={70} stroke="#F97316" strokeWidth={1} strokeDasharray="4 4" opacity={0.6} />
              <ReferenceLine y={140} stroke="#F59E0B" strokeWidth={1} strokeDasharray="4 4" opacity={0.6} />
              <ReferenceLine y={160} stroke="#EF4444" strokeWidth={1} strokeDasharray="4 4" opacity={0.6} />
              
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#9CA3AF', strokeWidth: 1, strokeDasharray: '2 2', opacity: 0.7 }}/>
              
              {/* Main glucose line with rounded joins */}
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#3B82F6"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  if (!payload) return null;
                  
                  const color = getGlucoseColor(payload.value);
                  const size = payload.source === 'sensor' ? 3 : 4;
                  
                  return (
                    <circle 
                      cx={cx} 
                      cy={cy} 
                      r={size} 
                      fill={color}
                      stroke="white"
                      strokeWidth={1}
                    />
                  );
                }}
                activeDot={{ r: 5, fill: "#3B82F6", stroke: "white", strokeWidth: 2 }}
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
