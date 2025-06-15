
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Camera, Plus, Clock, Apple, Dumbbell } from "lucide-react";
import BottomNav from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";

interface LogEntry {
  id: string;
  type: 'meal' | 'exercise' | 'snack';
  description: string;
  time: Date;
  points?: number;
}

const Logs = () => {
  const { toast } = useToast();
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: '1',
      type: 'meal',
      description: 'Grilled chicken salad with quinoa',
      time: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      points: 15
    },
    {
      id: '2',
      type: 'exercise',
      description: '20-minute brisk walk',
      time: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      points: 25
    },
    {
      id: '3',
      type: 'snack',
      description: 'Greek yogurt with berries',
      time: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      points: 10
    }
  ]);

  const [newLogDescription, setNewLogDescription] = useState("");

  const addLog = (type: LogEntry['type']) => {
    if (!newLogDescription.trim()) {
      toast({
        title: "Description Required",
        description: "Please enter a description for your log entry.",
        variant: "destructive",
      });
      return;
    }

    const newLog: LogEntry = {
      id: Date.now().toString(),
      type,
      description: newLogDescription,
      time: new Date(),
      points: type === 'exercise' ? 25 : type === 'meal' ? 15 : 10
    };

    setLogs([newLog, ...logs]);
    setNewLogDescription("");
    
    toast({
      title: "Log Added!",
      description: `+${newLog.points} points earned!`,
    });
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'meal':
        return <Apple className="w-5 h-5 text-green-500" />;
      case 'exercise':
        return <Dumbbell className="w-5 h-5 text-blue-500" />;
      case 'snack':
        return <Apple className="w-5 h-5 text-orange-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours === 1) return "1 hour ago";
    return `${diffInHours} hours ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 pb-20">
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Food & Activity Logs</h1>
          <p className="text-gray-600">Track your meals and workouts</p>
        </div>

        {/* Quick Add Section */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5 text-blue-500" />
              <span>Quick Add</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              placeholder="What did you eat or do?"
              value={newLogDescription}
              onChange={(e) => setNewLogDescription(e.target.value)}
              className="border-gray-200"
            />
            
            <div className="flex space-x-2">
              <Button
                onClick={() => addLog('meal')}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
              >
                <Apple className="w-4 h-4 mr-2" />
                Meal
              </Button>
              <Button
                onClick={() => addLog('exercise')}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Dumbbell className="w-4 h-4 mr-2" />
                Exercise
              </Button>
              <Button
                onClick={() => addLog('snack')}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Apple className="w-4 h-4 mr-2" />
                Snack
              </Button>
            </div>

            <Button
              onClick={() => toast({ title: "Camera Feature", description: "Photo logging coming soon!" })}
              variant="outline"
              className="w-full border-blue-200 hover:bg-blue-50"
            >
              <Camera className="w-4 h-4 mr-2" />
              Take Photo
            </Button>
          </CardContent>
        </Card>

        {/* Recent Logs */}
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Recent Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-100 hover:shadow-md transition-shadow"
                >
                  {getLogIcon(log.type)}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{log.description}</p>
                    <p className="text-sm text-gray-500">{formatTime(log.time)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="capitalize">
                      {log.type}
                    </Badge>
                    {log.points && (
                      <Badge className="bg-yellow-500 text-white">
                        +{log.points}
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNav />
    </div>
  );
};

export default Logs;
