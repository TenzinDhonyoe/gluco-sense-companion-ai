import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, Utensils, TestTube, Clock } from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";

interface LogEntry {
  id: string;
  type: 'glucose' | 'meal' | 'exercise';
  description: string;
  value?: number;
  unit?: string;
  time: string;
  category?: string;
}

interface RecentLogsTimelineProps {
  logs: LogEntry[];
}

const RecentLogsTimeline = ({ logs }: RecentLogsTimelineProps) => {
  const getLogIcon = (type: string) => {
    switch (type) {
      case 'glucose':
        return <TestTube className="w-4 h-4 text-red-500" />;
      case 'meal':
        return <Utensils className="w-4 h-4 text-green-500" />;
      case 'exercise':
        return <Activity className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    return format(date, "MMM d");
  };

  const groupedLogs = logs.reduce((acc: Record<string, LogEntry[]>, log) => {
    const dateLabel = getDateLabel(log.time);
    if (!acc[dateLabel]) acc[dateLabel] = [];
    acc[dateLabel].push(log);
    return acc;
  }, {});

  if (logs.length === 0) {
    return (
      <Card className="bg-white rounded-xl shadow-sm">
        <CardContent className="p-4 text-center">
          <div className="text-muted-foreground">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent activity</p>
            <p className="text-xs">Start logging to see your timeline</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-xl shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Recent Logs
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-4">
          {Object.entries(groupedLogs).map(([dateLabel, dayLogs]) => (
            <div key={dateLabel} className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground border-b pb-1">
                {dateLabel}
              </h4>
              <div className="space-y-3">
                {dayLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                    <div className="flex-shrink-0 mt-0.5">
                      {getLogIcon(log.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {log.description}
                        </p>
                        <span className="text-xs text-muted-foreground ml-2">
                          {format(new Date(log.time), "h:mm a")}
                        </span>
                      </div>
                      {log.value && (
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {log.value}{log.unit}
                          </Badge>
                          {log.category && (
                            <Badge variant="outline" className="text-xs capitalize">
                              {log.category}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentLogsTimeline;