
-- Enable RLS on all tables (if not already enabled)
ALTER TABLE public.glucose_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.food_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glucose_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for glucose_readings (if not exist)
DROP POLICY IF EXISTS "Users can view their own glucose readings" ON public.glucose_readings;
DROP POLICY IF EXISTS "Users can create their own glucose readings" ON public.glucose_readings;
DROP POLICY IF EXISTS "Users can update their own glucose readings" ON public.glucose_readings;
DROP POLICY IF EXISTS "Users can delete their own glucose readings" ON public.glucose_readings;

CREATE POLICY "Users can view their own glucose readings" 
  ON public.glucose_readings 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own glucose readings" 
  ON public.glucose_readings 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own glucose readings" 
  ON public.glucose_readings 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own glucose readings" 
  ON public.glucose_readings 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create RLS policies for meals
DROP POLICY IF EXISTS "Users can view their own meals" ON public.meals;
DROP POLICY IF EXISTS "Users can create their own meals" ON public.meals;
DROP POLICY IF EXISTS "Users can update their own meals" ON public.meals;
DROP POLICY IF EXISTS "Users can delete their own meals" ON public.meals;

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

-- Create RLS policies for exercises
DROP POLICY IF EXISTS "Users can view their own exercises" ON public.exercises;
DROP POLICY IF EXISTS "Users can create their own exercises" ON public.exercises;
DROP POLICY IF EXISTS "Users can update their own exercises" ON public.exercises;
DROP POLICY IF EXISTS "Users can delete their own exercises" ON public.exercises;

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

-- Create RLS policies for food_items (linked through meals)
DROP POLICY IF EXISTS "Users can view their own food items" ON public.food_items;
DROP POLICY IF EXISTS "Users can create their own food items" ON public.food_items;
DROP POLICY IF EXISTS "Users can update their own food items" ON public.food_items;
DROP POLICY IF EXISTS "Users can delete their own food items" ON public.food_items;

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

-- Create RLS policies for glucose_events
DROP POLICY IF EXISTS "Users can view their own glucose events" ON public.glucose_events;
DROP POLICY IF EXISTS "Users can create their own glucose events" ON public.glucose_events;
DROP POLICY IF EXISTS "Users can update their own glucose events" ON public.glucose_events;
DROP POLICY IF EXISTS "Users can delete their own glucose events" ON public.glucose_events;

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
