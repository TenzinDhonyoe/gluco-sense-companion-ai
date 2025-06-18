
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type ExerciseIntensity = Database["public"]["Enums"]["exercise_intensity"];

export const exerciseIntensities: { value: ExerciseIntensity; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'text-green-600' },
  { value: 'moderate', label: 'Moderate', color: 'text-yellow-600' },
  { value: 'high', label: 'High', color: 'text-orange-600' },
  { value: 'very_high', label: 'Very High', color: 'text-red-600' },
];

export const exerciseTypes = [
  'Cardio',
  'Strength Training',
  'Flexibility',
  'Sports',
  'Walking',
  'Running',
  'Cycling',
  'Swimming',
  'Yoga',
  'Pilates',
  'Other',
];

export interface ExerciseData {
  exercise_name: string;
  exercise_type: string;
  duration_minutes: number;
  intensity: ExerciseIntensity;
  calories_burned?: number;
  average_heart_rate?: number;
  max_heart_rate?: number;
  timestamp?: string;
  notes?: string;
}

export const logExercise = async (exerciseData: ExerciseData) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('exercises')
    .insert({
      user_id: user.id,
      ...exerciseData,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getExercises = async (limit = 50) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .eq('user_id', user.id)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
};

export const getIntensityColor = (intensity: ExerciseIntensity): string => {
  return exerciseIntensities.find(i => i.value === intensity)?.color || 'text-gray-600';
};
