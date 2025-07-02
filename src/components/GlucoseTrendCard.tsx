
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";
import GlucoseTrendChart, { type GlucoseReading } from "./GlucoseTrendChart";
import { Link } from "react-router-dom";

interface GlucoseTrendCardProps {
  trend: 'low' | 'normal' | 'high';
  lastReading: Date;
  latestValue?: number;
  trendDirection: 'up' | 'down' | 'flat';
  glucoseData: GlucoseReading[];
  onDataUpdate?: (data: GlucoseReading[]) => void;
}

const GlucoseTrendCard = ({ trend, lastReading, latestValue, trendDirection, glucoseData, onDataUpdate }: GlucoseTrendCardProps) => {
  const getTrendInfo = (trend: string) => {
    switch (trend) {
      case 'low':
        return {
          description: 'Consider a healthy snack'
        };
      case 'high':
        return {
          description: 'Consider light activity'
        };
      default:
        return {
          description: 'Great job staying on track!'
        };
    }
  };

  const getBorderColor = () => {
    if (!latestValue) return 'border-gray-300';
    
    if (latestValue < 80) return 'border-orange-400';
    if (latestValue > 160) return 'border-red-400';
    if (latestValue > 130) return 'border-yellow-400';
    return 'border-green-400';
  };

  const getStatusText = () => {
    if (!latestValue) return 'No data';
    
    if (latestValue < 80) return 'Slightly low';
    if (latestValue > 160) return 'High';
    if (latestValue > 130) return 'Elevated';
    return 'In range';
  };

  const getStatusTextColor = () => {
    if (!latestValue) return 'text-gray-500';
    
    if (latestValue < 80) return 'text-orange-600';
    if (latestValue > 160) return 'text-red-600';
    if (latestValue > 130) return 'text-yellow-600';
    return 'text-green-600';
  };

  const trendInfo = getTrendInfo(trend);
  const minutesAgo = Math.floor((Date.now() - lastReading.getTime()) / (1000 * 60));

  let TrendIcon;
  let iconBgColor;
  let iconAnimation = '';
  
  switch (trendDirection) {
    case 'up':
      TrendIcon = TrendingUp;
      iconBgColor = "bg-red-500";
      iconAnimation = "animate-bounce";
      break;
    case 'down':
      TrendIcon = TrendingDown;
      iconBgColor = "bg-amber-500";
      iconAnimation = "animate-bounce";
      break;
    default:
      TrendIcon = Minus;
      iconBgColor = "bg-gray-500";
  }

  return (
    <Card className="bg-transparent border-0 shadow-none p-0 w-full">
      <CardHeader className="p-0 pb-4 flex flex-row justify-center items-center">
        <div className={`flex items-center bg-white border-2 ${getBorderColor()} rounded-xl px-4 py-3 gap-2 shadow-sm transition-all duration-300`}>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-800 leading-none">
              {latestValue ?? '...'}
            </p>
            <p className="text-xs text-gray-500">mg/dL</p>
            <p className={`text-xs font-medium ${getStatusTextColor()}`}>
              {getStatusText()}
            </p>
          </div>
          {TrendIcon && (
            <div className={`p-2 rounded-full ${iconBgColor} shadow-sm ${trendDirection !== 'flat' ? iconAnimation : ''}`}>
              <TrendIcon className="w-4 h-4 text-white" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 p-0">
        <div className="rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-white w-full">
          <div className="h-44 w-full">
            <GlucoseTrendChart 
              trendDirection={trendDirection} 
              containerClassName="h-full w-full"
              showTimeRangeFilter={false}
              defaultTimeRange="7"
              onDataUpdate={onDataUpdate}
            />
          </div>
        </div>
        <div className="flex items-center justify-between text-xs pt-1">
          <p className="text-gray-500">
            {minutesAgo > 0 ? `${minutesAgo}m ago` : 'Now'}
          </p>
          <Link to="/insights/full" state={{ trendDirection }} className="flex items-center text-blue-600 hover:underline font-medium">
            View Trends
            <ArrowRight className="w-3 h-3 ml-1" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default GlucoseTrendCard;
