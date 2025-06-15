import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Tooltip } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export interface GlucoseReading {
  time: string;
  value: number;
  timestamp: number;
  trendIndex: number;
}

interface GlucoseTrendChartProps {
  data: GlucoseReading[];
  trendDirection: 'up' | 'down' | 'flat';
}

const GlucoseTrendChart = ({ data, trendDirection }: GlucoseTrendChartProps) => {

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
      <div className="h-80 w-full flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-gray-400 text-lg font-medium">Not enough data yet</div>
          <div className="text-gray-300 text-sm mt-1">Need at least 4 readings to show trend</div>
        </div>
      </div>
    );
  }

  // Add isLatest flag to data for highlighting
  const dataWithLatestFlag = data.map((item, index) => ({
    ...item,
    isLatest: index === data.length - 1
  }));

  const yAxisDomain = [50, 200];
  const yAxisRange = yAxisDomain[1] - yAxisDomain[0];

  const xTicks = data.filter((_, index) => index % 12 === 0).map(d => d.time);

  return (
    <div className="h-80 w-full relative">
      {/* Range shading background */}
      <div
        className="absolute pointer-events-none"
        style={{ top: 25, right: 35, bottom: 30, left: 74 }}
      >
        {/* High (Red) Zone: > 140 */}
        <div
          className="absolute left-0 right-0 bg-red-100 opacity-50"
          style={{
            top: 0,
            height: `${((yAxisDomain[1] - 140) / yAxisRange) * 100}%`,
          }}
        />
        {/* In-Range (Green) Zone: 70-140 */}
        <div
          className="absolute left-0 right-0 bg-emerald-50 opacity-40"
          style={{
            top: `${((yAxisDomain[1] - 140) / yAxisRange) * 100}%`,
            height: `${((140 - 70) / yAxisRange) * 100}%`,
          }}
        />
        {/* Low (Yellow) Zone: < 70 */}
        <div
          className="absolute left-0 right-0 bg-yellow-100 opacity-50"
          style={{
            top: `${((yAxisDomain[1] - 70) / yAxisRange) * 100}%`,
            height: `${((70 - yAxisDomain[0]) / yAxisRange) * 100}%`,
          }}
        />
      </div>
      
      <ChartContainer config={chartConfig}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={dataWithLatestFlag} 
            margin={{ top: 25, right: 35, left: 24, bottom: 30 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200" />
            
            {/* X-axis with better formatting */}
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 11, fill: "#6B7280" }}
              axisLine={{ stroke: "#E5E7EB" }}
              tickLine={{ stroke: "#E5E7EB" }}
              ticks={xTicks}
              height={30}
            />
            
            {/* Y-axis with visible ticks and labels */}
            <YAxis 
              domain={yAxisDomain}
              tick={{ fontSize: 11, fill: "#6B7280" }}
              axisLine={{ stroke: "#E5E7EB" }}
              tickLine={{ stroke: "#E5E7EB" }}
              tickCount={7}
              width={50}
              label={{ 
                value: 'mg/dL', 
                angle: -90, 
                position: 'insideLeft',
                style: { textAnchor: 'middle', fontSize: '12px', fill: '#6B7280' }
              }}
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
              activeDot={{ r: 4, fill: "#002D3A", strokeWidth: 0 }}
            />
            
            {/* Latest point highlight with trend arrow */}
            <Line 
              type="monotone" 
              dataKey="value"
              stroke="transparent"
              strokeWidth={0}
              dot={(props) => {
                const { cx, cy, payload } = props;
                if (payload?.isLatest) {
                  let TrendIcon;
                  let iconColor;
                  
                  switch (trendDirection) {
                    case 'up':
                      TrendIcon = TrendingUp;
                      iconColor = "#ef4444"; // red-500
                      break;
                    case 'down':
                      TrendIcon = TrendingDown;
                      iconColor = "#f59e0b"; // amber-500
                      break;
                    default:
                      TrendIcon = Minus;
                      iconColor = "#6b7280"; // gray-500
                  }

                  return (
                    <g>
                      <circle cx={cx} cy={cy} r={6} fill="#00B7AE" />
                      {/* Using foreignObject to reliably render React components inside SVG */}
                      <foreignObject x={cx + 8} y={cy - 12} width={24} height={24}>
                        <TrendIcon color={iconColor} className="w-6 h-6 animate-pulse" />
                      </foreignObject>
                    </g>
                  );
                }
                return null;
              }}
              connectNulls={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartContainer>
    </div>
  );
};

export default GlucoseTrendChart;
