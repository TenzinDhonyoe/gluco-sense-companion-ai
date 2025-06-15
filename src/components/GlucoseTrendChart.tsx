
import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";

interface GlucoseReading {
  time: string;
  value: number;
  timestamp: number;
}

const GlucoseTrendChart = () => {
  const [data, setData] = useState<GlucoseReading[]>([]);

  // Generate simulated glucose readings
  const generateGlucoseReading = (timestamp: number): number => {
    // Simulate realistic glucose values (80-180 mg/dL range)
    const baseValue = 100;
    const variation = Math.sin(timestamp / 1000000) * 30; // Slow oscillation
    const noise = (Math.random() - 0.5) * 20; // Random variation
    return Math.max(70, Math.min(200, baseValue + variation + noise));
  };

  useEffect(() => {
    // Initialize with last 24 hours of data (15-minute intervals)
    const now = Date.now();
    const initialData: GlucoseReading[] = [];
    
    for (let i = 96; i >= 0; i--) { // 96 intervals = 24 hours
      const timestamp = now - (i * 15 * 60 * 1000); // 15 minutes ago
      const time = new Date(timestamp).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: false 
      });
      
      initialData.push({
        time,
        value: Math.round(generateGlucoseReading(timestamp)),
        timestamp
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
      
      const newReading: GlucoseReading = {
        time: newTime,
        value: Math.round(generateGlucoseReading(newTimestamp)),
        timestamp: newTimestamp
      };

      setData(prevData => {
        const newData = [...prevData.slice(1), newReading]; // Keep last 96 points
        return newData;
      });
    }, 15 * 60 * 1000); // 15 minutes

    return () => clearInterval(interval);
  }, []);

  const chartConfig = {
    value: {
      label: "Glucose (mg/dL)",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <div className="h-64 w-full">
      <ChartContainer config={chartConfig}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 10 }}
              interval="preserveStartEnd"
              tickFormatter={(value, index) => {
                // Show only every 8th tick (3 hours intervals)
                return index % 8 === 0 ? value : '';
              }}
            />
            <YAxis 
              domain={[70, 200]}
              tick={{ fontSize: 10 }}
              tickFormatter={(value) => `${value}`}
            />
            <ChartTooltip content={<ChartTooltipContent />} />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="var(--color-value)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "var(--color-value)" }}
            />
            {/* Target range indicators */}
            <Line 
              type="monotone" 
              dataKey={() => 80} 
              stroke="#22c55e" 
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
            />
            <Line 
              type="monotone" 
              dataKey={() => 140} 
              stroke="#22c55e" 
              strokeWidth={1}
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};

export default GlucoseTrendChart;
