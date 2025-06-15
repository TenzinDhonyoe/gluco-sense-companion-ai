
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Tooltip } from "recharts";
import { ChartContainer } from "@/components/ui/chart";

interface GlucoseReading {
  time: string;
  value: number;
  timestamp: number;
  trendIndex: number;
}

const GlucoseTrendChart = () => {
  const [data, setData] = useState<GlucoseReading[]>([]);

  // Generate simulated glucose readings with trend index
  const generateGlucoseReading = (timestamp: number, index: number): { value: number; trendIndex: number } => {
    // Simulate realistic glucose values with smoother transitions
    const baseValue = 100;
    const timeOfDay = (timestamp % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000); // Hours in day
    
    // Gentle daily rhythm (higher after meals, lower at night)
    const dailyPattern = Math.sin((timeOfDay - 6) * Math.PI / 12) * 15;
    
    // Smooth trending with some persistence
    const trend = Math.sin(timestamp / (4 * 60 * 60 * 1000)) * 20; // 4-hour cycles
    
    // Reduced noise for smoother curve
    const noise = (Math.random() - 0.5) * 8;
    
    const value = Math.max(60, Math.min(200, baseValue + dailyPattern + trend + noise));
    
    // Calculate trend index based on rate of change
    const trendIndex = Math.round((value - 100) / 10);
    
    return { value: Math.round(value), trendIndex };
  };

  useEffect(() => {
    // Initialize with last 24 hours of data (15-minute intervals)
    const now = Date.now();
    const initialData: GlucoseReading[] = [];
    
    for (let i = 96; i >= 0; i--) { // 96 intervals = 24 hours
      const timestamp = now - (i * 15 * 60 * 1000);
      const time = new Date(timestamp).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: false 
      });
      
      const { value, trendIndex } = generateGlucoseReading(timestamp, i);
      
      initialData.push({
        time,
        value,
        timestamp,
        trendIndex
      });
    }
    
    setData(initialData);

    // Update with new reading every 15 minutes
    const interval = setInterval(() => {
      const newTimestamp = Date.now();
      const newTime = new Date(newTimestamp).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: false 
      });
      
      const { value, trendIndex } = generateGlucoseReading(newTimestamp, 0);
      
      const newReading: GlucoseReading = {
        time: newTime,
        value,
        timestamp: newTimestamp,
        trendIndex
      };

      setData(prevData => {
        const newData = [...prevData.slice(1), newReading]; // Keep last 96 points
        return newData;
      });
    }, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(interval);
  }, []);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
          <p className="font-medium text-gray-900">{`${label} – ${data.value} mg/dL`}</p>
          <p className="text-sm text-gray-600">{`Trend Index ${data.trendIndex}`}</p>
        </div>
      );
    }
    return null;
  };

  const chartConfig = {
    value: {
      label: "Glucose (mg/dL)",
      color: "#002D3A", // Brand navy
    },
  };

  // Empty state if not enough data
  if (data.length < 4) {
    return (
      <div className="h-64 w-full flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <div className="text-center">
          <div className="text-gray-400 text-lg font-medium">Not enough data yet</div>
          <div className="text-gray-300 text-sm mt-1">Need at least 4 readings to show trend</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-64 w-full relative">
      {/* Range shading background */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute left-4 right-4 bg-emerald-50 opacity-40 rounded"
          style={{
            top: `${((200 - 140) / (200 - 50)) * 100}%`,
            height: `${((140 - 70) / (200 - 50)) * 100}%`
          }}
        />
      </div>
      
      <ChartContainer config={chartConfig}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={data} 
            margin={{ top: 10, right: 16, left: 16, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
            
            {/* X-axis with 3-hour intervals */}
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 10, fill: "#6B7280" }}
              axisLine={{ stroke: "#E5E7EB" }}
              tickLine={{ stroke: "#E5E7EB" }}
              interval="preserveStartEnd"
              tickFormatter={(value, index) => {
                // Show only every 12th tick (3 hours intervals for 15-min data)
                return index % 12 === 0 ? value : '';
              }}
            />
            
            {/* Y-axis without left ticks */}
            <YAxis 
              domain={[50, 200]}
              tick={false}
              axisLine={false}
              tickLine={false}
            />
            
            {/* Threshold lines */}
            <ReferenceLine 
              y={70} 
              stroke="#14B8A6" 
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            <ReferenceLine 
              y={140} 
              stroke="#14B8A6" 
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            
            <Tooltip content={<CustomTooltip />} />
            
            {/* Main glucose line with smooth curve */}
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#002D3A"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, fill: "#002D3A", strokeWidth: 0 }}
            />
            
            {/* Latest point highlight */}
            <Line 
              type="monotone" 
              dataKey={(entry, index) => index === data.length - 1 ? entry.value : null}
              stroke="transparent"
              strokeWidth={0}
              dot={{ r: 6, fill: "#00B7AE", strokeWidth: 0 }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};

export default GlucoseTrendChart;
