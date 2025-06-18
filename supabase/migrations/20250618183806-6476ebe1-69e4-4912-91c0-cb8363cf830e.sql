
-- Create ENUM for exercise intensity levels
CREATE TYPE public.exercise_intensity AS ENUM ('low', 'moderate', 'high', 'very_high');

-- Create ENUM for meal types
CREATE TYPE public.meal_type AS ENUM ('breakfast', 'lunch', 'dinner', 'snack', 'other');

-- Create ENUM for food categories for better AI analysis
CREATE TYPE public.food_category AS ENUM (
  'grains', 'vegetables', 'fruits', 'dairy', 'protein', 'fats', 
  'sweets', 'beverages', 'processed', 'fast_food', 'other'
);

-- Update glucose_readings table to support sensor data better
ALTER TABLE public.glucose_readings 
ADD COLUMN IF NOT EXISTS is_sensor_reading BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS sensor_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS calibration_offset DECIMAL(4,2) DEFAULT 0.0,
ADD COLUMN IF NOT EXISTS data_quality_score INTEGER CHECK (data_quality_score IS NULL OR (data_quality_score >= 0 AND data_quality_score <= 100));

-- Create meals table for food logging (with nullable optional fields)
CREATE TABLE public.meals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  meal_type meal_type NOT NULL,
  meal_name VARCHAR(255) NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  total_carbs DECIMAL(6,2) CHECK (total_carbs IS NULL OR total_carbs >= 0),
  total_calories INTEGER CHECK (total_calories IS NULL OR total_calories >= 0),
  total_protein DECIMAL(6,2) CHECK (total_protein IS NULL OR total_protein >= 0),
  total_fat DECIMAL(6,2) CHECK (total_fat IS NULL OR total_fat >= 0),
  total_fiber DECIMAL(6,2) CHECK (total_fiber IS NULL OR total_fiber >= 0),
  glycemic_index INTEGER CHECK (glycemic_index IS NULL OR (glycemic_index >= 0 AND glycemic_index <= 100)),
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create food_items table for detailed food tracking (with nullable optional fields)
CREATE TABLE public.food_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_id UUID REFERENCES public.meals(id) ON DELETE CASCADE NOT NULL,
  food_name VARCHAR(255) NOT NULL,
  quantity DECIMAL(8,2) NOT NULL CHECK (quantity > 0),
  unit VARCHAR(50) NOT NULL DEFAULT 'grams',
  carbs_per_unit DECIMAL(6,2) CHECK (carbs_per_unit IS NULL OR carbs_per_unit >= 0),
  calories_per_unit INTEGER CHECK (calories_per_unit IS NULL OR calories_per_unit >= 0),
  protein_per_unit DECIMAL(6,2) CHECK (protein_per_unit IS NULL OR protein_per_unit >= 0),
  fat_per_unit DECIMAL(6,2) CHECK (fat_per_unit IS NULL OR fat_per_unit >= 0),
  fiber_per_unit DECIMAL(6,2) CHECK (fiber_per_unit IS NULL OR fiber_per_unit >= 0),
  category food_category DEFAULT 'other',
  brand VARCHAR(255),
  barcode VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create exercises table for workout/activity logging (with nullable optional fields)
CREATE TABLE public.exercises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  exercise_name VARCHAR(255) NOT NULL,
  exercise_type VARCHAR(100) NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  intensity exercise_intensity NOT NULL,
  calories_burned INTEGER CHECK (calories_burned IS NULL OR calories_burned >= 0),
  average_heart_rate INTEGER CHECK (average_heart_rate IS NULL OR (average_heart_rate >= 0 AND average_heart_rate <= 250)),
  max_heart_rate INTEGER CHECK (max_heart_rate IS NULL OR (max_heart_rate >= 0 AND max_heart_rate <= 250)),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create glucose_events table for linking glucose readings to events
CREATE TABLE public.glucose_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  glucose_reading_id UUID REFERENCES public.glucose_readings(id) ON DELETE CASCADE NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  event_id UUID,
  time_relative_to_event INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all new tables
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glucose_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for meals table
CREATE POLICY "Users can view their own meals" 
  ON public.meals 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own meals" 
  ON public.meals 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meals" 
  ON public.meals 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meals" 
  ON public.meals 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create RLS policies for food_items table
CREATE POLICY "Users can view their own food items" 
  ON public.food_items 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.meals 
    WHERE meals.id = food_items.meal_id 
    AND meals.user_id = auth.uid()
  ));

CREATE POLICY "Users can create their own food items" 
  ON public.food_items 
  FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.meals 
    WHERE meals.id = food_items.meal_id 
    AND meals.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own food items" 
  ON public.food_items 
  FOR UPDATE 
  USING (EXISTS (
    SELECT 1 FROM public.meals 
    WHERE meals.id = food_items.meal_id 
    AND meals.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete their own food items" 
  ON public.food_items 
  FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM public.meals 
    WHERE meals.id = food_items.meal_id 
    AND meals.user_id = auth.uid()
  ));

-- Create RLS policies for exercises table
CREATE POLICY "Users can view their own exercises" 
  ON public.exercises 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own exercises" 
  ON public.exercises 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own exercises" 
  ON public.exercises 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exercises" 
  ON public.exercises 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create RLS policies for glucose_events table
CREATE POLICY "Users can view their own glucose events" 
  ON public.glucose_events 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own glucose events" 
  ON public.glucose_events 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own glucose events" 
  ON public.glucose_events 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own glucose events" 
  ON public.glucose_events 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create indexes for better query performance
CREATE INDEX idx_meals_user_timestamp ON public.meals(user_id, timestamp DESC);
CREATE INDEX idx_meals_type_timestamp ON public.meals(meal_type, timestamp DESC);
CREATE INDEX idx_food_items_meal_id ON public.food_items(meal_id);
CREATE INDEX idx_food_items_category ON public.food_items(category);
CREATE INDEX idx_exercises_user_timestamp ON public.exercises(user_id, timestamp DESC);
CREATE INDEX idx_exercises_type_intensity ON public.exercises(exercise_type, intensity);
CREATE INDEX idx_glucose_events_user_glucose ON public.glucose_events(user_id, glucose_reading_id);
CREATE INDEX idx_glucose_events_type_event ON public.glucose_events(event_type, event_id);
CREATE INDEX idx_glucose_readings_sensor ON public.glucose_readings(user_id, is_sensor_reading, timestamp DESC);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_meals_updated_at 
  BEFORE UPDATE ON public.meals 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exercises_updated_at 
  BEFORE UPDATE ON public.exercises 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create a function to automatically log glucose context when meals or exercises are created
CREATE OR REPLACE FUNCTION public.auto_log_glucose_context()
RETURNS TRIGGER AS $$
BEGIN
  -- Find glucose readings within 2 hours before and after the event
  INSERT INTO public.glucose_events (user_id, glucose_reading_id, event_type, event_id, time_relative_to_event)
  SELECT 
    NEW.user_id,
    gr.id,
    CASE 
      WHEN TG_TABLE_NAME = 'meals' THEN 'meal'
      WHEN TG_TABLE_NAME = 'exercises' THEN 'exercise'
    END,
    NEW.id,
    EXTRACT(EPOCH FROM (gr.timestamp - NEW.timestamp)) / 60
  FROM public.glucose_readings gr
  WHERE gr.user_id = NEW.user_id
    AND gr.timestamp BETWEEN (NEW.timestamp - INTERVAL '2 hours') 
                         AND (NEW.timestamp + INTERVAL '2 hours')
    AND ABS(EXTRACT(EPOCH FROM (gr.timestamp - NEW.timestamp)) / 60) <= 120;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically link glucose readings to events
CREATE TRIGGER auto_link_meal_glucose
  AFTER INSERT ON public.meals
  FOR EACH ROW EXECUTE FUNCTION public.auto_log_glucose_context();

CREATE TRIGGER auto_link_exercise_glucose
  AFTER INSERT ON public.exercises
  FOR EACH ROW EXECUTE FUNCTION public.auto_log_glucose_context();
