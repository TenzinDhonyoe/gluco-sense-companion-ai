import { ComposedChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, ReferenceArea, Label, Tooltip, Bar } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { useMemo, useState, useEffect, useCallback } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface GlucoseReading {
  time: string;
  value: number;
  timestamp: number;
  trendIndex: number;
  source?: string;
}

interface CandlestickData {
  date: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  count: number;
}

interface GlucoseCandlestickChartProps {
  data?: GlucoseReading[];
  trendDirection?: 'up' | 'down' | 'flat';
  containerClassName?: string;
  showTimeRangeFilter?: boolean;
  defaultTimeRange?: string;
  onDataUpdate?: (data: GlucoseReading[]) => void;
}

const GlucoseCandlestickChart = ({ 
  data: propData, 
  containerClassName, 
  showTimeRangeFilter = true,
  defaultTimeRange = 'daily',
  onDataUpdate
}: GlucoseCandlestickChartProps) => {
  const [timeRange, setTimeRange] = useState(defaultTimeRange);
  const [glucoseData, setGlucoseData] = useState<GlucoseReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSampleButton, setShowSampleButton] = useState(false);
  const { toast } = useToast();

  const loadSampleData = useCallback(async () => {
    try {
      console.log('Loading sample glucose data from database...');
      const { error } = await supabase.rpc('insert_sample_glucose_data');
      
      if (error) {
        console.error('Error loading sample data:', error);
        toast({
          title: "Error",
          description: "Failed to load sample data",
          variant: "destructive",
        });
        return;
      }

      // Refresh data after inserting samples
      await fetchGlucoseReadings();
      
      toast({
        title: "Success",
        description: "Sample glucose data loaded successfully",
      });
    } catch (error) {
      console.error('Error in loadSampleData:', error);
      toast({
        title: "Error",
        description: "Failed to load sample data",
        variant: "destructive",
      });
    }
  }, []);

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
        .limit(1000);

      if (error) {
        console.error('Error fetching glucose readings:', error);
        setLoading(false);
        return;
      }

      if (!data || data.length === 0) {
        console.log('No glucose readings found');
        setShowSampleButton(true);
        setLoading(false);
        return;
      }

      const transformedData: GlucoseReading[] = (data || [])
        .reverse()
        .map((reading, index) => {
          const timestamp = new Date(reading.timestamp).getTime();
          return {
            time: new Date(timestamp).toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit', 
              hour12: true 
            }),
            value: Number(reading.value),
            timestamp: timestamp,
            trendIndex: index,
            source: reading.source || 'manual'
          };
        });

      console.log('Transformed glucose data from database:', transformedData.length, 'readings');
      setGlucoseData(transformedData);
      setShowSampleButton(false);
      
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
      .channel('glucose-readings-candlestick', {
        config: {
          broadcast: { self: true },
          presence: { key: 'glucose-candlestick' }
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
      .subscribe();

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
      return { candlestickData: [], xTicks: [], yDomain: [40, 280] };
    }
    
    const now = Date.now();
    let daysBack: number;
    
    switch (timeRange) {
      case 'weekly':
        daysBack = 7;
        break;
      case 'monthly':
        daysBack = 30;
        break;
      default: // daily
        daysBack = 7; // Show 7 days of daily candles
    }
    
    const fromTimestamp = now - daysBack * 24 * 60 * 60 * 1000;
    const filteredData = glucoseData.filter(d => d.timestamp >= fromTimestamp);

    if (filteredData.length < 2) {
      return { candlestickData: [], xTicks: [], yDomain: [40, 280] };
    }

    // Group data by period
    const groupedData = new Map<string, GlucoseReading[]>();
    
    filteredData.forEach(reading => {
      let groupKey: string;
      const date = new Date(reading.timestamp);
      
      if (timeRange === 'daily') {
        // Group by day
        groupKey = date.toISOString().split('T')[0];
      } else if (timeRange === 'weekly') {
        // Group by week (Monday as start of week)
        const monday = new Date(date);
        monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
        groupKey = monday.toISOString().split('T')[0] + '-week';
      } else {
        // Group by month
        groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }
      
      if (!groupedData.has(groupKey)) {
        groupedData.set(groupKey, []);
      }
      groupedData.get(groupKey)!.push(reading);
    });

    // Convert to candlestick format
    const candlestickData: CandlestickData[] = [];
    let allValues: number[] = [];
    
    groupedData.forEach((readings, key) => {
      if (readings.length === 0) return;
      
      const sortedReadings = readings.sort((a, b) => a.timestamp - b.timestamp);
      const values = sortedReadings.map(r => r.value);
      allValues = [...allValues, ...values];
      
      const open = sortedReadings[0].value;
      const close = sortedReadings[sortedReadings.length - 1].value;
      const high = Math.max(...values);
      const low = Math.min(...values);
      
      let displayDate: string;
      let timestamp: number;
      
      if (timeRange === 'daily') {
        displayDate = new Date(sortedReadings[0].timestamp).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        });
        timestamp = new Date(key).getTime();
      } else if (timeRange === 'weekly') {
        const weekStart = new Date(key.replace('-week', ''));
        displayDate = `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
        timestamp = weekStart.getTime();
      } else {
        const [year, month] = key.split('-');
        displayDate = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', { 
          month: 'short', 
          year: 'numeric' 
        });
        timestamp = new Date(parseInt(year), parseInt(month) - 1).getTime();
      }
      
      candlestickData.push({
        date: displayDate,
        timestamp,
        open,
        high,
        low,
        close,
        count: readings.length
      });
    });

    candlestickData.sort((a, b) => a.timestamp - b.timestamp);

    const xTicks = candlestickData.map(d => d.timestamp);

    // Calculate dynamic Y domain based on actual data
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const padding = (maxValue - minValue) * 0.1; // 10% padding
    const yDomain = [
      Math.max(40, Math.floor(minValue - padding)), 
      Math.min(280, Math.ceil(maxValue + padding))
    ];

    return { candlestickData, xTicks, yDomain };
  }, [glucoseData, timeRange]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="font-medium text-gray-900 mb-2">{data.date}</p>
          <div className="space-y-1 text-sm">
            <p><span className="text-gray-600">Open:</span> <span className="font-medium">{data.open} mg/dL</span></p>
            <p><span className="text-gray-600">High:</span> <span className="font-medium text-red-500">{data.high} mg/dL</span></p>
            <p><span className="text-gray-600">Low:</span> <span className="font-medium text-amber-500">{data.low} mg/dL</span></p>
            <p><span className="text-gray-600">Close:</span> <span className="font-medium">{data.close} mg/dL</span></p>
            <p className="text-xs text-gray-500">{data.count} readings</p>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomCandlestick = ({ payload, x, y, width, height }: any) => {
    if (!payload) return null;
    
    const { open, high, low, close } = payload;
    const isGreen = close >= open;
    const color = isGreen ? '#22c55e' : '#ef4444';
    
    // Calculate positions using dynamic Y domain
    const centerX = x + width / 2;
    const { yDomain } = processedData;
    const yRange = yDomain[1] - yDomain[0];
    const yScale = height / yRange;
    const baseY = y + height;
    
    // Convert glucose values to Y coordinates
    const highY = baseY - ((high - yDomain[0]) * yScale);
    const lowY = baseY - ((low - yDomain[0]) * yScale);
    const openY = baseY - ((open - yDomain[0]) * yScale);
    const closeY = baseY - ((close - yDomain[0]) * yScale);
    
    const candleTop = Math.min(openY, closeY);
    const candleBottom = Math.max(openY, closeY);
    const bodyHeight = Math.max(candleBottom - candleTop, 2); // Minimum height of 2px
    
    return (
      <g>
        {/* Wick (high-low line) */}
        <line
          x1={centerX}
          y1={highY}
          x2={centerX}
          y2={lowY}
          stroke={color}
          strokeWidth={1}
        />
        {/* Body (open-close rectangle) */}
        <rect
          x={x + width * 0.25}
          y={candleTop}
          width={width * 0.5}
          height={bodyHeight}
          fill={isGreen ? color : 'white'}
          stroke={color}
          strokeWidth={2}
        />
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
          <div className="text-gray-300 text-sm mt-1">Fetching glucose data</div>
        </div>
      </div>
    );
  }

  const { candlestickData, xTicks, yDomain } = processedData;

  if (candlestickData.length === 0) {
    return (
      <div className={cn("h-60 w-full flex flex-col items-center justify-center bg-gray-50 rounded-lg", containerClassName)}>
        <div className="text-center">
          <div className="text-gray-400 text-lg font-medium">No glucose data available</div>
          <div className="text-gray-300 text-sm mt-1">Need readings across multiple {timeRange === 'daily' ? 'days' : timeRange === 'weekly' ? 'weeks' : 'months'}</div>
          {showSampleButton && (
            <Button 
              onClick={loadSampleData} 
              className="mt-4 bg-blue-500 hover:bg-blue-600"
            >
              Load Sample Data
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Create dynamic Y ticks based on the domain
  const yTickCount = 6;
  const yTickInterval = (yDomain[1] - yDomain[0]) / (yTickCount - 1);
  const yTicks = Array.from({ length: yTickCount }, (_, i) => 
    Math.round(yDomain[0] + (i * yTickInterval))
  );

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
              value="daily" 
              className="px-2.5 py-1 h-auto text-xs text-gray-600 rounded-md border-transparent bg-transparent data-[state=on]:bg-white data-[state=on]:text-gray-900 data-[state=on]:shadow-sm"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              Daily
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="weekly" 
              className="px-2.5 py-1 h-auto text-xs text-gray-600 rounded-md border-transparent bg-transparent data-[state=on]:bg-white data-[state=on]:text-gray-900 data-[state=on]:shadow-sm"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              Weekly
            </ToggleGroupItem>
            <ToggleGroupItem 
              value="monthly" 
              className="px-2.5 py-1 h-auto text-xs text-gray-600 rounded-md border-transparent bg-transparent data-[state=on]:bg-white data-[state=on]:text-gray-900 data-[state=on]:shadow-sm"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              Monthly
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      )}
      <ChartContainer config={{ glucose: { label: "Glucose (mg/dL)", color: "#002D3A" } }} className="h-full w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={candlestickData} 
            margin={{ top: 20, right: 15, left: 20, bottom: 15 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200/50" />
            
            <XAxis 
              dataKey="timestamp" 
              type="number"
              domain={['dataMin', 'dataMax']}
              ticks={xTicks}
              tick={{ fontSize: 11, fill: "#6B7280" }}
              axisLine={false}
              tickLine={true}
              tickFormatter={(value) => {
                const data = candlestickData.find(d => d.timestamp === value);
                return data?.date || '';
              }}
            />
            
            <YAxis 
              orientation="left"
              domain={yDomain}
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
            
            {/* Glucose Zones - only show if they're within our domain */}
            {yDomain[0] < 70 && (
              <ReferenceArea y1={yDomain[0]} y2={Math.min(70, yDomain[1])} fill="#f59e0b" fillOpacity={0.1} />
            )}
            {yDomain[0] < 180 && yDomain[1] > 70 && (
              <ReferenceArea y1={Math.max(70, yDomain[0])} y2={Math.min(180, yDomain[1])} fill="#22c55e" fillOpacity={0.1} />
            )}
            {yDomain[1] > 180 && (
              <ReferenceArea y1={Math.max(180, yDomain[0])} y2={yDomain[1]} fill="#ef4444" fillOpacity={0.1} />
            )}

            {yDomain[0] <= 70 && yDomain[1] >= 70 && (
              <ReferenceLine y={70} stroke="#f59e0b" strokeWidth={1} strokeDasharray="3 3" />
            )}
            {yDomain[0] <= 180 && yDomain[1] >= 180 && (
              <ReferenceLine y={180} stroke="#ef4444" strokeWidth={1} strokeDasharray="3 3" />
            )}
            
            <Tooltip content={<CustomTooltip />} />
            
            {/* Invisible bars for positioning */}
            <Bar 
              dataKey="high" 
              fill="transparent"
              stroke="transparent"
              shape={(props: any) => <CustomCandlestick {...props} />}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};

export default GlucoseCandlestickChart;
