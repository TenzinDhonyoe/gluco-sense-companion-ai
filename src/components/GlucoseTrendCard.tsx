
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
      <CardHeader className="p-0 pb-2 sm:pb-3 lg:pb-4 flex flex-row justify-center items-center">
        <div className={`flex items-center bg-white border-2 ${getBorderColor()} rounded-full px-3 py-2 sm:px-4 sm:py-3 lg:px-6 lg:py-4 space-x-2 sm:space-x-3 lg:space-x-4 shadow-lg w-auto max-w-full`}>
          <div className="text-center flex-shrink-0">
            <p className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-heading-lg leading-none">
              {latestValue ?? '...'}
            </p>
            <p className="text-xs sm:text-sm lg:text-base text-caption -mt-0.5">mg/dL</p>
          </div>
          {TrendIcon && (
            <div className={`p-1.5 sm:p-2 lg:p-3 rounded-full ${iconBgColor} flex-shrink-0`}>
              <TrendIcon className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-3 lg:space-y-4 p-0">
        <div className="rounded-lg sm:rounded-xl lg:rounded-2xl overflow-hidden shadow-lg border border-gray-200 bg-white w-full">
          <div className="h-48 sm:h-64 lg:h-72 xl:h-80 w-full">
            <GlucoseTrendChart 
              trendDirection={trendDirection} 
              containerClassName="h-full w-full"
              showTimeRangeFilter={false}
              defaultTimeRange="7"
              onDataUpdate={onDataUpdate}
            />
          </div>
        </div>
        <div className="text-center pt-1 sm:pt-2 px-2">
          <p className="text-body-sm mb-0.5 sm:mb-1">{trendInfo.description}</p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-0.5 sm:space-y-0 sm:space-x-1.5 text-caption">
            <p className="text-caption text-center">
              Last updated {minutesAgo > 0 ? `${minutesAgo} minutes ago` : 'just now'}
            </p>
            <span className="text-muted-foreground hidden sm:inline">&middot;</span>
            <Link to="/insights/full" state={{ trendDirection }} className="flex items-center text-primary hover:underline font-medium">
              See full history
              <ArrowRight className="w-3 h-3 ml-0.5 flex-shrink-0" />
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GlucoseTrendCard;
