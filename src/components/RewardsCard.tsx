
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trophy, Flame, Star } from "lucide-react";

const RewardsCard = () => {
  const currentPoints = 847;
  const currentStreak = 5;
  const nextLevelPoints = 1000;
  const progressPercent = (currentPoints / nextLevelPoints) * 100;

  return (
    <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-0 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <span className="text-gray-900">Rewards & Streaks</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{currentPoints}</div>
              <div className="text-xs text-gray-600">Points</div>
            </div>
            <div className="text-center">
              <div className="flex items-center space-x-1">
                <Flame className="w-5 h-5 text-orange-500" />
                <span className="text-2xl font-bold text-orange-600">{currentStreak}</span>
              </div>
              <div className="text-xs text-gray-600">Day Streak</div>
            </div>
          </div>
          <Badge className="bg-yellow-500 text-white">
            <Star className="w-3 h-3 mr-1" />
            Level 3
          </Badge>
        </div>
        
        <div>
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress to Level 4</span>
            <span>{currentPoints}/{nextLevelPoints}</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
        
        <div className="text-sm text-gray-600">
          <p>🎯 Stay in range today to continue your streak!</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default RewardsCard;
