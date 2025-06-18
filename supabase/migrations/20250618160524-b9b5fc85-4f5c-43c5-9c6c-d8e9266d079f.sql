
-- Drop the existing table to recreate with better constraints
DROP TABLE IF EXISTS public.glucose_readings CASCADE;

-- Create ENUM for glucose reading tags
CREATE TYPE public.glucose_tag AS ENUM ('fasting', 'post-meal', 'before-sleep', 'random', 'pre-meal', 'bedtime', 'exercise');

-- Create a table for glucose readings with improved constraints
CREATE TABLE public.glucose_readings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  value DECIMAL(5,2) NOT NULL CHECK (value > 0 AND value <= 500),
  unit VARCHAR(10) NOT NULL DEFAULT 'mg/dL' CHECK (unit IN ('mg/dL', 'mmol/L')),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  tag glucose_tag,
  notes TEXT,
  source VARCHAR(20) NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'cgm', 'sensor')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security (RLS) to ensure users can only see their own readings
ALTER TABLE public.glucose_readings ENABLE ROW LEVEL SECURITY;

-- Create policy that allows users to SELECT their own readings
CREATE POLICY "Users can view their own glucose readings" 
  ON public.glucose_readings 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Create policy that allows users to INSERT their own readings
CREATE POLICY "Users can create their own glucose readings" 
  ON public.glucose_readings 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy that allows users to UPDATE their own readings
CREATE POLICY "Users can update their own glucose readings" 
  ON public.glucose_readings 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy that allows users to DELETE their own readings
CREATE POLICY "Users can delete their own glucose readings" 
  ON public.glucose_readings 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Allow service_role to bypass RLS for AI/admin functionality
CREATE POLICY "Service role can read all glucose readings"
  ON public.glucose_readings
  FOR SELECT
  USING (auth.role() = 'service_role');

-- Create an index for better query performance
CREATE INDEX idx_glucose_readings_user_timestamp ON public.glucose_readings(user_id, timestamp DESC);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_glucose_readings_updated_at 
    BEFORE UPDATE ON public.glucose_readings 
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
