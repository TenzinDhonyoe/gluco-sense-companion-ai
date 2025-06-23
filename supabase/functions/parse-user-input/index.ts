import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParsedMeal {
  type: 'meal';
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';
  meal_name: string;
  food_items: Array<{
    food_name: string;
    quantity: number;
    unit: string;
  }>;
  timestamp: string;
}

interface ParsedExercise {
  type: 'exercise';
  exercise_name: string;
  exercise_type: string;
  duration_minutes: number;
  intensity: 'low' | 'moderate' | 'high' | 'very_high';
  calories_burned?: number;
  timestamp: string;
}

interface FoodNutrients {
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  fiber: number;
}

interface USDAFood {
  food_name: string;
  serving_size_g?: number;
  calories: number;
  carbohydrates_total_g: number;
  protein_g: number;
  fat_total_g: number;
  fiber_g: number;
}

// Cache for nutrition results to ensure consistency
const nutritionCache = new Map<string, USDAFood>();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { input } = await req.json();
    console.log('Processing input:', input);

    if (!input || typeof input !== 'string') {
      throw new Error('Input is required and must be a string');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Parse input using rule-based system
    const parsedData = parseInputWithRules(input);
    console.log('Parsed data:', parsedData);

    let result;
    if (parsedData.type === 'meal') {
      result = await processMeal(parsedData, user.id, supabase);
    } else if (parsedData.type === 'exercise') {
      result = await processExercise(parsedData, user.id, supabase);
    } else {
      throw new Error('Unable to determine if input is a meal or exercise');
    }

    return new Response(JSON.stringify({ 
      success: true, 
      data: result,
      message: `Successfully logged ${parsedData.type}` 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in parse-user-input function:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function parseInputWithRules(input: string): ParsedMeal | ParsedExercise {
  const cleanInput = input.toLowerCase().trim();
  
  // Food keywords database
  const FOOD_KEYWORDS = [
    'pizza', 'burger', 'sandwich', 'salad', 'pasta', 'rice', 'chicken', 'fish', 'beef',
    'apple', 'banana', 'orange', 'bread', 'eggs', 'milk', 'cheese', 'yogurt', 'cereal',
    'soup', 'fries', 'potato', 'broccoli', 'carrots', 'spinach', 'nuts', 'cookie',
    'cake', 'ice cream', 'chocolate', 'coffee', 'tea', 'water', 'juice', 'soda'
  ];
  
  // Exercise keywords database
  const EXERCISE_KEYWORDS = [
    'walk', 'run', 'jog', 'bike', 'swim', 'gym', 'workout', 'exercise', 'yoga',
    'pilates', 'dance', 'tennis', 'soccer', 'basketball', 'football', 'baseball',
    'hiking', 'climbing', 'lifting', 'weights', 'cardio', 'strength', 'training'
  ];
  
  // Check for exercise keywords
  const hasExerciseKeywords = EXERCISE_KEYWORDS.some(keyword => cleanInput.includes(keyword));
  const hasFoodKeywords = FOOD_KEYWORDS.some(keyword => cleanInput.includes(keyword));
  
  // Extract quantities
  const quantityMatch = cleanInput.match(/(\d+)\s*(slice|slices|piece|pieces|cup|cups|bowl|bowls|min|minutes|hour|hours)?/);
  const quantity = quantityMatch ? parseInt(quantityMatch[1]) : 1;
  
  if (hasExerciseKeywords || (!hasFoodKeywords && (cleanInput.includes('min') || cleanInput.includes('hour')))) {
    // Parse as exercise
    let exerciseName = input;
    let exerciseType = 'other';
    let duration = 30; // default
    let intensity: 'low' | 'moderate' | 'high' | 'very_high' = 'moderate';
    
    // Extract duration
    if (quantityMatch && (quantityMatch[2]?.includes('min') || quantityMatch[2]?.includes('hour'))) {
      duration = quantityMatch[2]?.includes('hour') ? quantity * 60 : quantity;
    }
    
    // Determine exercise type and intensity
    if (cleanInput.includes('walk')) {
      exerciseType = 'cardio';
      intensity = 'low';
      exerciseName = 'Walking';
    } else if (cleanInput.includes('run') || cleanInput.includes('jog')) {
      exerciseType = 'cardio';
      intensity = 'high';
      exerciseName = cleanInput.includes('run') ? 'Running' : 'Jogging';
    } else if (cleanInput.includes('bike') || cleanInput.includes('cycling')) {
      exerciseType = 'cardio';
      intensity = 'moderate';
      exerciseName = 'Cycling';
    } else if (cleanInput.includes('swim')) {
      exerciseType = 'cardio';
      intensity = 'moderate';
      exerciseName = 'Swimming';
    } else if (cleanInput.includes('yoga')) {
      exerciseType = 'flexibility';
      intensity = 'low';
      exerciseName = 'Yoga';
    } else if (cleanInput.includes('weights') || cleanInput.includes('lifting')) {
      exerciseType = 'strength';
      intensity = 'moderate';
      exerciseName = 'Weight Training';
    }
    
    return {
      type: 'exercise',
      exercise_name: exerciseName,
      exercise_type: exerciseType,
      duration_minutes: duration,
      intensity,
      timestamp: new Date().toISOString()
    };
  } else {
    // Parse as meal
    const hour = new Date().getHours();
    let mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' = 'snack';
    
    if (cleanInput.includes('breakfast') || (hour >= 5 && hour < 11)) {
      mealType = 'breakfast';
    } else if (cleanInput.includes('lunch') || (hour >= 11 && hour < 16)) {
      mealType = 'lunch';
    } else if (cleanInput.includes('dinner') || (hour >= 16 && hour < 22)) {
      mealType = 'dinner';
    }
    
    // Extract food items
    const foodItems = [];
    for (const food of FOOD_KEYWORDS) {
      if (cleanInput.includes(food)) {
        foodItems.push({
          food_name: food.charAt(0).toUpperCase() + food.slice(1),
          quantity: quantity,
          unit: quantityMatch?.[2] || 'serving'
        });
        break; // Take first match for simplicity
      }
    }
    
    // If no specific food found, use the input as is
    if (foodItems.length === 0) {
      foodItems.push({
        food_name: input,
        quantity: 1,
        unit: 'serving'
      });
    }
    
    return {
      type: 'meal',
      meal_type: mealType,
      meal_name: input,
      food_items: foodItems,
      timestamp: new Date().toISOString()
    };
  }
}

async function searchUSDAFood(foodName: string): Promise<USDAFood | null> {
  // Check cache first for consistency
  const cacheKey = foodName.toLowerCase().trim();
  if (nutritionCache.has(cacheKey)) {
    console.log(`Using cached USDA data for: ${foodName}`);
    return nutritionCache.get(cacheKey)!;
  }

  const usdaApiKey = Deno.env.get('USDA_API_KEY');
  if (!usdaApiKey) {
    console.log('USDA API key not configured, skipping USDA API call');
    return null;
  }

  try {
    // USDA FoodData Central API search endpoint
    const searchUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(foodName)}&pageSize=1&api_key=${usdaApiKey}`;
    
    console.log(`Attempting USDA API call for: ${foodName}`);
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Supabase-Edge-Function/1.0',
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    console.log(`USDA API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`USDA API HTTP error for ${foodName}:`, response.status, errorText);
      return null;
    }

    const data = await response.json();
    console.log(`USDA API response structure:`, Object.keys(data));
    
    if (data.foods && data.foods.length > 0) {
      const food = data.foods[0];
      console.log(`Found USDA food: ${food.description}`);
      
      // Extract nutrients from USDA response
      const nutrients = food.foodNutrients || [];
      console.log(`Available USDA nutrients count:`, nutrients.length);
      
      const nutritionData: USDAFood = {
        food_name: food.description,
        calories: 0,
        carbohydrates_total_g: 0,
        protein_g: 0,
        fat_total_g: 0,
        fiber_g: 0,
      };

      // Extract nutrients based on nutrient IDs
      nutrients.forEach((nutrient: any) => {
        const nutrientId = nutrient.nutrientId;
        const value = nutrient.value || 0;
        
        switch (nutrientId) {
          case 1008: // Energy (kcal)
            nutritionData.calories = Math.round(value);
            break;
          case 1005: // Carbohydrate
            nutritionData.carbohydrates_total_g = Math.round(value * 100) / 100;
            break;
          case 1003: // Protein
            nutritionData.protein_g = Math.round(value * 100) / 100;
            break;
          case 1004: // Fat
            nutritionData.fat_total_g = Math.round(value * 100) / 100;
            break;
          case 1079: // Fiber
            nutritionData.fiber_g = Math.round(value * 100) / 100;
            break;
        }
      });

      console.log(`Successfully processed USDA nutrition data:`, nutritionData);

      // Cache the result for consistency
      nutritionCache.set(cacheKey, nutritionData);
      return nutritionData;
    }
    
    console.log(`No USDA data found for ${foodName}`);
    return null;
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`USDA API timeout for ${foodName}`);
    } else {
      console.error(`USDA API error for ${foodName}:`, error.message);
    }
    
    return null;
  }
}

function extractNutrients(nutritionData: USDAFood): Partial<FoodNutrients> {
  const nutrients: Partial<FoodNutrients> = {
    calories: nutritionData.calories || 0,
    carbs: nutritionData.carbohydrates_total_g || 0,
    protein: nutritionData.protein_g || 0,
    fat: nutritionData.fat_total_g || 0,
    fiber: nutritionData.fiber_g || 0,
  };

  console.log(`Extracted nutrients from USDA data:`, nutrients);
  return nutrients;
}

function getFallbackNutrients(partialData?: Partial<FoodNutrients>): FoodNutrients {
  const fallbackNutrients: FoodNutrients = {
    calories: 100,
    carbs: 15,
    protein: 3,
    fat: 2,
    fiber: 1,
  };

  // Use any partial API data we have
  if (partialData) {
    Object.keys(partialData).forEach(key => {
      if (partialData[key] !== null && partialData[key] !== undefined) {
        fallbackNutrients[key] = partialData[key];
      }
    });
  }

  console.log(`Using fallback nutrients:`, fallbackNutrients);
  return fallbackNutrients;
}

async function processMeal(parsedMeal: ParsedMeal, userId: string, supabase: any) {
  console.log('Processing meal:', parsedMeal.meal_name);

  // Create meal record
  const { data: meal, error: mealError } = await supabase
    .from('meals')
    .insert({
      user_id: userId,
      meal_type: parsedMeal.meal_type,
      meal_name: parsedMeal.meal_name,
      timestamp: new Date().toISOString(),
    })
    .select()
    .single();

  if (mealError) {
    throw new Error(`Failed to create meal: ${mealError.message}`);
  }

  console.log('Created meal:', meal.id);

  // Process each food item with complete nutrition data
  const foodItems = [];
  let totalCalories = 0;
  let totalCarbs = 0;
  let totalProtein = 0;
  let totalFat = 0;
  let totalFiber = 0;

  for (const item of parsedMeal.food_items) {
    console.log(`Processing food item: ${item.food_name} (${item.quantity} ${item.unit})`);
    
    // Try to get nutrition data from USDA
    const nutritionData = await searchUSDAFood(item.food_name);
    let partialNutrients: Partial<FoodNutrients> = {};
    
    if (nutritionData) {
      partialNutrients = extractNutrients(nutritionData);
      console.log(`Using USDA data for ${item.food_name}:`, partialNutrients);
    } else {
      console.log(`USDA data unavailable for ${item.food_name}, using fallback estimates`);
    }

    // Get complete nutrients (USDA + fallback for missing values)
    const completeNutrients = getFallbackNutrients(partialNutrients);

    console.log(`Final nutrients for ${item.food_name}:`, completeNutrients);

    // Insert food item with complete nutrition data
    const foodItemData = {
      meal_id: meal.id,
      food_name: item.food_name,
      quantity: item.quantity,
      unit: item.unit,
      calories_per_unit: completeNutrients.calories,
      carbs_per_unit: completeNutrients.carbs,
      protein_per_unit: completeNutrients.protein,
      fat_per_unit: completeNutrients.fat,
      fiber_per_unit: completeNutrients.fiber,
    };

    const { data: foodItem, error: foodError } = await supabase
      .from('food_items')
      .insert(foodItemData)
      .select()
      .single();

    if (foodError) {
      console.error(`Failed to create food item: ${foodError.message}`);
      continue;
    }

    foodItems.push(foodItem);

    // Accumulate totals
    totalCalories += completeNutrients.calories * item.quantity;
    totalCarbs += completeNutrients.carbs * item.quantity;
    totalProtein += completeNutrients.protein * item.quantity;
    totalFat += completeNutrients.fat * item.quantity;
    totalFiber += completeNutrients.fiber * item.quantity;
  }

  // Update meal with calculated totals
  const { error: updateError } = await supabase
    .from('meals')
    .update({
      total_calories: Math.round(totalCalories),
      total_carbs: Math.round(totalCarbs * 100) / 100,
      total_protein: Math.round(totalProtein * 100) / 100,
      total_fat: Math.round(totalFat * 100) / 100,
      total_fiber: Math.round(totalFiber * 100) / 100,
    })
    .eq('id', meal.id);

  if (updateError) {
    console.error('Failed to update meal totals:', updateError.message);
  }

  console.log(`Meal processed successfully. Total calories: ${Math.round(totalCalories)}`);

  // Try to link with glucose readings (±2 hours)
  await linkGlucoseReadings(meal.timestamp, userId, 'meal', meal.id, supabase);

  return {
    meal,
    food_items: foodItems,
    totals: {
      calories: Math.round(totalCalories),
      carbs: Math.round(totalCarbs * 100) / 100,
      protein: Math.round(totalProtein * 100) / 100,
      fat: Math.round(totalFat * 100) / 100,
      fiber: Math.round(totalFiber * 100) / 100,
    }
  };
}

async function processExercise(parsedExercise: ParsedExercise, userId: string, supabase: any) {
  console.log('Processing exercise:', parsedExercise.exercise_name);

  // Simple calorie estimation based on exercise type and duration
  let caloriesBurned = parsedExercise.calories_burned;
  if (!caloriesBurned || caloriesBurned <= 0) {
    const baseRates = {
      'low': 4,
      'moderate': 6,
      'high': 8,
      'very_high': 10
    };
    const rate = baseRates[parsedExercise.intensity] || 6;
    caloriesBurned = Math.round(rate * parsedExercise.duration_minutes);
  }

  const exerciseData = {
    user_id: userId,
    exercise_name: parsedExercise.exercise_name,
    exercise_type: parsedExercise.exercise_type,
    duration_minutes: parsedExercise.duration_minutes,
    intensity: parsedExercise.intensity,
    calories_burned: caloriesBurned,
    timestamp: new Date().toISOString(),
  };

  const { data: exercise, error: exerciseError } = await supabase
    .from('exercises')
    .insert(exerciseData)  
    .select()
    .single();

  if (exerciseError) {
    throw new Error(`Failed to create exercise: ${exerciseError.message}`);
  }

  console.log('Exercise processed successfully:', exercise.id);

  // Try to link with glucose readings (±2 hours)
  await linkGlucoseReadings(exercise.timestamp, userId, 'exercise', exercise.id, supabase);

  return exercise;
}

async function linkGlucoseReadings(eventTimestamp: string, userId: string, eventType: string, eventId: string, supabase: any) {
  try {
    const eventTime = new Date(eventTimestamp);
    const twoHoursBefore = new Date(eventTime.getTime() - (2 * 60 * 60 * 1000));
    const twoHoursAfter = new Date(eventTime.getTime() + (2 * 60 * 60 * 1000));

    // Find glucose readings within ±2 hours
    const { data: glucoseReadings, error } = await supabase
      .from('glucose_readings')
      .select('id, timestamp')
      .eq('user_id', userId)
      .gte('timestamp', twoHoursBefore.toISOString())
      .lte('timestamp', twoHoursAfter.toISOString());

    if (error) {
      console.error('Error finding glucose readings:', error);
      return;
    }

    if (!glucoseReadings || glucoseReadings.length === 0) {
      console.log(`No glucose readings found within ±2 hours of ${eventType}`);
      return;
    }

    // Insert glucose events
    const glucoseEvents = glucoseReadings.map(reading => ({
      user_id: userId,
      glucose_reading_id: reading.id,
      event_type: eventType,
      event_id: eventId,
      time_relative_to_event: Math.round((new Date(reading.timestamp).getTime() - eventTime.getTime()) / (1000 * 60)), // minutes
    }));

    const { error: insertError } = await supabase
      .from('glucose_events')
      .insert(glucoseEvents);

    if (insertError) {
      console.error('Error linking glucose readings:', insertError);
    } else {
      console.log(`Linked ${glucoseEvents.length} glucose readings to ${eventType}`);
    }
  } catch (error) {
    console.error('Error in linkGlucoseReadings:', error);
  }
}
