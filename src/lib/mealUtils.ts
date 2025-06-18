
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type MealType = Database["public"]["Enums"]["meal_type"];
export type FoodCategory = Database["public"]["Enums"]["food_category"];

export const mealTypes: { value: MealType; label: string }[] = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' },
  { value: 'other', label: 'Other' },
];

export const foodCategories: { value: FoodCategory; label: string }[] = [
  { value: 'grains', label: 'Grains' },
  { value: 'vegetables', label: 'Vegetables' },
  { value: 'fruits', label: 'Fruits' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'protein', label: 'Protein' },
  { value: 'fats', label: 'Fats' },
  { value: 'sweets', label: 'Sweets' },
  { value: 'beverages', label: 'Beverages' },
  { value: 'processed', label: 'Processed Foods' },
  { value: 'fast_food', label: 'Fast Food' },
  { value: 'other', label: 'Other' },
];

export interface MealData {
  meal_type: MealType;
  meal_name: string;
  timestamp?: string;
  total_carbs?: number;
  total_calories?: number;
  total_protein?: number;
  total_fat?: number;
  total_fiber?: number;
  glycemic_index?: number;
  notes?: string;
  photo_url?: string;
}

export interface FoodItemData {
  food_name: string;
  quantity: number;
  unit?: string;
  carbs_per_unit?: number;
  calories_per_unit?: number;
  protein_per_unit?: number;
  fat_per_unit?: number;
  fiber_per_unit?: number;
  category?: FoodCategory;
  brand?: string;
  barcode?: string;
}

export const logMeal = async (mealData: MealData, foodItems: FoodItemData[] = []) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  // Insert meal
  const { data: meal, error: mealError } = await supabase
    .from('meals')
    .insert({
      user_id: user.id,
      ...mealData,
    })
    .select()
    .single();

  if (mealError) throw mealError;

  // Insert food items if provided
  if (foodItems.length > 0) {
    const { error: itemsError } = await supabase
      .from('food_items')
      .insert(
        foodItems.map(item => ({
          meal_id: meal.id,
          ...item,
        }))
      );

    if (itemsError) throw itemsError;
  }

  return meal;
};

export const getMeals = async (limit = 50) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');

  const { data, error } = await supabase
    .from('meals')
    .select(`
      *,
      food_items (*)
    `)
    .eq('user_id', user.id)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
};
