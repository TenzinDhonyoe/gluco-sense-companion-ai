import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  sanitizeInput,
  validateRequest,
  RateLimiter,
  auditLog,
  createErrorResponse,
  createSuccessResponse,
  SECURITY_HEADERS
} from "../_shared/security-utils.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limit: 20 requests per hour for input parsing
const RATE_LIMIT_CONFIG = {
  windowMinutes: 60,
  maxRequests: 20
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


// Cache for nutrition results to ensure consistency
const nutritionCache = new Map<string, FoodNutrients>();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { ...corsHeaders, ...SECURITY_HEADERS } });
  }

  let user: any = null;
  let supabase: any = null;

  try {
    // Parse and validate request
    const rawData = await req.json();
    validateRequest(rawData);
    
    const { input } = rawData;
    console.log('Processing input:', input?.slice(0, 100) + (input?.length > 100 ? '...' : ''));

    if (!input || typeof input !== 'string') {
      throw new Error('Input is required and must be a string');
    }
    
    if (input.length > 1000) {
      throw new Error('Input too long. Maximum 1000 characters allowed.');
    }
    
    // Sanitize user input
    const sanitizedInput = sanitizeInput(input, 1000);
    if (!sanitizedInput.trim()) {
      throw new Error('Input contains only invalid characters');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Authorization header required');
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: authUser }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !authUser) {
      throw new Error('User not authenticated');
    }
    
    user = authUser;
    
    // Check rate limits
    const rateLimiter = new RateLimiter(supabaseUrl, supabaseKey);
    const rateLimitResult = await rateLimiter.checkRateLimit(
      user.id, 
      'parse-user-input', 
      RATE_LIMIT_CONFIG
    );
    
    if (!rateLimitResult.allowed) {
      await auditLog(supabase, user.id, 'rate_limit_exceeded', 'parse-user-input', {
        inputLength: sanitizedInput.length
      }, false);
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
        rateLimitReset: rateLimitResult.resetTime
      }), {
        status: 429,
        headers: { ...corsHeaders, ...SECURITY_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    // Parse input using AI with sanitized input
    const parsedData = await parseInputWithAI(sanitizedInput);
    console.log('Parsed data:', parsedData);

    let result;
    if (parsedData.type === 'meal') {
      result = await processMeal(parsedData, user.id, supabase);
    } else if (parsedData.type === 'exercise') {
      result = await processExercise(parsedData, user.id, supabase);
    } else {
      throw new Error('Unable to determine if input is a meal or exercise');
    }

    // Log successful parsing
    await auditLog(supabase, user.id, 'input_parsed', 'parse-user-input', {
      inputType: parsedData.type,
      inputLength: sanitizedInput.length,
      outputType: result ? 'success' : 'failed'
    }, true);

    return createSuccessResponse({
      data: result,
      message: `Successfully logged ${parsedData.type}`
    }, corsHeaders);

  } catch (error) {
    console.error('Error in parse-user-input function:', error);
    
    // Log error if we have user context
    if (user && supabase) {
      await auditLog(supabase, user.id, 'function_error', 'parse-user-input', {
        error: error.message
      }, false);
    }
    
    return createErrorResponse(error, 500, corsHeaders);
  }
});

async function parseInputWithAI(input: string): Promise<ParsedMeal | ParsedExercise> {
  const hfApiToken = Deno.env.get('HF_API_TOKEN');
  if (!hfApiToken) {
    console.error('HF API token not found, falling back to rule-based parsing');
    return parseInputWithRules(input);
  }

  const prompt = `You are an expert nutritionist and fitness specialist. Your task is to analyze user input and extract detailed, accurate information about meals or exercises.

USER INPUT: "${input}"

ANALYSIS PROCESS:
1. First, reason through whether this describes food/meal consumption or physical exercise
2. Extract all relevant details with intelligent inference
3. Use context clues like time references, portion descriptions, and activity keywords
4. For meals: identify individual food items, estimate reasonable quantities, determine meal timing
5. For exercises: identify activity type, estimate duration and intensity based on descriptions

RESPONSE FORMAT:
Return a valid JSON object with this exact structure:

FOR MEALS:
{
  "type": "meal",
  "meal_type": "breakfast|lunch|dinner|snack",
  "meal_name": "descriptive name for the entire meal",
  "food_items": [
    {
      "food_name": "specific food item name",
      "quantity": number,
      "unit": "appropriate unit (serving, cup, slice, piece, etc.)"
    }
  ],
  "timestamp": "current ISO timestamp"
}

FOR EXERCISES:
{
  "type": "exercise",
  "exercise_name": "specific exercise/activity name",
  "exercise_type": "cardio|strength|flexibility|other",
  "duration_minutes": number,
  "intensity": "low|moderate|high|very_high",
  "timestamp": "current ISO timestamp"
}

IMPORTANT: Use your reasoning to make intelligent inferences about quantities, timing, and details that aren't explicitly stated.`;

  try {
    const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfApiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert nutritionist and fitness specialist. Use your reasoning capabilities to accurately parse food and exercise descriptions. Always return valid JSON in the exact format specified. Think step-by-step to extract all relevant details.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error('HF Router API error:', response.status);
      return parseInputWithRules(input);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    // Parse the JSON response
    try {
      const parsedResult = JSON.parse(aiResponse);
      console.log('AI parsed result:', parsedResult);
      return parsedResult;
    } catch (jsonError) {
      console.error('Failed to parse AI JSON response:', jsonError);
      return parseInputWithRules(input);
    }
  } catch (error) {
    console.error('AI parsing error:', error);
    return parseInputWithRules(input);
  }
}

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

async function getAINutritionData(foodName: string, quantity: number, unit: string): Promise<FoodNutrients | null> {
  // Check cache first for consistency
  const cacheKey = `${foodName.toLowerCase().trim()}-${quantity}-${unit}`;
  if (nutritionCache.has(cacheKey)) {
    console.log(`Using cached AI nutrition data for: ${foodName}`);
    return nutritionCache.get(cacheKey)!;
  }

  const hfApiToken = Deno.env.get('HF_API_TOKEN');
  if (!hfApiToken) {
    console.error('HF API token not found, cannot get nutrition data');
    return null;
  }

  try {
    const prompt = `You are an expert nutritionist and food scientist. Analyze the following food item and provide accurate nutritional information.

FOOD ITEM: ${foodName}
QUANTITY: ${quantity} ${unit}

ANALYSIS REQUIREMENTS:
1. Consider the specific portion size and unit provided
2. Account for typical preparation methods and variations
3. Provide realistic nutritional values based on your extensive knowledge
4. Consider portion context (e.g., "large slice" vs "small piece")

RESPONSE FORMAT:
Return a JSON object with exact nutritional values per the specified quantity:
{
  "calories": number,
  "carbs": number,
  "protein": number,
  "fat": number,
  "fiber": number,
  "confidence": number (0.1 to 1.0)
}

Be precise and realistic with your estimates. Factor in typical serving sizes and food density.`;

    console.log(`Getting AI nutrition data for: ${foodName} (${quantity} ${unit})`);
    
    const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfApiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert nutritionist. Use your reasoning capabilities to provide accurate nutritional analysis. Always return valid JSON with precise nutritional values.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      console.error('HF Router API error for nutrition analysis:', response.status);
      return null;
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    try {
      const nutritionData = JSON.parse(aiResponse);
      
      // Validate the response structure
      if (typeof nutritionData.calories === 'number' && 
          typeof nutritionData.carbs === 'number' &&
          typeof nutritionData.protein === 'number' &&
          typeof nutritionData.fat === 'number' &&
          typeof nutritionData.fiber === 'number') {
        
        console.log(`AI nutrition analysis for ${foodName}:`, nutritionData);
        
        // Cache the result
        nutritionCache.set(cacheKey, nutritionData);
        return nutritionData;
      } else {
        console.error('Invalid AI nutrition response structure');
        return null;
      }
    } catch (jsonError) {
      console.error('Failed to parse AI nutrition response:', jsonError);
      return null;
    }
  } catch (error) {
    console.error('Error getting AI nutrition data:', error.message);
    return null;
  }
}

async function getAIExerciseData(exerciseName: string, duration?: number, intensity?: string): Promise<{ duration: number, intensity: string, calories: number, confidence: number } | null> {
  const hfApiToken = Deno.env.get('HF_API_TOKEN');
  if (!hfApiToken) {
    console.error('HF API token not found, cannot get exercise data');
    return null;
  }

  try {
    const prompt = `You are an expert exercise physiologist and fitness specialist. Analyze the following exercise activity and provide accurate estimates.

EXERCISE: ${exerciseName}
PROVIDED DURATION: ${duration ? `${duration} minutes` : 'not specified'}
PROVIDED INTENSITY: ${intensity || 'not specified'}

ANALYSIS REQUIREMENTS:
1. If duration is missing, estimate based on typical activity patterns and context clues
2. If intensity is missing, analyze the description for intensity keywords
3. Calculate realistic calorie burn for an average adult (70kg/154lbs)
4. Consider the specific type of exercise and its metabolic demands
5. Use your expertise to make intelligent inferences

RESPONSE FORMAT:
Return a JSON object with exercise analysis:
{
  "duration_minutes": number,
  "intensity": "low|moderate|high|very_high", 
  "calories_burned": number,
  "confidence": number (0.1 to 1.0)
}

Be realistic with estimates. Consider typical activity patterns and energy expenditure.`;

    console.log(`Getting AI exercise data for: ${exerciseName}`);
    
    const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${hfApiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          { 
            role: 'system', 
            content: 'You are an expert exercise physiologist. Use your reasoning capabilities to provide accurate exercise analysis. Always return valid JSON with precise estimates.' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      console.error('HF Router API error for exercise analysis:', response.status);
      return null;
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;
    
    try {
      const exerciseData = JSON.parse(aiResponse);
      
      // Validate the response structure
      if (typeof exerciseData.duration_minutes === 'number' && 
          typeof exerciseData.calories_burned === 'number' &&
          ['low', 'moderate', 'high', 'very_high'].includes(exerciseData.intensity)) {
        
        console.log(`AI exercise analysis for ${exerciseName}:`, exerciseData);
        return {
          duration: exerciseData.duration_minutes,
          intensity: exerciseData.intensity,
          calories: exerciseData.calories_burned,
          confidence: exerciseData.confidence || 0.8
        };
      } else {
        console.error('Invalid AI exercise response structure');
        return null;
      }
    } catch (jsonError) {
      console.error('Failed to parse AI exercise response:', jsonError);
      return null;
    }
  } catch (error) {
    console.error('Error getting AI exercise data:', error.message);
    return null;
  }
}

function getFallbackNutrients(): FoodNutrients {
  const fallbackNutrients: FoodNutrients = {
    calories: 150,
    carbs: 20,
    protein: 5,
    fat: 3,
    fiber: 2,
  };

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
    
    // Get AI-powered nutrition data
    const aiNutrientData = await getAINutritionData(item.food_name, item.quantity, item.unit);
    let completeNutrients: FoodNutrients;
    
    if (aiNutrientData) {
      completeNutrients = aiNutrientData;
      console.log(`Using AI nutrition data for ${item.food_name}:`, completeNutrients);
    } else {
      console.log(`AI nutrition data unavailable for ${item.food_name}, using fallback estimates`);
      completeNutrients = getFallbackNutrients();
    }

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

  // Get AI-powered exercise analysis
  const aiExerciseData = await getAIExerciseData(
    parsedExercise.exercise_name, 
    parsedExercise.duration_minutes,
    parsedExercise.intensity
  );

  let finalDuration = parsedExercise.duration_minutes || 30;
  let finalIntensity = parsedExercise.intensity || 'moderate';
  let caloriesBurned = 100; // fallback

  if (aiExerciseData) {
    finalDuration = aiExerciseData.duration;
    finalIntensity = aiExerciseData.intensity;
    caloriesBurned = aiExerciseData.calories;
    console.log(`Using AI exercise data:`, aiExerciseData);
  } else {
    console.log('AI exercise data unavailable, using basic estimates');
    // Fallback calculation
    const baseRates = {
      'low': 4,
      'moderate': 6, 
      'high': 8,
      'very_high': 10
    };
    const rate = baseRates[finalIntensity as keyof typeof baseRates] || 6;
    caloriesBurned = Math.round(rate * finalDuration);
  }

  const exerciseData = {
    user_id: userId,
    exercise_name: parsedExercise.exercise_name,
    exercise_type: parsedExercise.exercise_type,
    duration_minutes: finalDuration,
    intensity: finalIntensity,
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
