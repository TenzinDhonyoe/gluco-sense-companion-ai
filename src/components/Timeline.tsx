import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Clock, Utensils, Activity, Droplets, Calendar, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { type LogEntry, getLogs } from '@/lib/logStore';
import { convertGlucoseValue, getPreferredUnit } from '@/lib/units';
import { shouldShowSampleData } from '@/lib/sampleData';
import SampleDataWatermark from '@/components/SampleDataWatermark';

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
  postMealDelta?: {
    deltaValue: number;
    timeSpan: string;
    peakTime?: number; // minutes after meal
  };
  contextualActions?: {
    text: string;
    action: () => void;
  }[];
}

interface TimelineProps {
  glucoseData?: Array<{ timestamp: number; value: number; }>;
  logs?: LogEntry[];
}

const Timeline = ({ glucoseData = [], logs = [] }: TimelineProps) => {
  const [filter, setFilter] = useState<'all' | 'meal' | 'exercise' | 'glucose'>('all');
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [preferredUnit, setPreferredUnit] = useState<'mg/dL' | 'mmol/L'>('mg/dL');

  // Load preferred unit
  useEffect(() => {
    setPreferredUnit(getPreferredUnit());
  }, []);

  // Fetch and combine data from multiple sources
  useEffect(() => {
    const fetchTimelineData = async () => {
      try {
        // Use passed logs prop or fallback to localStorage
        const localStorageLogs = logs.length > 0 ? logs.map(log => ({
          ...log,
          time: log.time instanceof Date ? log.time.toISOString() : log.time
        })) : getLogs();
        // Convert local storage logs to timeline entries immediately
        const localEntries: TimelineEntry[] = localStorageLogs.map(log => ({
          id: `local-${log.id}`,
          type: log.type === 'snack' || log.type === 'beverage' ? 'meal' : log.type,
          title: log.description,
          description: `${log.type} • ${log.points || 0} points`,
          timestamp: new Date(log.time),
          icon: log.type === 'meal' || log.type === 'snack' || log.type === 'beverage' ? Utensils : Activity,
          color: log.type === 'meal' || log.type === 'snack' || log.type === 'beverage' ? 'text-orange-600' : 'text-green-600',
          bgColor: log.type === 'meal' || log.type === 'snack' || log.type === 'beverage' ? 'bg-orange-50' : 'bg-green-50'
        }));

        // Create glucose entries from passed glucose data
        const glucoseEntries: TimelineEntry[] = (glucoseData || []).map(reading => {
          const glucoseValue = reading.value;
          const displayValue = convertGlucoseValue(glucoseValue, 'mg/dL', preferredUnit);
          
          let glucoseStatus = 'Looking steady';
          let statusColor = 'text-green-600';
          
          if (glucoseValue < 80) {
            glucoseStatus = 'Lower range';
            statusColor = 'text-blue-600';
          } else if (glucoseValue > 130) {
            glucoseStatus = 'Higher than usual';
            statusColor = 'text-orange-600';
          } else if (glucoseValue > 160) {
            glucoseStatus = 'Elevated';
            statusColor = 'text-red-600';
          }

          return {
            id: `glucose-${reading.timestamp}`,
            type: 'glucose',
            title: `${displayValue} ${preferredUnit}`,
            description: `${glucoseStatus} • Manual entry`,
            timestamp: new Date(reading.timestamp),
            glucoseValue,
            icon: Droplets,
            color: statusColor,
            bgColor: 'bg-blue-50'
          };
        });

        // Set local entries immediately for real-time feel
        setTimelineEntries(() => {
          const combined = [...localEntries, ...glucoseEntries];
          return combined.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        });
        setLoading(false);

        // Try to fetch from Supabase asynchronously to enhance data
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          return;
        }

        // Fetch additional data from Supabase in parallel (non-blocking)
        const [mealsResult, exercisesResult, glucoseResult] = await Promise.allSettled([
          supabase
            .from('meals')
            .select('*')
            .eq('user_id', user.id)
            .order('timestamp', { ascending: false })
            .limit(20),
          supabase
            .from('exercises')
            .select('*')
            .eq('user_id', user.id)
            .order('timestamp', { ascending: false })
            .limit(20),
          supabase
            .from('glucose_readings')
            .select('*')
            .eq('user_id', user.id)
            .order('timestamp', { ascending: false })
            .limit(20)
        ]);

        // Process Supabase data if available
        let meals = null, exercises = null, glucose = null;
        
        if (mealsResult.status === 'fulfilled' && !mealsResult.value.error) {
          meals = mealsResult.value.data;
        }
        if (exercisesResult.status === 'fulfilled' && !exercisesResult.value.error) {
          exercises = exercisesResult.value.data;
        }
        if (glucoseResult.status === 'fulfilled' && !glucoseResult.value.error) {
          glucose = glucoseResult.value.data;
        }

        // Combine all entries
        const entries: TimelineEntry[] = [];

        // Add meals with post-meal delta calculation
        (meals || []).forEach(meal => {
          const mealTimestamp = new Date(meal.timestamp);
          const postMealDelta = calculatePostMealDelta(mealTimestamp, glucose || []);
          
          entries.push({
            id: `meal-${meal.id}`,
            type: 'meal',
            title: meal.meal_name,
            description: `${meal.meal_type} • ${meal.total_calories || 'N/A'} calories`,
            timestamp: mealTimestamp,
            icon: Utensils,
            color: 'text-orange-600',
            bgColor: 'bg-orange-50',
            postMealDelta,
            contextualActions: [
              {
                text: "Try smaller portions next time",
                action: () => console.log("Suggesting smaller portions for", meal.meal_name)
              },
              {
                text: "Log similar meal for comparison",
                action: () => console.log("Duplicating meal", meal.meal_name)
              }
            ]
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

        // Add glucose readings with unit conversion
        (glucose || []).forEach(reading => {
          const glucoseValue = Number(reading.value);
          const displayValue = convertGlucoseValue(glucoseValue, 'mg/dL', preferredUnit);
          const displayUnit = preferredUnit;
          
          let glucoseStatus = 'Looking steady';
          let statusColor = 'text-green-600';
          
          // Use mg/dL thresholds for consistency
          if (glucoseValue < 80) {
            glucoseStatus = 'Lower range';
            statusColor = 'text-blue-600';
          } else if (glucoseValue > 130) {
            glucoseStatus = 'Higher than usual';
            statusColor = 'text-orange-600';
          } else if (glucoseValue > 160) {
            glucoseStatus = 'Elevated';
            statusColor = 'text-red-600';
          }

          entries.push({
            id: `glucose-${reading.id}`,
            type: 'glucose',
            title: `${displayValue} ${displayUnit}`,
            description: `${glucoseStatus} • ${reading.tag || reading.source}`,
            timestamp: new Date(reading.timestamp),
            glucoseValue,
            icon: Droplets,
            color: statusColor,
            bgColor: 'bg-blue-50',
            contextualActions: [
              {
                text: "Check for patterns around this time",
                action: () => console.log("Analyzing patterns for glucose reading", reading.id)
              }
            ]
          });
        });

        // Sort by timestamp (most recent first)
        entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        setTimelineEntries(entries);
      } catch (error) {
        console.error('Error fetching timeline data:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
      } finally {
        setLoading(false);
      }
    };

    fetchTimelineData();

    // Listen for real-time updates when logs change
    const handleLogsChanged = () => {
      console.log('Timeline detected logs change - refreshing...');
      fetchTimelineData();
    };

    window.addEventListener('logsChanged', handleLogsChanged);
    return () => {
      window.removeEventListener('logsChanged', handleLogsChanged);
    };
  }, [preferredUnit, glucoseData, logs]);

  // Function to calculate post-meal glucose delta
  const calculatePostMealDelta = (mealTime: Date, glucoseReadings: any[]) => {
    const mealTimestamp = mealTime.getTime();
    const twoHoursAfter = mealTimestamp + (2 * 60 * 60 * 1000);
    const preMealWindow = mealTimestamp - (30 * 60 * 1000); // 30 min before
    
    // Find pre-meal baseline (30 min before meal)
    const preMealReadings = glucoseReadings.filter(reading => {
      const readingTime = new Date(reading.timestamp).getTime();
      return readingTime >= preMealWindow && readingTime <= mealTimestamp;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    if (preMealReadings.length === 0) return undefined;
    
    const baseline = Number(preMealReadings[0].value);
    
    // Find readings within 2 hours after meal
    const postMealReadings = glucoseReadings.filter(reading => {
      const readingTime = new Date(reading.timestamp).getTime();
      return readingTime > mealTimestamp && readingTime <= twoHoursAfter;
    }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    if (postMealReadings.length === 0) return undefined;
    
    // Find peak reading
    const peakReading = postMealReadings.reduce((max, reading) => 
      Number(reading.value) > Number(max.value) ? reading : max
    );
    
    const peakValue = Number(peakReading.value);
    const deltaValue = peakValue - baseline;
    const peakTime = Math.round((new Date(peakReading.timestamp).getTime() - mealTimestamp) / (60 * 1000));
    
    // Only show significant deltas (>10 mg/dL)
    if (Math.abs(deltaValue) < 10) return undefined;
    
    return {
      deltaValue: Math.round(deltaValue),
      timeSpan: peakTime < 60 ? `${peakTime}min` : `${Math.round(peakTime/60)}h`,
      peakTime
    };
  };

  // Filter entries based on selected filter
  const filteredEntries = useMemo(() => {
    if (filter === 'all') return timelineEntries;
    return timelineEntries.filter(entry => entry.type === filter);
  }, [timelineEntries, filter]);

  // Group entries by date and limit for mobile
  const groupedEntries = useMemo(() => {
    const groups = new Map<string, TimelineEntry[]>();
    
    filteredEntries.forEach(entry => {
      const dateKey = entry.timestamp.toDateString();
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
      groups.get(dateKey)!.push(entry);
    });

    const allGroups = Array.from(groups.entries()).map(([date, entries]) => ({
      date: new Date(date),
      entries: entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    }));

    // Limit to first 3 days if not showing all
    return showAll ? allGroups : allGroups.slice(0, 3);
  }, [filteredEntries, showAll]);

  const totalDays = useMemo(() => {
    const groups = new Map<string, TimelineEntry[]>();
    filteredEntries.forEach(entry => {
      const dateKey = entry.timestamp.toDateString();
      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }
    });
    return groups.size;
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

  const isUsingSampleData = shouldShowSampleData(
    glucoseData.map(d => ({ timestamp: d.timestamp, value: d.value, time: '', trendIndex: 0 })), 
    logs
  );

  return (
    <Card className="bg-white rounded-2xl shadow-sm relative">
      {/* Sample Data Watermark */}
      {isUsingSampleData && <SampleDataWatermark size="sm" opacity={0.1} />}
      
      <CardHeader className="px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Clock className="w-5 h-5 text-blue-500" />
            <span>Timeline</span>
          </CardTitle>
          
          {/* Filter Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                className="flex items-center gap-2 text-sm min-w-0 bg-white hover:bg-gray-50"
              >
                {(() => {
                  const filterOptions = [
                    { key: 'all', label: 'All', icon: Calendar },
                    { key: 'meal', label: 'Meals', icon: Utensils },
                    { key: 'exercise', label: 'Activity', icon: Activity },
                    { key: 'glucose', label: 'Glucose', icon: Droplets }
                  ];
                  const currentFilter = filterOptions.find(f => f.key === filter);
                  const Icon = currentFilter?.icon || Calendar;
                  return (
                    <>
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="hidden xs:inline">{currentFilter?.label || 'All'}</span>
                      <ChevronDown className="w-4 h-4 flex-shrink-0" />
                    </>
                  );
                })()}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 bg-white border border-gray-200 shadow-lg">
              {[
                { key: 'all', label: 'All', icon: Calendar },
                { key: 'meal', label: 'Meals', icon: Utensils },
                { key: 'exercise', label: 'Activity', icon: Activity },
                { key: 'glucose', label: 'Glucose', icon: Droplets }
              ].map(({ key, label, icon: Icon }) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => setFilter(key as any)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-sm cursor-pointer",
                    filter === key 
                      ? "bg-blue-50 text-blue-700" 
                      : "text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="px-4 sm:px-6 pb-6 pt-0 relative">
        {groupedEntries.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>No entries found</p>
            <p className="text-xs">Start logging meals, exercises, or glucose readings</p>
          </div>
        ) : (
          <>
            <div className="space-y-4 sm:space-y-6">
              {groupedEntries.map(({ date, entries }) => (
                <div key={date.toDateString()}>
                  {/* Date Header */}
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <h3 className="font-medium text-sm text-gray-900 flex-shrink-0">
                      {formatDateHeader(date)}
                    </h3>
                    <div className="flex-1 h-px bg-gray-200"></div>
                    <Badge variant="outline" className="text-xs text-gray-500 flex-shrink-0">
                      {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                    </Badge>
                  </div>

                  {/* Timeline Entries */}
                  <div className="space-y-1.5 sm:space-y-2">
                    {entries.map((entry) => {
                      const Icon = entry.icon;
                      
                      return (
                        <div key={entry.id} className="rounded-lg">
                          
                          {/* Main Entry Content */}
                          <div className="flex items-start gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg hover:bg-gray-50 transition-all bg-white"
                          >
                            <div className={cn("p-1.5 sm:p-2 rounded-full flex-shrink-0", entry.bgColor)}>
                              <Icon className={cn("w-3.5 h-3.5 sm:w-4 sm:h-4", entry.color)} />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="font-medium text-sm text-gray-900 truncate pr-1">
                                  {entry.title}
                                </h4>
                                <span className="text-xs text-gray-500 flex-shrink-0 whitespace-nowrap">
                                  {getRelativeTime(entry.timestamp)}
                                </span>
                              </div>
                              {entry.description && (
                                <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">
                                  {entry.description}
                                </p>
                              )}
                              
                              {/* Post-meal delta chip for meals */}
                              {entry.type === 'meal' && entry.postMealDelta && (
                                <div className="mt-1.5">
                                  <span className={cn(
                                    "inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium",
                                    entry.postMealDelta.deltaValue > 30 ? "bg-orange-50 text-orange-700" :
                                    entry.postMealDelta.deltaValue > 0 ? "bg-yellow-50 text-yellow-700" :
                                    "bg-green-50 text-green-700"
                                  )}>
                                    {entry.postMealDelta.deltaValue > 0 ? '+' : ''}{entry.postMealDelta.deltaValue} over {entry.postMealDelta.timeSpan}
                                    {entry.postMealDelta.deltaValue > 30 && (
                                      <ChevronUp className="w-3 h-3" />
                                    )}
                                  </span>
                                </div>
                              )}
                              
                              {/* Contextual AI actions */}
                              {entry.contextualActions && entry.contextualActions.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {entry.contextualActions.slice(0, 1).map((action, idx) => (
                                    <Button
                                      key={idx}
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        action.action();
                                      }}
                                      className="h-6 px-2 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 rounded-md"
                                    >
                                      {action.text}
                                    </Button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Show All History Button with fade gradient */}
            {!showAll && totalDays > 3 && (
              <div className="relative mt-4">
                {/* Subtle fade gradient */}
                <div className="absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-transparent to-white pointer-events-none"></div>
                
                <div className="pt-4 text-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowAll(true)}
                    className="text-sm text-gray-600 hover:text-gray-800 border-gray-200 hover:border-gray-300"
                  >
                    <ChevronDown className="w-4 h-4 mr-1" />
                    Show All History ({totalDays - 3} more days)
                  </Button>
                </div>
              </div>
            )}

            {/* Collapse button when showing all */}
            {showAll && totalDays > 3 && (
              <div className="text-center mt-4 pt-4 border-t border-gray-100">
                <Button
                  variant="ghost"
                  onClick={() => setShowAll(false)}
                  className="text-sm text-gray-500 hover:text-gray-700"
                >
                  Show Less
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default Timeline;