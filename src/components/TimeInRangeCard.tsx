import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useMemo } from "react";

interface TimeInRangeCardProps {
  glucoseData: Array<{
    value: number;
    timestamp: number;
  }>;
}

const TimeInRangeCard = ({ glucoseData }: TimeInRangeCardProps) => {
  const timeInRangeData = useMemo(() => {
    if (!glucoseData.length) return { normal: 0, elevated: 0, high: 0, low: 0 };
    
    const last7Days = glucoseData.filter(reading => 
      reading.timestamp >= Date.now() - 7 * 24 * 60 * 60 * 1000
    );

    if (!last7Days.length) return { normal: 0, elevated: 0, high: 0, low: 0 };

    const total = last7Days.length;
    const normal = last7Days.filter(r => r.value >= 80 && r.value <= 130).length;
    const elevated = last7Days.filter(r => r.value > 130 && r.value <= 160).length;
    const high = last7Days.filter(r => r.value > 160).length;
    const low = last7Days.filter(r => r.value < 80).length;

    return {
      normal: Math.round((normal / total) * 100),
      elevated: Math.round((elevated / total) * 100),
      high: Math.round((high / total) * 100),
      low: Math.round((low / total) * 100)
    };
  }, [glucoseData]);

  const inRangePercent = timeInRangeData.normal;

  return (
    <Card className="bg-white rounded-xl shadow-sm">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="text-center">
            <p className="text-sm text-muted-foreground font-medium">Time in Range</p>
            <p className="text-lg font-semibold">{inRangePercent}% in Range This Week</p>
          </div>
          
          <div className="space-y-2">
            {/* Normal Range */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium">Normal</span>
              </div>
              <span className="text-sm text-muted-foreground">{timeInRangeData.normal}%</span>
            </div>
            <Progress value={timeInRangeData.normal} className="h-2" />
            
            {/* Elevated Range */}
            {timeInRangeData.elevated > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm font-medium">Elevated</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{timeInRangeData.elevated}%</span>
                </div>
                <Progress value={timeInRangeData.elevated} className="h-2" />
              </>
            )}
            
            {/* High Range */}
            {timeInRangeData.high > 0 && (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium">High</span>
                  </div>
                  <span className="text-sm text-muted-foreground">{timeInRangeData.high}%</span>
                </div>
                <Progress value={timeInRangeData.high} className="h-2" />
              </>
            )}
          </div>
          
          {inRangePercent >= 70 && (
            <div className="text-center">
              <p className="text-xs text-green-600 font-medium">🎉 Great glucose control!</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TimeInRangeCard;