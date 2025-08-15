# Sample Data Feature

## Overview
The GlucoSense app now includes a sample data feature that automatically displays realistic glucose tracking data for new users who haven't added any real data yet. This helps new users understand the app's functionality and interface before they start logging their own data.

## Key Features

### 🎨 Visual Design
- **"SAMPLE DATA" watermark**: Transparently overlaid on charts and components showing sample data
- **Automatic disappearance**: Once users add any real data, sample data is completely replaced
- **Realistic patterns**: Sample data follows typical prediabetic glucose patterns

### 📊 Sample Data Components

#### Glucose Readings
- **7 days of sample data** with realistic daily patterns
- **6-8 readings per day** covering morning, post-meal, and evening values
- **Glucose ranges**: 95-160 mg/dL following typical prediabetic patterns
- **Post-meal spikes**: Realistic 1-2 hour glucose elevation after meals

#### Sample Logs  
- **Meal entries**: 3 realistic meals per day with varied descriptions
- **Exercise activities**: Alternating days with different activities
- **Time distribution**: Spread across typical meal and activity times

#### AI Insights
- **Sample suggestions**: Pre-defined wellness insights about meal timing, exercise benefits, and glucose stability
- **Contextual relevance**: Insights that would apply to the sample data patterns

### 🔧 Technical Implementation

#### Core Files
- **`/src/lib/sampleData.ts`**: Core sample data generation logic
- **`/src/components/SampleDataWatermark.tsx`**: Watermark overlay component

#### Updated Components
- **`PreDiabeticGlucoseChart.tsx`**: Shows sample glucose data with watermark
- **`AISuggestionsCard.tsx`**: Displays sample AI insights when appropriate
- **`Timeline.tsx`**: Shows sample activities and meals in timeline
- **`Dashboard.tsx`**: Coordinates sample data across all dashboard components
- **`Logs.tsx`**: Shows sample logs in the activity log page

#### Detection Logic
```typescript
// Determines when to show sample data
shouldShowSampleData(glucoseData: GlucoseReading[], logs: LogEntry[]): boolean
```

The function returns `true` when:
- No real glucose readings exist
- No real user logs exist (excluding sample entries)

### 🎯 User Experience

#### For New Users
1. **First app launch**: Dashboard shows realistic glucose chart with sample data watermark
2. **Exploration**: All components show coordinated sample data
3. **Learning**: Users can explore features with meaningful data

#### Transition to Real Data  
1. **First data entry**: User adds any glucose reading, meal, or exercise
2. **Automatic switch**: Sample data disappears immediately
3. **Real data focus**: App shows only user's actual data going forward

### 🎨 Watermark Design
- **Text**: "SAMPLE DATA" in bold, uppercase letters
- **Styling**: Semi-transparent gray, rotated -15 degrees
- **Positioning**: Centered overlay on charts and cards
- **Opacity**: Adjustable (0.1-0.15) to avoid interfering with data visibility

### 📱 Components with Sample Data Support

1. **Dashboard**
   - Glucose trend chart
   - AI suggestions card  
   - Timeline component
   - Weekly summary calculations

2. **Logs Page**
   - Recent logs list
   - Activity timeline

3. **AI Features**
   - Contextual suggestions
   - Wellness insights

### 🔒 Data Privacy
- **No storage**: Sample data is generated dynamically, never stored
- **No tracking**: Sample data doesn't affect user analytics or recommendations
- **Clean separation**: Sample data is clearly marked and separate from real data

### 🚀 Benefits

#### User Onboarding
- **Immediate understanding**: New users see a populated interface
- **Feature discovery**: All major features are demonstrated with data
- **Reduced friction**: No empty state barriers to exploration

#### Development
- **Consistent testing**: Developers can test with realistic data patterns
- **UI verification**: Design elements work with actual data representations
- **Edge case coverage**: Sample data includes various glucose scenarios

## Usage Example

When a new user opens the app:

1. **Dashboard loads** with 7 days of sample glucose data
2. **Chart displays** realistic glucose patterns with "SAMPLE DATA" watermark
3. **AI suggestions** show relevant wellness tips based on sample patterns
4. **Timeline shows** sample meals and exercises from recent days

When user adds their first real entry:

1. **Immediate transition** to real data only
2. **Watermarks disappear** from all components
3. **User's data** becomes the sole focus of the interface

This creates a smooth, educational onboarding experience while maintaining clear separation between sample and real user data.