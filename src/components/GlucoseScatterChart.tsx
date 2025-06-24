
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, ReferenceArea, Label, Tooltip, Scatter, ScatterChart } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { useMemo, useState, useEffect, useCallback } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Switch } from "@/components/ui/switch";
import { Label as UILabel } from "@/components/ui/label";
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

interface GlucoseScatterChartProps {
  data?: GlucoseReading[];
  containerClassName?: string;
  showTimeRangeFilter?: boolean;
  defaultTimeRange?: string;
  onDataUpdate?: (data: GlucoseReading[]) => void;
}

const GlucoseScatterChart = ({ 
  data: propData, 
  containerClassName, 
  showTimeRangeFilter = true,
  defaultTimeRange = '12',
  onDataUpdate
}: GlucoseScatterChartProps) => {
  const [timeRange, setTimeRange] = useState(defaultTimeRange);
  const [glucoseData, setGlucoseData] = useState<GlucoseReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHealthyTrend, setShowHealthyTrend] = useState(false);
  const [showMealLogs, setShowMealLogs] = useState(true);
  const [highlightSpikes, setHighlightSpikes] = useState(true);
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

      const { data, error } = await supabase
        .from('glucose_readings')
        .select('*')
        .eq('user_id', user.id)
        .order('timestamp', { ascending: false })
        .limit(200);

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
      setGlucoseData(propData);
      setLoading(false);
    } else {
      fetchGlucoseReadings();
    }
  }, [propData, fetchGlucoseReadings]);

  useEffect(() => {
    const channel = supabase
      .channel('glucose-readings-scatter', {
        config: {
          broadcast: { self: true },
          presence: { key: 'glucose-scatter' }
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
      fetchGlucoseReadings();
    }, 30000);

    return () => {
      clearInterval(intervalId);
      supabase.removeChannel(channel);
    };
  }, [fetchGlucoseReadings]);

  const processedData = useMemo(() => {
    if (!glucoseData || glucoseData.length === 0) {
      return { finalData: [], xTicks: [], healthyTrendData: [], spikes: [] };
    }
    
    const now = Date.now();
    const hours = parseInt(timeRange);
    const fromTimestamp = now - hours * 60 * 60 * 1000;
    const filteredData = glucoseData.filter(d => d.timestamp >= fromTimestamp);

    if (filteredData.length < 2) {
      return { finalData: [], xTicks: [], healthyTrendData: [], spikes: [] };
    }

    // Generate healthy person average data for comparison
    const generateHealthyTrendData = (timestamps: number[]) => {
      return timestamps.map(timestamp => {
        const hour = new Date(timestamp).getHours();
        let healthyValue: number;
        
        if (hour >= 6 && hour <= 8) {
          healthyValue = 90; // Morning fasting
        } else if (hour >= 12 && hour <= 14) {
          healthyValue = 120; // Post-lunch
        } else if (hour >= 18 && hour <= 20) {
          healthyValue = 110; // Post-dinner
        } else if (hour >= 22 || hour <= 5) {
          healthyValue = 85; // Night/early morning
        } else {
          healthyValue = 95; // Default daytime
        }
        
        healthyValue += Math.sin(hour * 0.5) * 5;
        
        return {
          timestamp,
          healthyValue: Math.round(healthyValue)
        };
      });
    };

    const healthyTrendData = generateHealthyTrendData(filteredData.map(d => d.timestamp));

    // Merge data with healthy trend
    const mergedData = filteredData.map((item, index) => ({
      ...item,
      healthyValue: healthyTrendData[index]?.healthyValue || 95,
      hourTime: new Date(item.timestamp).getHours() + (new Date(item.timestamp).getMinutes() / 60)
    }));

    // Identify spikes (readings > 160 mg/dL)
    const spikes = mergedData.filter(d => d.value > 160);

    // Calculate x-axis ticks for time display
    const ticks: number[] = [];
    const addedHours: { [key: number]: boolean } = {};

    mergedData.forEach(d => {
      const date = new Date(d.timestamp);
      const hour = date.getHours();
      if (hour % 2 === 0 && !addedHours[hour]) {
        ticks.push(d.timestamp);
        addedHours[hour] = true;
      }
    });

    return { 
      finalData: mergedData, 
      xTicks: ticks,
      healthyTrendData,
      spikes
    };
  }, [glucoseData, timeRange]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      const hour = new Date(point.timestamp).getHours();
      
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
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl p-3 shadow-xl">
          <p className="font-semibold text-gray-900 mb-1">{`${point.value} mg/dL`}</p>
          <p className="text-sm text-gray-600">{new Date(point.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</p>
          <p className="text-xs text-gray-500">{new Date(point.timestamp).toLocaleDateString()}</p>
          {lifestyleNote && (
            <p className="text-xs text-blue-600 font-medium mt-1">{lifestyleNote}</p>
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
    
    let label;
    if (hour === 0) {
      label = "12AM";
    } else if (hour === 12) {
      label = "12PM";
    } else if (hour > 12) {
      label = `${hour - 12}PM`;
    } else {
      label = `${hour}AM`;
    }
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={16} textAnchor="middle" fill="#6B7280" fontSize={11} fontWeight={500}>
          {label}
        </text>
      </g>
    );
  };

  const getGlucoseColor = (value: number) => {
    if (value < 70) return "#F97316"; // Orange for low
    if (value > 180) return "#EF4444"; // Red for high
    if (value > 140) return "#F59E0B"; // Amber for elevated
    return "#22C55E"; // Green for normal
  };

  if (loading) {
    return (
      <div className={cn("h-80 w-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl", containerClassName)}>
        <div className="text-center">
          <div className="text-gray-400 text-lg font-medium">Loading...</div>
          <div className="text-gray-300 text-sm mt-1">Fetching glucose data</div>
        </div>
      </div>
    );
  }

  const { finalData, xTicks, spikes } = processedData;

  if (finalData.length === 0) {
    return (
      <div className={cn("h-80 w-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl", containerClassName)}>
        <div className="text-center">
          <div className="text-gray-400 text-lg font-medium">No glucose data available</div>
          <div className="text-gray-300 text-sm mt-1">Add some readings to see your trend</div>
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

  return (
    <div className={cn("h-80 w-full relative bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4", containerClassName)}>
      {/* Interactive Controls */}
      <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap gap-3 items-center justify-between">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2">
            <Switch
              id="healthy-trend"
              checked={showHealthyTrend}
              onCheckedChange={setShowHealthyTrend}
            />
            <UILabel htmlFor="healthy-trend" className="text-xs font-medium">Healthy Trend</UILabel>
          </div>
          
          <div className="flex items-center space-x-2 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2">
            <Switch
              id="highlight-spikes"
              checked={highlightSpikes}
              onCheckedChange={setHighlightSpikes}
            />
            <UILabel htmlFor="highlight-spikes" className="text-xs font-medium">Highlight Spikes</UILabel>
          </div>
        </div>

        {showTimeRangeFilter && (
          <ToggleGroup 
            type="single" 
            value={timeRange}
            onValueChange={(value) => value && setTimeRange(value)}
            size="sm" 
            className="bg-white/80 backdrop-blur-sm rounded-lg p-1"
          >
            <ToggleGroupItem value="3" className="text-xs px-3 py-1">3H</ToggleGroupItem>
            <ToggleGroupItem value="6" className="text-xs px-3 py-1">6H</ToggleGroupItem>
            <ToggleGroupItem value="12" className="text-xs px-3 py-1">12H</ToggleGroupItem>
            <ToggleGroupItem value="24" className="text-xs px-3 py-1">24H</ToggleGroupItem>
          </ToggleGroup>
        )}
      </div>

      <div className="h-full pt-16">
        <ChartContainer config={{ glucose: { label: "Glucose (mg/dL)", color: "#3B82F6" } }} className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart 
              data={finalData} 
              margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
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
                padding={{ left: 10, right: 10 }}
              />
              
              <YAxis 
                orientation="left"
                domain={[60, 200]}
                tick={{ fontSize: 11, fill: "#6B7280", fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
                width={50}
              >
                <Label
                  value="mg/dL"
                  angle={-90}
                  position="insideLeft"
                  style={{ textAnchor: 'middle', fill: '#6B7280', fontSize: 12, fontWeight: 600 }}
                  offset={-10}
                />
              </YAxis>
              
              {/* Glucose zones with soft colors */}
              <ReferenceArea y1={60} y2={70} fill="#F97316" fillOpacity={0.08} />
              <ReferenceArea y1={70} y2={140} fill="#22C55E" fillOpacity={0.08} />
              <ReferenceArea y1={140} y2={180} fill="#F59E0B" fillOpacity={0.08} />
              <ReferenceArea y1={180} y2={200} fill="#EF4444" fillOpacity={0.08} />

              <ReferenceLine y={70} stroke="#F97316" strokeWidth={1} strokeDasharray="4 4" opacity={0.6} />
              <ReferenceLine y={140} stroke="#F59E0B" strokeWidth={1} strokeDasharray="4 4" opacity={0.6} />
              <ReferenceLine y={180} stroke="#EF4444" strokeWidth={1} strokeDasharray="4 4" opacity={0.6} />
              
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#9CA3AF', strokeWidth: 1, strokeDasharray: '2 2', opacity: 0.7 }}/>
              
              {/* Healthy trend line (optional) */}
              {showHealthyTrend && (
                <Line 
                  type="monotone" 
                  dataKey="healthyValue" 
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  strokeDasharray="6 6"
                  dot={false}
                  name="Healthy Average"
                />
              )}
              
              {/* Main glucose line with scatter points */}
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
                  const size = highlightSpikes && payload.value > 160 ? 8 : 6;
                  
                  return (
                    <circle 
                      cx={cx} 
                      cy={cy} 
                      r={size} 
                      fill={color}
                      stroke="white"
                      strokeWidth={2}
                      className="drop-shadow-sm"
                    />
                  );
                }}
                activeDot={{ r: 8, fill: "#3B82F6", stroke: "white", strokeWidth: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>
    </div>
  );
};

export default GlucoseScatterChart;
