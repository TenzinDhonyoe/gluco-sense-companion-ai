
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, ReferenceArea, Label, Tooltip } from "recharts";
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
  defaultTimeRange = '3',
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

      // Transform the data to match GlucoseReading interface, ensuring timestamp correlation
      const transformedData: GlucoseReading[] = (data || [])
        .reverse() // Reverse to get chronological order for the chart
        .map((reading, index) => {
          const timestamp = new Date(reading.timestamp).getTime();
          return {
            time: new Date(timestamp).toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit', 
              hour12: true 
            }),
            value: Number(reading.value),
            timestamp: timestamp, // Ensure we're using the exact database timestamp
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
      
      // Notify parent component of data update
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
    // If prop data is provided, use it; otherwise fetch from database
    if (propData && propData.length > 0) {
      console.log('Using provided prop data:', propData.length, 'readings');
      setGlucoseData(propData);
      setLoading(false);
    } else {
      fetchGlucoseReadings();
    }
  }, [propData, fetchGlucoseReadings]);

  useEffect(() => {
    // Set up real-time subscription with better error handling
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
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'glucose_readings'
        },
        (payload) => {
          console.log('Real-time glucose reading change detected:', payload.eventType, payload);
          // Force immediate refresh when any change occurs
          setTimeout(() => {
            fetchGlucoseReadings();
          }, 100); // Small delay to ensure database consistency
        }
      )
      .subscribe((status) => {
        console.log('Real-time subscription status for glucose_readings:', status);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to glucose_readings changes');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.warn('Subscription issue, retrying...', status);
          // Retry subscription after a delay
          setTimeout(() => {
            channel.unsubscribe();
            // The useEffect will re-run and create a new subscription
          }, 2000);
        }
      });

    // Set up periodic refresh as fallback for real-time updates
    const intervalId = setInterval(() => {
      console.log('Periodic refresh of glucose data');
      fetchGlucoseReadings();
    }, 30000); // Refresh every 30 seconds as backup

    // Also listen for custom events from manual entry forms and clear data button
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

  // Process data with useMemo to avoid unnecessary recalculations
  const processedData = useMemo(() => {
    if (!glucoseData || glucoseData.length === 0) {
      return { 
        finalData: [], 
        dataWithLatestFlag: [],
        xTicks: []
      };
    }
    
    const now = Date.now();
    const hours = parseInt(timeRange);
    const fromTimestamp = now - hours * 60 * 60 * 1000;
    const filteredData = glucoseData.filter(d => d.timestamp >= fromTimestamp);

    if (filteredData.length < 2) {
      return { 
        finalData: [], 
        dataWithLatestFlag: [],
        xTicks: []
      };
    }

    // DATA PIPELINE
    const MAX_VISIBLE_POINTS = 48;
    
    const points = filteredData.map(d => ({ ...d, x: d.timestamp, y: d.value }));

    const decimatedData = points.length > MAX_VISIBLE_POINTS
      ? downsampleLTTB(points, MAX_VISIBLE_POINTS)
      : points;

    const finalData = movingAverage(decimatedData, 3);

    const dataWithLatestFlag = finalData.map((item, index) => ({
      ...item,
      isLatest: index === finalData.length - 1,
    }));

    // Calculate x-axis ticks
    const ticks: number[] = [];
    const addedHours: { [key: number]: boolean } = {};

    dataWithLatestFlag.forEach(d => {
        const date = new Date(d.timestamp);
        const hour = date.getHours();
        if (!addedHours[hour]) {
            ticks.push(d.timestamp);
            addedHours[hour] = true;
        }
    });

    const lastTimestamp = dataWithLatestFlag[dataWithLatestFlag.length - 1].timestamp;
    if (!ticks.includes(lastTimestamp)) {
        ticks.push(lastTimestamp);
    }

    return { 
      finalData, 
      dataWithLatestFlag,
      xTicks: ticks
    };
  }, [glucoseData, timeRange]);

  const chartConfig = {
    value: {
      label: "Glucose (mg/dL)",
      color: "#002D3A",
    },
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-2 shadow-lg">
          <p className="font-medium text-gray-900">{`${point.value} mg/dL`}</p>
          <p className="text-sm text-gray-600">{new Date(point.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</p>
          <p className="text-xs text-gray-500">{new Date(point.timestamp).toLocaleDateString()}</p>
          {point.source && (
            <p className="text-xs text-gray-500 capitalize">{point.source}</p>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomXAxisTick = (props: any) => {
    const { x, y, payload, index } = props;
    const isLast = index === processedData.xTicks.length - 1;
    const label = isLast 
        ? "Now" 
        : new Date(payload.value).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }).replace(/\s/g, '');
    
    return (
        <g transform={`translate(${x},${y})`}>
            <text x={0} y={0} dy={16} textAnchor="middle" fill="#6B7280" fontSize={12}>
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

  if (loading) {
    return (
      <div className={cn("h-60 w-full flex items-center justify-center bg-gray-50 rounded-lg", containerClassName)}>
        <div className="text-center">
          <div className="text-gray-400 text-lg font-medium">Loading...</div>
          <div className="text-gray-300 text-sm mt-1">Fetching glucose data from database</div>
        </div>
      </div>
    );
  }

  const { dataWithLatestFlag, xTicks } = processedData;

  if (dataWithLatestFlag.length < 2) {
    return (
      <div className={cn("h-60 w-full flex items-center justify-center bg-gray-50 rounded-lg", containerClassName)}>
        <div className="text-center">
          <div className="text-gray-400 text-lg font-medium">Not enough data yet</div>
          <div className="text-gray-300 text-sm mt-1">Need at least 2 readings to show trend</div>
        </div>
      </div>
    );
  }

  const yAxisDomain = [40, 280];
  const yTicks = [40, 80, 120, 160, 200, 240, 280];
  
  return (
    <div className={cn("h-60 w-full relative", containerClassName)}>
      {showTimeRangeFilter && (
        <div 
          className="absolute top-3 right-3 z-10"
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <ToggleGroup 
            type="single" 
            value={timeRange}
            onValueChange={handleTimeRangeChange}
            size="sm" 
            className="bg-gray-500/10 backdrop-blur-sm rounded-lg p-1 border border-gray-200/30"
          >
            <ToggleGroupItem 
              value="3" 
              className="px-2.5 py-1 h-auto text-xs text-gray-600 rounded-md border-transparent bg-transparent data-[state=on]:bg-white data-[state=on]:text-gray-900 data-[state=on]:shadow-sm"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              3H
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="6" 
              className="px-2.5 py-1 h-auto text-xs text-gray-600 rounded-md border-transparent bg-transparent data-[state=on]:bg-white data-[state=on]:text-gray-900 data-[state=on]:shadow-sm"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              6H
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="12" 
              className="px-2.5 py-1 h-auto text-xs text-gray-600 rounded-md border-transparent bg-transparent data-[state=on]:bg-white data-[state=on]:text-gray-900 data-[state=on]:shadow-sm"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              12H
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="24" 
              className="px-2.5 py-1 h-auto text-xs text-gray-600 rounded-md border-transparent bg-transparent data-[state=on]:bg-white data-[state=on]:text-gray-900 data-[state=on]:shadow-sm"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              24H
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}
      <ChartContainer config={chartConfig} className="h-full w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={dataWithLatestFlag} 
            margin={{ top: 20, right: 15, left: 20, bottom: 15 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200/50" />
            
            <XAxis 
              dataKey="timestamp" 
              type="number"
              domain={['dataMin', 'dataMax']}
              ticks={xTicks}
              tick={<CustomXAxisTick />}
              axisLine={false}
              tickLine={true}
              padding={{ left: 10, right: 10 }}
            />
            
            <YAxis 
              orientation="left"
              domain={yAxisDomain}
              ticks={yTicks}
              tick={{ fontSize: 11, fill: "#6B7280" }}
              axisLine={false}
              tickLine={true}
              width={40}
              tickFormatter={(value) => `${value}`}
            >
              <Label
                value="mg/dL"
                angle={-90}
                position="insideLeft"
                style={{ textAnchor: 'middle', fill: '#6B7280', fontSize: 12 }}
                offset={-5}
              />
            </YAxis>
            
            {/* Glucose Zones */}
            <ReferenceArea y1={yAxisDomain[0]} y2={70} fill="#f59e0b" fillOpacity={0.1} />
            <ReferenceArea y1={70} y2={180} fill="#22c55e" fillOpacity={0.1} />
            <ReferenceArea y1={180} y2={yAxisDomain[1]} fill="#ef4444" fillOpacity={0.1} />

            <ReferenceLine y={70} stroke="#f59e0b" strokeWidth={1} strokeDasharray="3 3" />
            <ReferenceLine y={180} stroke="#ef4444" strokeWidth={1} strokeDasharray="3 3" />
            
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#9CA3AF', strokeWidth: 1, strokeDasharray: '3 3' }}/>
            
            {/* Main line for all data */}
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#002D3A"
              strokeWidth={2.5}
              dot={(props) => {
                const { cx, cy, payload } = props;
                if (!payload) return null;
                
                // Different colors for sensor vs manual readings
                const color = payload.source === 'sensor' ? '#002D3A' : '#0066CC';
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
              activeDot={{ r: 5 }}
            />
            
            {/* Highlight latest reading */}
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
                      <circle 
                        key={`latest-${index}`}
                        cx={cx} 
                        cy={cy} 
                        r={6} 
                        fill="white" 
                        stroke="#002D3A" 
                        strokeWidth={3}
                      />
                  );
                }
                return null;
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};

export default GlucoseTrendChart;
