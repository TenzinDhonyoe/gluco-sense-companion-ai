import { type GlucoseReading } from "@/components/GlucoseTrendChart";
import { type LogEntry } from "@/lib/logStore";

/**
 * Generates realistic glucose sample data for new users
 * Data follows typical patterns for prediabetic individuals
 */
export const generateSampleGlucoseData = (): GlucoseReading[] => {
  const now = Date.now();
  const sampleData: GlucoseReading[] = [];
  
  // Generate 7 days of sample data with realistic patterns
  for (let day = 6; day >= 0; day--) {
    const dayStart = now - (day * 24 * 60 * 60 * 1000);
    
    // Morning readings (6-8 AM) - typically fasting levels
    const morningTime = dayStart + (6.5 + Math.random() * 1.5) * 60 * 60 * 1000;
    sampleData.push({
      time: new Date(morningTime).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      }),
      value: Math.round(95 + Math.random() * 20), // 95-115 mg/dL range
      timestamp: morningTime,
      trendIndex: sampleData.length,
      source: 'sample'
    });

    // Post-breakfast readings (9-10 AM) - slightly elevated
    const breakfastTime = dayStart + (9 + Math.random() * 1) * 60 * 60 * 1000;
    sampleData.push({
      time: new Date(breakfastTime).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      }),
      value: Math.round(120 + Math.random() * 25), // 120-145 mg/dL range
      timestamp: breakfastTime,
      trendIndex: sampleData.length,
      source: 'sample'
    });

    // Mid-morning readings (11 AM-12 PM) - returning to baseline
    const midMorningTime = dayStart + (11.5 + Math.random() * 0.5) * 60 * 60 * 1000;
    sampleData.push({
      time: new Date(midMorningTime).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      }),
      value: Math.round(105 + Math.random() * 15), // 105-120 mg/dL range
      timestamp: midMorningTime,
      trendIndex: sampleData.length,
      source: 'sample'
    });

    // Post-lunch readings (1-2 PM) - peak post-meal
    const lunchTime = dayStart + (13.5 + Math.random() * 0.5) * 60 * 60 * 1000;
    sampleData.push({
      time: new Date(lunchTime).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      }),
      value: Math.round(130 + Math.random() * 30), // 130-160 mg/dL range
      timestamp: lunchTime,
      trendIndex: sampleData.length,
      source: 'sample'
    });

    // Afternoon readings (3-4 PM) - declining
    const afternoonTime = dayStart + (15.5 + Math.random() * 0.5) * 60 * 60 * 1000;
    sampleData.push({
      time: new Date(afternoonTime).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      }),
      value: Math.round(110 + Math.random() * 20), // 110-130 mg/dL range
      timestamp: afternoonTime,
      trendIndex: sampleData.length,
      source: 'sample'
    });

    // Post-dinner readings (7-8 PM) - evening peak
    const dinnerTime = dayStart + (19.5 + Math.random() * 0.5) * 60 * 60 * 1000;
    sampleData.push({
      time: new Date(dinnerTime).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      }),
      value: Math.round(125 + Math.random() * 25), // 125-150 mg/dL range
      timestamp: dinnerTime,
      trendIndex: sampleData.length,
      source: 'sample'
    });

    // Evening readings (9-10 PM) - settling down
    const eveningTime = dayStart + (21.5 + Math.random() * 0.5) * 60 * 60 * 1000;
    sampleData.push({
      time: new Date(eveningTime).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
      }),
      value: Math.round(100 + Math.random() * 20), // 100-120 mg/dL range
      timestamp: eveningTime,
      trendIndex: sampleData.length,
      source: 'sample'
    });
  }

  return sampleData.sort((a, b) => a.timestamp - b.timestamp);
};

/**
 * Generates sample meal and exercise log entries
 */
export const generateSampleLogs = (): LogEntry[] => {
  const now = Date.now();
  const sampleLogs: LogEntry[] = [];

  // Generate sample logs for the past 3 days
  for (let day = 2; day >= 0; day--) {
    const dayStart = now - (day * 24 * 60 * 60 * 1000);
    
    // Breakfast
    sampleLogs.push({
      id: `sample-meal-${day}-1`,
      type: 'meal',
      description: day === 0 ? 'Oatmeal with berries and almonds' : 
                   day === 1 ? 'Greek yogurt with granola' : 
                   'Whole grain toast with avocado',
      time: new Date(dayStart + (7.5 * 60 * 60 * 1000)).toISOString(),
      points: 15
    });

    // Lunch  
    sampleLogs.push({
      id: `sample-meal-${day}-2`,
      type: 'meal',
      description: day === 0 ? 'Quinoa salad with grilled chicken' :
                   day === 1 ? 'Vegetable wrap with hummus' :
                   'Lentil soup with mixed greens',
      time: new Date(dayStart + (12.5 * 60 * 60 * 1000)).toISOString(),
      points: 20
    });

    // Dinner
    sampleLogs.push({
      id: `sample-meal-${day}-3`,
      type: 'meal', 
      description: day === 0 ? 'Baked salmon with roasted vegetables' :
                   day === 1 ? 'Stir-fried tofu with brown rice' :
                   'Grilled chicken with sweet potato',
      time: new Date(dayStart + (18.5 * 60 * 60 * 1000)).toISOString(),
      points: 25
    });

    // Exercise (every other day)
    if (day % 2 === 0) {
      sampleLogs.push({
        id: `sample-exercise-${day}`,
        type: 'exercise',
        description: day === 0 ? '30-minute brisk walk' : '25-minute yoga session',
        time: new Date(dayStart + (16 * 60 * 60 * 1000)).toISOString(),
        points: 20
      });
    }
  }

  return sampleLogs.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
};

/**
 * Check if user has any real data (glucose readings or logs)
 * If not, we should show sample data
 */
export const shouldShowSampleData = (
  realGlucoseData: GlucoseReading[], 
  realLogs: LogEntry[]
): boolean => {
  const hasRealGlucoseData = realGlucoseData.length > 0;
  const hasRealLogs = realLogs.some(log => !log.id.startsWith('sample-'));
  
  return !hasRealGlucoseData && !hasRealLogs;
};

/**
 * Generate sample AI insights for new users
 */
export const generateSampleInsights = () => {
  return [
    {
      id: 'sample-insight-1',
      type: 'meal-timing',
      title: 'Meal Timing Pattern',
      description: 'Your glucose tends to peak 1-2 hours after meals. Consider spacing meals 4-5 hours apart.',
      priority: 'medium',
      actionable: true
    },
    {
      id: 'sample-insight-2', 
      type: 'exercise-impact',
      title: 'Post-Exercise Benefits',
      description: 'Your glucose levels show improvement after physical activity. Try a 10-minute walk after meals.',
      priority: 'high',
      actionable: true
    },
    {
      id: 'sample-insight-3',
      type: 'sleep-pattern',
      title: 'Morning Glucose Stability',
      description: 'Your fasting glucose levels are within a healthy range. Keep up your current sleep routine.',
      priority: 'low',
      actionable: false
    }
  ];
};