
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Activity, TrendingDown, TrendingUp } from "lucide-react";

const HbA1cCard = () => {
  const [hba1c, setHba1c] = useState(5.8);
  const [trend, setTrend] = useState<'improving' | 'stable' | 'concerning'>('improving');

  useEffect(() => {
    // Simulate AI-calculated HbA1c estimate
    const mockHbA1c = 5.6 + Math.random() * 0.8; // 5.6 - 6.4 range
    setHba1c(Number(mockHbA1c.toFixed(1)));
    
    if (mockHbA1c < 5.7) setTrend('improving');
    else if (mockHbA1c > 6.0) setTrend('concerning');
    else setTrend('stable');
  }, []);

  const getHbA1cInfo = (value: number) => {
    if (value < 5.7) return { level: 'Normal', color: 'text-green-600', bgColor: 'bg-green-100' };
    if (value < 6.5) return { level: 'Pre-diabetic', color: 'text-yellow-600', bgColor: 'bg-yellow-100' };
    return { level: 'Diabetic', color: 'text-red-600', bgColor: 'bg-red-100' };
  };

  const hba1cInfo = getHbA1cInfo(hba1c);
  const progressValue = Math.min((hba1c / 10) * 100, 100);

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-blue-500" />
          <span className="text-gray-900">HbA1c Estimate</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-3xl font-bold text-gray-900">{hba1c}%</div>
            <Badge className={`${hba1cInfo.bgColor} ${hba1cInfo.color} text-sm mt-1`}>
              {hba1cInfo.level}
            </Badge>
          </div>
          <div className="flex items-center space-x-1 text-sm">
            {trend === 'improving' ? (
              <TrendingDown className="w-4 h-4 text-green-500" />
            ) : trend === 'concerning' ? (
              <TrendingUp className="w-4 h-4 text-red-500" />
            ) : null}
            <span className="text-gray-600 capitalize">{trend}</span>
          </div>
        </div>
        
        <div>
          <Progress value={progressValue} className="h-2" />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>5.0%</span>
            <span>10.0%</span>
          </div>
        </div>
        
        <p className="text-sm text-gray-600">
          Based on 90-day glucose trend analysis
        </p>
      </CardContent>
    </Card>
  );
};

export default HbA1cCard;
