
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

interface USDAFood {
  fdcId: number;
  description: string;
  foodNutrients: Array<{
    nutrient: {
      id: number;
      name: string;
      unitName: string;
    };
    amount: number;
  }>;
}

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

    // Parse input using OpenRouter AI
    const parsedData = await parseInputWithAI(input);
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

async function parseInputWithAI(input: string): Promise<ParsedMeal | ParsedExercise> {
  const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!openRouterApiKey) {
    throw new Error('OpenRouter API key not configured');
  }

  const prompt = `Parse the following user input into structured JSON data. Determine if it's describing a meal or exercise activity.

For MEALS, return JSON in this format:
{
  "type": "meal",
  "meal_type": "breakfast|lunch|dinner|snack|other",
  "meal_name": "descriptive name",
  "food_items": [
    {
      "food_name": "standardized food name",
      "quantity": number,
      "unit": "slices|cups|grams|ounces|pieces|cans|etc"
    }
  ],
  "timestamp": "now"
}

For EXERCISES, return JSON in this format:
{
  "type": "exercise", 
  "exercise_name": "standardized exercise name",
  "exercise_type": "cardio|strength|flexibility|sports|walking|running|cycling|swimming|yoga|other",
  "duration_minutes": number,
  "intensity": "low|moderate|high|very_high",
  "calories_burned": estimated_calories_or_null,
  "timestamp": "now"
}

User input: "${input}"

Return only valid JSON, no explanations:`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openRouterApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'mistralai/mistral-7b-instruct:free',
      messages: [
        { role: 'system', content: 'You are a nutrition and fitness expert. Parse user input into structured JSON data. Always return valid JSON only.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.1,
      max_tokens: 1000,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content.trim();
  
  try {
    return JSON.parse(content);
  } catch (parseError) {
    console.error('Failed to parse AI response:', content);
    throw new Error('AI returned invalid JSON');
  }
}

async function searchUSDAFood(foodName: string): Promise<USDAFood | null> {
  try {
    const searchUrl = `https://api.nal.usda.gov/fdc/v1/foods/search?query=${encodeURIComponent(foodName)}&pageSize=1&dataType=Survey%20%28FNDDS%29`;
    
    const response = await fetch(searchUrl, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      console.error(`USDA API error for ${foodName}:`, response.status);
      return null;
    }

    const data = await response.json();
    
    if (data.foods && data.foods.length > 0) {
      const food = data.foods[0];
      console.log(`Found USDA food for ${foodName}:`, food.description);
      return food;
    }
    
    return null;
  } catch (error) {
    console.error(`Error searching USDA for ${foodName}:`, error);
    return null;
  }
}

function extractNutrients(usdaFood: USDAFood) {
  const nutrients = {
    calories: 0,
    carbs: 0,
    protein: 0,
    fat: 0,
    fiber: 0,
  };

  for (const nutrient of usdaFood.foodNutrients) {
    const name = nutrient.nutrient.name.toLowerCase();
    const amount = nutrient.amount || 0;

    if (name.includes('energy') && nutrient.nutrient.unitName === 'KCAL') {
      nutrients.calories = amount;
    } else if (name.includes('carbohydrate')) {
      nutrients.carbs = amount;
    } else if (name.includes('protein')) {
      nutrients.protein = amount;
    } else if (name.includes('total lipid') || name.includes('fat')) {
      nutrients.fat = amount;
    } else if (name.includes('fiber')) {
      nutrients.fiber = amount;
    }
  }

  return nutrients;
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

  // Process each food item
  const foodItems = [];
  let totalCalories = 0;
  let totalCarbs = 0;
  let totalProtein = 0;
  let totalFat = 0;
  let totalFiber = 0;

  for (const item of parsedMeal.food_items) {
    console.log(`Processing food item: ${item.food_name}`);
    
    // Search USDA database
    const usdaFood = await searchUSDAFood(item.food_name);
    let nutrients = null;
    
    if (usdaFood) {
      nutrients = extractNutrients(usdaFood);
      console.log(`Found nutrients for ${item.food_name}:`, nutrients);
    } else {
      console.log(`No USDA data found for ${item.food_name}`);
    }

    // Insert food item
    const foodItemData = {
      meal_id: meal.id,
      food_name: item.food_name,
      quantity: item.quantity,
      unit: item.unit,
      calories_per_unit: nutrients?.calories || null,
      carbs_per_unit: nutrients?.carbs || null,
      protein_per_unit: nutrients?.protein || null,
      fat_per_unit: nutrients?.fat || null,
      fiber_per_unit: nutrients?.fiber || null,
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
    if (nutrients) {
      totalCalories += (nutrients.calories || 0) * item.quantity;
      totalCarbs += (nutrients.carbs || 0) * item.quantity;
      totalProtein += (nutrients.protein || 0) * item.quantity;
      totalFat += (nutrients.fat || 0) * item.quantity;
      totalFiber += (nutrients.fiber || 0) * item.quantity;
    }
  }

  // Update meal with totals
  const { error: updateError } = await supabase
    .from('meals')
    .update({
      total_calories: Math.round(totalCalories) || null,
      total_carbs: Math.round(totalCarbs * 100) / 100 || null,
      total_protein: Math.round(totalProtein * 100) / 100 || null,
      total_fat: Math.round(totalFat * 100) / 100 || null,
      total_fiber: Math.round(totalFiber * 100) / 100 || null,
    })
    .eq('id', meal.id);

  if (updateError) {
    console.error('Failed to update meal totals:', updateError.message);
  }

  console.log(`Meal processed successfully. Total calories: ${totalCalories}`);

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

  const exerciseData = {
    user_id: userId,
    exercise_name: parsedExercise.exercise_name,
    exercise_type: parsedExercise.exercise_type,
    duration_minutes: parsedExercise.duration_minutes,
    intensity: parsedExercise.intensity,
    calories_burned: parsedExercise.calories_burned || null,
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
  return exercise;
}
