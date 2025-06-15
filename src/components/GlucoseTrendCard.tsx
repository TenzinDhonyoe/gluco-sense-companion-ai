
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import GlucoseTrendChart, { type GlucoseReading } from "./GlucoseTrendChart";

interface GlucoseTrendCardProps {
  trend: 'low' | 'normal' | 'high';
  lastReading: Date;
  latestValue?: number;
  trendDirection: 'up' | 'down' | 'flat';
  glucoseData: GlucoseReading[];
}

const GlucoseTrendCard = ({ trend, lastReading, latestValue, trendDirection, glucoseData }: GlucoseTrendCardProps) => {
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
    <Card className="bg-transparent border-0 shadow-none p-0">
      <CardHeader className="p-0 pb-6 flex flex-row justify-center">
        <div className="flex items-center bg-white border-2 border-gray-200 rounded-full p-2 space-x-3 shadow-sm">
          <div className="text-center pl-4">
            <p className="text-4xl font-bold text-gray-800">{latestValue ?? '...'}</p>
            <p className="text-sm text-gray-500 -mt-1">mg/dL</p>
          </div>
          {TrendIcon && (
            <div className={`p-2 rounded-full ${iconBgColor}`}>
              <TrendIcon className="w-6 h-6 text-white" />
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 p-0">
        <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200 bg-white">
          <GlucoseTrendChart data={glucoseData} trendDirection={trendDirection} />
        </div>
        <div className="text-center pt-2">
          <p className="text-sm text-gray-600 mb-1">{trendInfo.description}</p>
          <p className="text-xs text-gray-500">
            Last updated {minutesAgo > 0 ? `${minutesAgo} minutes ago` : 'just now'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default GlucoseTrendCard;
