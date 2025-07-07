import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, Utensils, Activity, Droplets, Calendar, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { type LogEntry } from '@/lib/logStore';

interface TimelineEntry {
  id: string;
  type: 'meal' | 'exercise' | 'glucose' | 'other';
  title: string;
  description?: string;
  timestamp: Date;
  glucoseValue?: number;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

interface TimelineProps {
  glucoseData?: Array<{ timestamp: number; value: number; }>;
  logs?: LogEntry[];
}

const Timeline = ({ glucoseData = [], logs = [] }: TimelineProps) => {
  const [filter, setFilter] = useState<'all' | 'meal' | 'exercise' | 'glucose'>('all');
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from Supabase
  useEffect(() => {
    const fetchTimelineData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch meals
        const { data: meals } = await supabase
          .from('meals')
          .select('*')
          .eq('user_id', user.id)
          .order('timestamp', { ascending: false })
          .limit(20);

        // Fetch exercises
        const { data: exercises } = await supabase
          .from('exercises')
          .select('*')
          .eq('user_id', user.id)
          .order('timestamp', { ascending: false })
          .limit(20);

        // Fetch glucose readings
        const { data: glucose } = await supabase
          .from('glucose_readings')
          .select('*')
          .eq('user_id', user.id)
          .order('timestamp', { ascending: false })
          .limit(20);

        // Combine all entries
        const entries: TimelineEntry[] = [];

        // Add meals
        (meals || []).forEach(meal => {
          entries.push({
            id: `meal-${meal.id}`,
            type: 'meal',
            title: meal.meal_name,
            description: `${meal.meal_type} • ${meal.total_calories || 'N/A'} calories`,
            timestamp: new Date(meal.timestamp),
            icon: Utensils,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50'
          });
        });

        // Add exercises
        (exercises || []).forEach(exercise => {
          entries.push({
            id: `exercise-${exercise.id}`,
            type: 'exercise',
            title: exercise.exercise_name,
            description: `${exercise.exercise_type} • ${exercise.duration_minutes} min`,
            timestamp: new Date(exercise.timestamp),
            icon: Activity,
            color: 'text-green-600',
            bgColor: 'bg-green-50'
          });
        });

        // Add glucose readings
        (glucose || []).forEach(reading => {
          const glucoseValue = Number(reading.value);
          let glucoseStatus = 'Normal';
          let statusColor = 'text-green-600';
          
          if (glucoseValue < 80) {
            glucoseStatus = 'Low';
            statusColor = 'text-blue-600';
          } else if (glucoseValue > 130) {
            glucoseStatus = 'Elevated';
            statusColor = 'text-orange-600';
          } else if (glucoseValue > 160) {
            glucoseStatus = 'High';
            statusColor = 'text-red-600';
          }

          entries.push({
            id: `glucose-${reading.id}`,
            type: 'glucose',
            title: `${glucoseValue} mg/dL`,
            description: `${glucoseStatus} • ${reading.tag || reading.source}`,
            timestamp: new Date(reading.timestamp),
            glucoseValue,
            icon: Droplets,
            color: statusColor,
            bgColor: 'bg-blue-50'
          });
        });

        // Sort by timestamp (most recent first)
        entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        setTimelineEntries(entries);
      } catch (error) {
        console.error('Error fetching timeline data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTimelineData();
  }, []);

  // Filter entries based on selected filter
  const filteredEntries = useMemo(() => {
    if (filter === 'all') return timelineEntries;
    return timelineEntries.filter(entry => entry.type === filter);
  }, [timelineEntries, filter]);

  // Group entries by date
  const groupedEntries = useMemo(() => {
    const groups = new Map<string, TimelineEntry[]>();
    
    filteredEntries.forEach(entry => {
      const dateKey = entry.timestamp.toDateString();
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(entry);
    });

    return Array.from(groups.entries()).map(([date, entries]) => ({
      date: new Date(date),
      entries: entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    }));
  }, [filteredEntries]);

  const getRelativeTime = (timestamp: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - timestamp.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) {
      return `${diffDays}d ago`;
    } else if (diffHours > 0) {
      return `${diffHours}h ago`;
    } else {
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}m ago`;
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isYesterday = (date: Date) => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return date.toDateString() === yesterday.toDateString();
  };

  const formatDateHeader = (date: Date) => {
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <Card className="bg-white rounded-2xl shadow-sm">
        <CardHeader className="px-6 py-[18px]">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Clock className="w-5 h-5 text-blue-500" />
            <span>Timeline</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 pt-0">
          <div className="flex items-center justify-center py-8">
            <div className="text-gray-400">Loading timeline...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-2xl shadow-sm">
      <CardHeader className="px-6 py-[18px]">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Clock className="w-5 h-5 text-blue-500" />
            <span>Timeline</span>
          </CardTitle>
          
          {/* Filter Pills */}
          <div className="flex gap-1">
            {[
              { key: 'all', label: 'All', icon: Calendar },
              { key: 'meal', label: 'Meals', icon: Utensils },
              { key: 'exercise', label: 'Activity', icon: Activity },
              { key: 'glucose', label: 'Glucose', icon: Droplets }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all",
                  filter === key
                    ? "bg-blue-100 text-blue-700"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                )}
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="px-6 pb-6 pt-0">
        {groupedEntries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>No entries found</p>
            <p className="text-xs">Start logging meals, exercises, or glucose readings</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedEntries.map(({ date, entries }) => (
              <div key={date.toDateString()}>
                {/* Date Header */}
                <div className="flex items-center gap-2 mb-3">
                  <h3 className="font-medium text-sm text-gray-900">
                    {formatDateHeader(date)}
                  </h3>
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <Badge variant="outline" className="text-xs text-gray-500">
                    {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                  </Badge>
                </div>

                {/* Timeline Entries */}
                <div className="space-y-2">
                  {entries.map((entry) => {
                    const Icon = entry.icon;
                    return (
                      <div
                        key={entry.id}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
                      >
                        <div className={cn("p-2 rounded-full flex-shrink-0", entry.bgColor)}>
                          <Icon className={cn("w-4 h-4", entry.color)} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-sm text-gray-900 truncate">
                              {entry.title}
                            </h4>
                            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                              {getRelativeTime(entry.timestamp)}
                            </span>
                          </div>
                          {entry.description && (
                            <p className="text-xs text-gray-600 mt-0.5">
                              {entry.description}
                            </p>
                          )}
                          
                          {/* Show associated glucose spike/drop if applicable */}
                          {entry.type === 'meal' && (
                            <div className="mt-1">
                              <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                Glucose impact tracked
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Timeline;