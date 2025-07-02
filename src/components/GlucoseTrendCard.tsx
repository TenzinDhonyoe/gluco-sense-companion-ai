
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
    if (trend === 'high' || trend === 'low') {
      return 'border-red-500';
    } else if (trend === 'normal') {
      return 'border-green-500';
    }
    return 'border-gray-200';
  };

  const trendInfo = getTrendInfo(trend);
  const minutesAgo = Math.floor((Date.now() - lastReading.getTime()) / (1000 * 60));

  let TrendIcon;
  let iconBgColor;
  
  switch (trendDirection) {
    case 'up':
      TrendIcon = TrendingUp;
      iconBgColor = "bg-red-500";
      break;
    case 'down':
      TrendIcon = TrendingDown;
      iconBgColor = "bg-amber-500";
      break;
    default:
      TrendIcon = Minus;
      iconBgColor = "bg-gray-500";
  }

  return (
    <Card className="bg-transparent border-0 shadow-none p-0 w-full">
      <CardHeader className="p-0 pb-6 flex flex-row justify-center items-center">
        <div className={`flex items-center bg-white border-2 ${getBorderColor()} rounded-2xl px-6 py-4 gap-4 shadow-md`}>
          <div className="text-center">
            <p className="text-3xl font-bold text-gray-800">
              {latestValue ?? '...'}
            </p>
            <p className="text-sm text-gray-500 -mt-1">mg/dL</p>
          </div>
          {TrendIcon && (
            <div className={`p-3 rounded-full ${iconBgColor}`}>
              <TrendIcon className="w-6 h-6 text-white" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-0">
        <div className="rounded-2xl overflow-hidden shadow-md border border-gray-200 bg-white w-full">
          <div className="h-72 w-full">
            <GlucoseTrendChart 
              trendDirection={trendDirection} 
              containerClassName="h-full w-full"
              showTimeRangeFilter={false}
              defaultTimeRange="7"
              onDataUpdate={onDataUpdate}
            />
          </div>
        </div>
        <div className="text-center pt-2">
          <p className="text-sm text-gray-600 mb-2">{trendInfo.description}</p>
          <div className="flex items-center justify-center gap-2 text-xs">
            <p className="text-gray-500">
              Last updated {minutesAgo > 0 ? `${minutesAgo} minutes ago` : 'just now'}
            </p>
            <span className="text-gray-400">&middot;</span>
            <Link to="/insights/full" state={{ trendDirection }} className="flex items-center text-blue-600 hover:underline font-medium">
              See full history
              <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GlucoseTrendCard;
