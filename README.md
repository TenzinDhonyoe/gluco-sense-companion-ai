# GlucoTracker - Comprehensive Glucose Monitoring App

## Overview
GlucoTracker is a modern, full-stack web application designed for comprehensive glucose monitoring and diabetes management. The app provides real-time glucose tracking, meal logging, exercise monitoring, and AI-powered insights to help users manage their blood glucose levels effectively.

## Tech Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **TypeScript** - Type-safe development
- **Vite** - Fast development server and build tool
- **Tailwind CSS** - Utility-first CSS framework with custom design tokens
- **shadcn/ui** - High-quality UI component library built on Radix UI
- **React Router DOM** - Client-side routing
- **React Query (TanStack Query)** - Server state management
- **React Hook Form** - Form management with validation
- **Recharts** - Data visualization and charting
- **Lucide React** - Icon library
- **Zod** - Runtime type validation
- **date-fns** - Date manipulation utilities

### Backend & Database
- **Supabase** - Backend-as-a-Service providing:
  - PostgreSQL database with Row Level Security (RLS)
  - Real-time subscriptions
  - Authentication
  - Edge Functions for serverless compute
  - API auto-generation

### AI Integration
- **Google Generative AI** - For intelligent parsing and suggestions
- **Custom AI Engine** - Rule-based suggestion system for glucose management

## Application Architecture

### File Structure
```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui base components
│   ├── glucose/         # Glucose-specific components
│   ├── AIParseInput.tsx # AI-powered input parsing
│   ├── AISuggestionsCard.tsx # AI suggestions display
│   ├── GlucoseEntryForm.tsx # Glucose reading input
│   ├── MealEntryForm.tsx # Meal logging
│   ├── ExerciseEntryForm.tsx # Exercise tracking
│   ├── Timeline.tsx     # Activity timeline
│   └── [other components]
├── pages/               # Main application pages
│   ├── Index.tsx        # Landing page
│   ├── Dashboard.tsx    # Main dashboard with charts
│   ├── GlucoseTracker.tsx # Glucose readings management
│   ├── Logs.tsx         # Activity logs
│   ├── Insights.tsx     # Analytics and insights
│   ├── Chat.tsx         # AI chat interface
│   └── Profile.tsx      # User profile
├── lib/                 # Utility libraries
│   ├── ai/             # AI engine and parsing
│   ├── utils.ts        # General utilities
│   ├── glucoseUtils.ts # Glucose-specific calculations
│   ├── chartUtils.ts   # Chart configuration
│   └── logStore.ts     # Local storage management
├── hooks/              # Custom React hooks
├── integrations/       # External service integrations
│   └── supabase/       # Supabase client and types
└── main.tsx           # App entry point
```

## Database Schema

### Core Tables

#### `glucose_readings`
- Primary table for blood glucose measurements
- Fields: `id`, `user_id`, `value`, `unit`, `timestamp`, `tag`, `notes`, `source`
- Supports both manual entries and sensor readings
- Tags: fasting, post-meal, pre-meal, bedtime, exercise, random

#### `meals`
- Meal logging with nutritional information
- Fields: `id`, `user_id`, `meal_name`, `meal_type`, `timestamp`, `total_calories`, `total_carbs`, etc.
- Meal types: breakfast, lunch, dinner, snack, other

#### `food_items`
- Individual food items within meals
- Linked to meals via foreign key
- Detailed nutritional breakdown per food item

#### `exercises`
- Exercise tracking and logging
- Fields: `id`, `user_id`, `exercise_name`, `exercise_type`, `duration_minutes`, `intensity`, etc.
- Intensity levels: low, moderate, high, very_high

#### `glucose_events`
- Links glucose readings to meals/exercises for correlation analysis
- Automatically populated via database triggers
- Enables time-in-range calculations relative to events

#### `profiles`
- Extended user profile information
- Basic user data beyond Supabase auth

### Security
- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Service role access for edge functions when needed

## Key Features

### 1. Glucose Monitoring
- **Manual Entry**: Quick glucose reading input with contextual tags
- **Real-time Charts**: Interactive glucose trend visualization
- **Time-in-Range Analysis**: Pre-diabetic range tracking (70-140 mg/dL)
- **Candlestick Charts**: OHLC glucose pattern analysis
- **Multiple View Modes**: 24-hour, 7-day, 14-day, and 30-day views

### 2. Meal & Exercise Tracking
- **Comprehensive Meal Logging**: Food items with nutritional data
- **Exercise Tracking**: Duration, intensity, and type logging
- **Photo Integration**: Meal photo capture and storage
- **AI-Powered Parsing**: Natural language input processing

### 3. AI Intelligence
- **Smart Suggestions**: Personalized recommendations based on patterns
- **Natural Language Processing**: Parse complex meal descriptions
- **Trend Analysis**: Identify glucose patterns and correlations
- **Contextual Insights**: Meal and exercise impact analysis

### 4. Data Visualization
- **Interactive Charts**: Recharts-powered glucose trend visualization
- **Progress Tracking**: HbA1c estimation and progress indicators
- **Time-in-Range Metrics**: Visual progress indicators
- **Historical Analysis**: Long-term trend analysis

### 5. Mobile-First Design
- **Responsive UI**: Optimized for mobile and desktop
- **PWA Capabilities**: Installable web app (via Capacitor)
- **Touch Interactions**: Mobile-optimized input methods
- **Drawer Components**: Mobile-friendly quick entry

## Component Architecture

### Core Components

#### Dashboard (`src/pages/Dashboard.tsx`)
- Main application hub
- Real-time glucose chart display
- Quick stats and metrics
- Navigation to other features

#### GlucoseTracker (`src/pages/GlucoseTracker.tsx`)
- Dedicated glucose reading management
- CRUD operations for glucose data
- Real-time updates via Supabase subscriptions

#### PreDiabeticGlucoseChart (`src/components/PreDiabeticGlucoseChart.tsx`)
- Advanced glucose visualization
- Time-in-range calculations
- Multiple time period views
- Interactive data exploration

#### AI Components
- **AIParseInput**: Natural language meal/exercise parsing
- **AISuggestionsCard**: Personalized recommendations
- **Chat**: AI-powered conversation interface

### UI Component System
- Built on shadcn/ui and Radix UI primitives
- Consistent design tokens via Tailwind CSS
- Accessible components with proper ARIA labels
- Dark/light mode support

## Real-time Features
- **Live Updates**: Supabase real-time subscriptions for glucose readings
- **Instant Sync**: Changes reflect immediately across all connected clients
- **Event-Driven Architecture**: Custom events for component communication

## AI Engine

### GlucoAI SDK (`src/lib/ai/`)
Token-free, rule-based AI system with:

#### Parser Module (`parser.ts`)
- Natural language meal parsing
- Exercise description processing
- Nutritional estimation algorithms

#### Suggestions Module (`suggestions.ts`)
- Pattern-based recommendations
- Glucose trend analysis
- Contextual health insights

#### Types (`types.ts`)
- Comprehensive type definitions
- Ensures type safety across AI features

## Mobile Support
- **Capacitor Integration**: Native app capabilities
- **iOS/Android Builds**: Cross-platform mobile deployment
- **Device APIs**: Camera access for meal photos
- **Offline Capabilities**: Local storage for temporary data

## Development Setup

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project

### Installation
```bash
git clone <repository-url>
cd glucotracker
npm install
```

### Environment Setup
1. Create Supabase project
2. Configure authentication providers
3. Run database migrations
4. Set up environment variables

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

## API Integration

### Supabase Edge Functions
- **AI Suggestions**: `/functions/ai-suggestions`
- **Parse User Input**: `/functions/parse-user-input`
- Serverless compute for AI processing
- Secure API key management

### External APIs (Optional)
- USDA Food Database for nutritional data
- CalorieKing API for extended food database

## State Management
- **React Query**: Server state caching and synchronization
- **Local Storage**: Temporary data and user preferences
- **Supabase Real-time**: Live data synchronization
- **Custom Hooks**: Reusable state logic

## Testing & Quality
- **TypeScript**: Compile-time type checking
- **ESLint**: Code quality and consistency
- **Zod Validation**: Runtime data validation
- **Form Validation**: react-hook-form with resolvers

## Deployment
- **Production Build**: Optimized Vite build
- **Vercel/Netlify**: Static hosting options
- **Supabase**: Managed backend infrastructure
- **CDN**: Global content delivery

## Future Enhancements
- **Continuous Glucose Monitoring (CGM)**: Direct sensor integration
- **Healthcare Provider Portal**: Data sharing capabilities
- **Advanced Analytics**: Machine learning insights
- **Medication Tracking**: Drug interaction monitoring
- **Appointment Scheduling**: Healthcare provider integration

## Contributing
This application serves as a comprehensive example of modern web application development with real-time data, AI integration, and mobile-first design principles.

## Technical Notes for AI Assistants
- All database operations use Supabase client with RLS
- Real-time features implemented via Supabase subscriptions
- AI features are rule-based, not requiring API keys for basic functionality
- Mobile responsiveness achieved through Tailwind's responsive utilities
- Component architecture follows atomic design principles
- State management combines server state (React Query) with local state (React hooks)