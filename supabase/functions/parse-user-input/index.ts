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

interface CalorieKingFood {
  food_name: string;
  serving_size_g?: number;
  calories: number;
  carbohydrates_total_g: number;
  protein_g: number;
  fat_total_g: number;
  fiber_g: number;
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
const nutritionCache = new Map<string, CalorieKingFood | USDAFood>();

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
      "food_name": "standardized food name (be consistent with naming)",
      "quantity": number,
      "unit": "slices|cups|grams|ounces|pieces|cans|medium|large|small|etc"
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

IMPORTANT: For food names, be consistent. For example:
- "mcdonalds fries" or "mcdonald french fries" should always become "McDonald's French Fries"
- Use standardized brand names and food descriptions

User input: "${input}"

Return only valid JSON, no explanations:`;

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openRouterApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [
        { role: 'system', content: 'You are a nutrition and fitness expert. Parse user input into structured JSON data with consistent food naming. Always return valid JSON only.' },
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

async function searchCalorieKingFood(foodName: string): Promise<CalorieKingFood | null> {
  // Check cache first for consistency
  const cacheKey = foodName.toLowerCase().trim();
  if (nutritionCache.has(cacheKey)) {
    console.log(`Using cached data for: ${foodName}`);
    return nutritionCache.get(cacheKey)! as CalorieKingFood;
  }

  const calorieKingApiKey = Deno.env.get('CALORIEKING_API_KEY');
  if (!calorieKingApiKey) {
    console.log('CalorieKing API key not configured, skipping CalorieKing API call');
    return null;
  }

  try {
    // Use the correct CalorieKing API endpoint format from documentation
    const searchParams = new URLSearchParams();
    searchParams.append('region', 'us');
    searchParams.append('query', foodName);
    searchParams.append('limit', '1');
    searchParams.append('fields', '$detailed');
    
    const searchUrl = `https://api.calorieking.com/foods?${searchParams.toString()}`;
    
    console.log(`Attempting CalorieKing API call for: ${foodName}`);
    console.log(`Request URL: ${searchUrl}`);
    
    // Create basic auth header - access token as username, empty password
    const authHeader = `Basic ${btoa(calorieKingApiKey + ':')}`;
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    const response = await fetch(searchUrl, {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Accept': 'application/json',
        'User-Agent': 'Supabase-Edge-Function/1.0',
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);
    console.log(`CalorieKing API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`CalorieKing API HTTP error for ${foodName}:`, response.status, errorText);
      throw new Error(`CalorieKing API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`CalorieKing API response structure:`, Object.keys(data));
    
    if (data.foods && data.foods.length > 0) {
      const food = data.foods[0];
      console.log(`Found CalorieKing food: ${food.name}`);
      
      // Extract nutrients from the CalorieKing response
      const nutrients = food.nutrients || {};
      console.log(`Available nutrients:`, Object.keys(nutrients));
      
      // Convert energy from kJ to calories (1 kJ = 0.239006 calories)
      const calories = nutrients.energy ? Math.round(nutrients.energy * 0.239006) : 0;
      
      const nutritionData: CalorieKingFood = {
        food_name: food.name,
        serving_size_g: food.mass || undefined,
        calories: calories,
        carbohydrates_total_g: nutrients.totalCarbs || 0,
        protein_g: nutrients.protein || 0,
        fat_total_g: nutrients.fat || 0,
        fiber_g: nutrients.fiber || 0,
      };

      console.log(`Successfully processed CalorieKing nutrition data:`, nutritionData);

      // Cache the result for consistency
      nutritionCache.set(cacheKey, nutritionData);
      return nutritionData;
    }
    
    console.log(`No CalorieKing data found for ${foodName}`);
    throw new Error('No CalorieKing data found');
    
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`CalorieKing API timeout for ${foodName}`);
    } else {
      console.error(`CalorieKing API error for ${foodName}:`, error.message);
    }
    
    // Throw error to trigger USDA fallback
    throw error;
  }
}

async function searchUSDAFood(foodName: string): Promise<USDAFood | null> {
  // Check cache first for consistency
  const cacheKey = `usda_${foodName.toLowerCase().trim()}`;
  if (nutritionCache.has(cacheKey)) {
    console.log(`Using cached USDA data for: ${foodName}`);
    return nutritionCache.get(cacheKey)! as USDAFood;
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
      
      // Map USDA nutrient IDs to our structure
      const nutrientMap = {
        1008: 'calories',      // Energy (kcal)
        1005: 'carbs',         // Carbohydrate, by difference
        1003: 'protein',       // Protein
        1004: 'fat',           // Total lipid (fat)
        1079: 'fiber',         // Fiber, total dietary
      };
      
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

async function searchNutritionData(foodName: string): Promise<CalorieKingFood | USDAFood | null> {
  console.log(`Starting nutrition search for: ${foodName}`);
  
  try {
    // Try CalorieKing first
    const calorieKingData = await searchCalorieKingFood(foodName);
    if (calorieKingData) {
      console.log(`Successfully found CalorieKing data for: ${foodName}`);
      return calorieKingData;
    }
  } catch (error) {
    console.log(`CalorieKing failed for ${foodName}, trying USDA fallback`);
  }
  
  try {
    // Fallback to USDA
    const usdaData = await searchUSDAFood(foodName);
    if (usdaData) {
      console.log(`Successfully found USDA data for: ${foodName}`);
      return usdaData;
    }
  } catch (error) {
    console.error(`USDA also failed for ${foodName}:`, error.message);
  }
  
  console.log(`No nutrition data found from any source for: ${foodName}`);
  return null;
}

function extractNutrients(nutritionData: CalorieKingFood | USDAFood): Partial<FoodNutrients> {
  const nutrients: Partial<FoodNutrients> = {
    calories: nutritionData.calories || 0,
    carbs: nutritionData.carbohydrates_total_g || 0,
    protein: nutritionData.protein_g || 0,
    fat: nutritionData.fat_total_g || 0,
    fiber: nutritionData.fiber_g || 0,
  };

  console.log(`Extracted nutrients from API data:`, nutrients);
  return nutrients;
}

async function estimateNutrientsWithAI(foodName: string, quantity: number, unit: string, partialData?: Partial<FoodNutrients>): Promise<FoodNutrients> {
  const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!openRouterApiKey) {
    console.log('OpenRouter API key not configured, using fallback estimates');
    return getFallbackNutrients(partialData);
  }

  const hasPartialData = partialData && Object.keys(partialData).length > 0;
  const prompt = hasPartialData 
    ? `You have partial nutrition data for "${foodName}" per ${unit}: ${JSON.stringify(partialData)}

Fill in ALL missing nutrition values to complete the data. Be realistic and conservative with estimates based on typical foods.

Return ONLY this JSON format with ALL values filled:
{
  "calories": ${partialData.calories || 'estimated_number'},
  "carbs": ${partialData.carbs || 'estimated_grams'},
  "protein": ${partialData.protein || 'estimated_grams'},
  "fat": ${partialData.fat || 'estimated_grams'},
  "fiber": ${partialData.fiber || 'estimated_grams'}
}`
    : `As a nutrition expert, provide complete and accurate nutritional values per ${unit} for "${foodName}".

Use your extensive knowledge of food composition, USDA data, and nutrition databases to provide the most accurate estimates possible.

Consider:
- Brand variations (if applicable)
- Typical preparation methods
- Standard serving sizes
- Nutritional density of similar foods

Return ONLY this JSON format with realistic values:
{
  "calories": estimated_number,
  "carbs": estimated_grams,
  "protein": estimated_grams,
  "fat": estimated_grams,
  "fiber": estimated_grams
}

Be precise and conservative with estimates. Base your response on established nutritional data.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          { role: 'system', content: 'You are a professional nutritionist and dietitian with extensive knowledge of food composition databases, USDA nutritional data, and food science. Provide accurate, evidence-based nutritional estimates. Return only valid JSON with all required numeric values.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error(`AI estimation failed: ${response.status}`);
      return getFallbackNutrients(partialData);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    
    // Clean up the response to extract just the JSON
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : content;
    
    const estimated = JSON.parse(jsonString);
    console.log(`AI estimated nutrients for ${foodName}:`, estimated);
    
    // Ensure all required fields are present and numeric
    const completeNutrients: FoodNutrients = {
      calories: Number(estimated.calories) || 100,
      carbs: Number(estimated.carbs) || 15,
      protein: Number(estimated.protein) || 3,
      fat: Number(estimated.fat) || 2,
      fiber: Number(estimated.fiber) || 1,
    };

    // Merge with partial API data, preferring API data when available
    if (partialData) {
      Object.keys(partialData).forEach(key => {
        if (partialData[key] !== null && partialData[key] !== undefined) {
          completeNutrients[key] = partialData[key];
        }
      });
    }

    console.log(`Final complete nutrients for ${foodName}:`, completeNutrients);
    return completeNutrients;
    
  } catch (error) {
    console.error(`Error estimating nutrients for ${foodName}:`, error);
    return getFallbackNutrients(partialData);
  }
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
    
    // Step 1: Try to get nutrition data from CalorieKing or USDA
    const nutritionData = await searchNutritionData(item.food_name);
    let partialNutrients: Partial<FoodNutrients> = {};
    
    if (nutritionData) {
      partialNutrients = extractNutrients(nutritionData);
      console.log(`Using API data for ${item.food_name}:`, partialNutrients);
    } else {
      console.log(`API data unavailable for ${item.food_name}, using AI estimation only`);
    }

    // Step 2: Get complete nutrients (API + AI estimation for missing values)
    const completeNutrients = await estimateNutrientsWithAI(
      item.food_name,
      item.quantity,
      item.unit,
      partialNutrients
    );

    console.log(`Final nutrients for ${item.food_name}:`, completeNutrients);

    // Step 3: Insert food item with complete nutrition data
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

    // Step 4: Accumulate totals
    totalCalories += completeNutrients.calories * item.quantity;
    totalCarbs += completeNutrients.carbs * item.quantity;
    totalProtein += completeNutrients.protein * item.quantity;
    totalFat += completeNutrients.fat * item.quantity;
    totalFiber += completeNutrients.fiber * item.quantity;
  }

  // Step 5: Update meal with calculated totals
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

  // Step 6: Try to link with glucose readings (±2 hours)
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

  // Estimate calories burned if not provided by AI parsing
  let caloriesBurned = parsedExercise.calories_burned;
  if (!caloriesBurned || caloriesBurned <= 0) {
    caloriesBurned = await estimateCaloriesBurnedWithAI(
      parsedExercise.exercise_name,
      parsedExercise.exercise_type,
      parsedExercise.duration_minutes,
      parsedExercise.intensity
    );
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

async function estimateCaloriesBurnedWithAI(
  exerciseName: string,
  exerciseType: string,
  durationMinutes: number,
  intensity: string
): Promise<number> {
  const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!openRouterApiKey) {
    // Enhanced fallback calculation
    const baseRates = {
      'low': 4,
      'moderate': 6,
      'high': 8,
      'very_high': 10
    };
    const rate = baseRates[intensity] || 6;
    return Math.round(rate * durationMinutes);
  }

  const prompt = `Estimate calories burned for this exercise for an average adult (70kg/154lbs):

Exercise: ${exerciseName}
Type: ${exerciseType}
Duration: ${durationMinutes} minutes
Intensity: ${intensity}

Return ONLY the number of calories burned as an integer. Be realistic based on exercise science.`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-3.5-sonnet',
        messages: [
          { role: 'system', content: 'You are a fitness expert. Estimate calories burned and return only the number.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 100,
      }),
    });

    if (!response.ok) {
      throw new Error(`AI estimation failed: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    
    const calories = parseInt(content.match(/\d+/)?.[0] || '0');
    console.log(`AI estimated calories for ${exerciseName}: ${calories}`);
    
    if (calories > 0) {
      return calories;
    }
    
    // Fallback if AI returns invalid number
    const baseRates = {
      'low': 4,
      'moderate': 6,
      'high': 8,
      'very_high': 10
    };
    const rate = baseRates[intensity] || 6;
    return Math.round(rate * durationMinutes);
    
  } catch (error) {
    console.error(`Error estimating calories for ${exerciseName}:`, error);
    // Enhanced fallback calculation
    const baseRates = {
      'low': 4,
      'moderate': 6,
      'high': 8,
      'very_high': 10
    };
    const rate = baseRates[intensity] || 6;
    return Math.round(rate * durationMinutes);
  }
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
