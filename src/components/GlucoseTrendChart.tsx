
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Tooltip, ReferenceArea } from "recharts";
import { ChartContainer } from "@/components/ui/chart";
import { downsampleLTTB, movingAverage } from "@/lib/chartUtils";
import { useMemo } from "react";

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

const GlucoseTrendChart = ({ data }: GlucoseTrendChartProps) => {

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg p-2 shadow-lg">
          <p className="font-medium text-gray-900">{`${point.value} mg/dL`}</p>
          <p className="text-sm text-gray-600">{new Date(point.timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</p>
        </div>
      );
    }
    return null;
  };

  const chartConfig = {
    value: {
      label: "Glucose (mg/dL)",
      color: "#002D3A",
    },
  };

  if (data.length < 4) {
    return (
      <div className="h-60 w-full flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-gray-400 text-lg font-medium">Not enough data yet</div>
          <div className="text-gray-300 text-sm mt-1">Need at least 4 readings to show trend</div>
        </div>
      </div>
    );
  }

  // DATA PIPELINE
  const MAX_VISIBLE_POINTS = 24;
  
  const points = data.map(d => ({ ...d, x: d.timestamp, y: d.value }));

  const decimatedData = points.length > MAX_VISIBLE_POINTS
    ? downsampleLTTB(points, MAX_VISIBLE_POINTS)
    : points;

  const finalData = movingAverage(decimatedData, 3);

  const dataWithLatestFlag = useMemo(() => finalData.map((item, index) => ({
    ...item,
    isLatest: index === finalData.length - 1,
  })), [finalData]);

  const yAxisDomain = [40, 280];

  const xTicks = useMemo(() => {
    if (!dataWithLatestFlag || dataWithLatestFlag.length === 0) return [];
    
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
    return ticks;
  }, [dataWithLatestFlag]);

  const CustomXAxisTick = (props: any) => {
    const { x, y, payload, index } = props;
    const isLast = index === xTicks.length - 1;
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
  
  return (
    <div className="h-60 w-full relative">
      <ChartContainer config={chartConfig} className="h-full w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart 
            data={dataWithLatestFlag} 
            margin={{ top: 5, right: 35, left: 5, bottom: 5 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-gray-200/50" />
            
            <XAxis 
              dataKey="timestamp" 
              type="number"
              domain={['dataMin', 'dataMax']}
              ticks={xTicks}
              tick={<CustomXAxisTick />}
              axisLine={false}
              tickLine={false}
              padding={{ left: 10, right: 10 }}
              height={30}
            />
            
            <YAxis 
              yAxisId="right"
              orientation="right"
              domain={yAxisDomain}
              tick={{ fontSize: 11, fill: "#6B7280" }}
              axisLine={false}
              tickLine={false}
              tickCount={6}
              width={30}
              tickFormatter={(value) => `– ${value}`}
            />
            
            <ReferenceArea y1={70} y2={180} fill="#E5E7EB" fillOpacity={0.3} yAxisId="right" />

            <ReferenceLine 
              yAxisId="right"
              y={70} 
              stroke="#ef4444"
              strokeWidth={1}
            />
            <ReferenceLine 
              yAxisId="right"
              y={250} 
              stroke="#f59e0b"
              strokeWidth={1}
            />
            
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#9CA3AF', strokeWidth: 1, strokeDasharray: '3 3' }}/>
            
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="value" 
              stroke="#002D3A"
              strokeWidth={2.5}
              dot={{ r: 2.5, fill: '#002D3A' }}
              activeDot={{ r: 5 }}
            />
            
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="value"
              stroke="transparent"
              strokeWidth={0}
              activeDot={false}
              dot={(props) => {
                const { cx, cy, payload } = props;
                if (payload?.isLatest) {
                  return (
                      <circle cx={cx} cy={cy} r={5} fill="white" stroke="#002D3A" strokeWidth={2}/>
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
