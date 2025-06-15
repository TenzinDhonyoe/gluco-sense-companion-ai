
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface GlucoseTrendCardProps {
  trend: 'low' | 'normal' | 'high';
  lastReading: Date;
}

const GlucoseTrendCard = ({ trend, lastReading }: GlucoseTrendCardProps) => {
  const getTrendInfo = (trend: string) => {
    switch (trend) {
      case 'low':
        return {
          label: 'Low',
          color: 'bg-yellow-500',
          textColor: 'text-yellow-700',
          bgColor: 'bg-yellow-50',
          icon: TrendingDown,
          description: 'Consider a healthy snack'
        };
      case 'high':
        return {
          label: 'High',
          color: 'bg-red-500',
          textColor: 'text-red-700',
          bgColor: 'bg-red-50',
          icon: TrendingUp,
          description: 'Consider light activity'
        };
      default:
        return {
          label: 'In Range',
          color: 'bg-green-500',
          textColor: 'text-green-700',
          bgColor: 'bg-green-50',
          icon: Minus,
          description: 'Great job staying on track!'
        };
    }
  };

  const trendInfo = getTrendInfo(trend);
  const Icon = trendInfo.icon;
  const minutesAgo = Math.floor((Date.now() - lastReading.getTime()) / (1000 * 60));

  return (
    <Card className={`${trendInfo.bgColor} border-0 shadow-lg`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <span className={trendInfo.textColor}>Glucose Trend</span>
          <Badge className={`${trendInfo.color} text-white`}>
            <Icon className="w-4 h-4 mr-1" />
            {trendInfo.label}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-2">{trendInfo.description}</p>
        <p className="text-xs text-gray-500">
          Last updated {minutesAgo} minutes ago
        </p>
      </CardContent>
    </Card>
  );
};

export default GlucoseTrendCard;
