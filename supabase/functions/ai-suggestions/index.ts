
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  sanitizeObject,
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

// Rate limit: 15 requests per hour for AI suggestions
const RATE_LIMIT_CONFIG = {
  windowMinutes: 60,
  maxRequests: 15
};

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
    
    // Sanitize input data
    const sanitizedData = sanitizeObject(rawData);
    const { glucoseData, logs, userProfile } = sanitizedData;
    
    console.log('Processing comprehensive AI analysis request');

    if (!glucoseData || glucoseData.length === 0) {
      return createSuccessResponse({ suggestions: [] }, corsHeaders);
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
      'ai-suggestions', 
      RATE_LIMIT_CONFIG
    );
    
    if (!rateLimitResult.allowed) {
      await auditLog(supabase, user.id, 'rate_limit_exceeded', 'ai-suggestions', {
        dataPoints: {
          glucose: glucoseData?.length || 0,
          logs: logs?.length || 0
        }
      }, false);
      
      return new Response(JSON.stringify({
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
        suggestions: [],
        rateLimitReset: rateLimitResult.resetTime
      }), {
        status: 429,
        headers: { ...corsHeaders, ...SECURITY_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    const hfApiToken = Deno.env.get('HF_API_TOKEN');
    if (!hfApiToken) {
      await auditLog(supabase, user.id, 'api_key_missing', 'ai-suggestions', {}, false);
      console.error('Hugging Face API token not found in environment');
      throw new Error('Hugging Face API token not configured');
    }

    // Add logging to check if API key is present (without exposing the key)
    console.log('HF API token is present:', !!hfApiToken);
    console.log('Token length:', hfApiToken?.length || 0);

    // Prepare comprehensive user analysis data with safety checks
    const safeGlucoseData = (glucoseData || []).filter(d => 
      d && typeof d.value === 'number' && d.value > 0 && d.value < 500
    ).slice(-100); // Limit to last 100 readings
    
    const recentGlucose = safeGlucoseData.slice(-50).map((d: any) => ({
      value: Math.max(40, Math.min(400, d.value)), // Clamp values
      time: String(d.time || '').slice(0, 50),
      timestamp: String(d.timestamp || '').slice(0, 30)
    }));
    
    const allGlucose = safeGlucoseData.map((d: any) => ({
      value: Math.max(40, Math.min(400, d.value)),
      time: String(d.time || '').slice(0, 50),
      timestamp: String(d.timestamp || '').slice(0, 30)
    }));

    const safeLogs = (logs || []).slice(0, 200); // Limit total logs
    const meals = safeLogs.filter((log: any) => 
      log && ['meal', 'snack', 'beverage'].includes(log.type)
    ).slice(0, 100); // Limit meals
    
    const exercises = safeLogs.filter((log: any) => 
      log && log.type === 'exercise'
    ).slice(0, 50); // Limit exercises
    
    // Calculate user patterns with safety checks
    const avgGlucose = allGlucose.length > 0 
      ? allGlucose.reduce((sum: number, r: any) => sum + r.value, 0) / allGlucose.length
      : 100;
    const highReadings = allGlucose.filter((r: any) => r.value > 140).length;
    const lowReadings = allGlucose.filter((r: any) => r.value < 70).length;
    const totalReadings = allGlucose.length;

    // Sanitize meal and exercise descriptions
    const safeMeals = meals.slice(-20).map((m: any) => ({
      description: String(m.description || 'Unknown meal').slice(0, 100),
      time: String(m.time || '').slice(0, 50)
    }));
    
    const safeExercises = exercises.slice(-15).map((e: any) => ({
      description: String(e.description || 'Unknown exercise').slice(0, 100),
      time: String(e.time || '').slice(0, 50)
    }));

    const prompt = `You are an expert diabetes educator and personalized health coach with access to comprehensive user data. Your task is to provide deeply personalized health insights.

USER PROFILE ANALYSIS:
Total Glucose Readings: ${totalReadings}
Average Glucose: ${Math.round(avgGlucose)} mg/dL
High Readings (>140): ${highReadings} (${totalReadings > 0 ? Math.round(highReadings/totalReadings*100) : 0}%)
Low Readings (<70): ${lowReadings} (${totalReadings > 0 ? Math.round(lowReadings/totalReadings*100) : 0}%)

RECENT GLUCOSE PATTERN (Last 50 readings):
${recentGlucose.map((r: any) => `${r.value}mg/dL at ${r.time}`).join(', ')}

MEAL HISTORY ANALYSIS:
${safeMeals.map((m: any) => `${m.description} at ${m.time}`).join('\n')}

EXERCISE HISTORY ANALYSIS:  
${safeExercises.map((e: any) => `${e.description} at ${e.time}`).join('\n')}

PERSONALIZATION TASK:
1. Identify unique patterns in THIS USER'S glucose responses to meals and exercise
2. Find correlations between specific foods/activities and glucose spikes/drops
3. Recognize timing patterns (meal timing, exercise timing, glucose patterns by time of day)
4. Understand this user's individual glucose sensitivity and response patterns
5. Provide coaching based on what SPECIFICALLY works/doesn't work for THIS USER

RESPONSE REQUIREMENTS:
- Provide exactly 3 deeply personalized suggestions
- Each suggestion max 75 characters, start with '•'
- Base recommendations on THIS USER'S specific patterns and history
- Reference specific foods/activities from their history when relevant
- Focus on actionable insights unique to their glucose response patterns

Think step-by-step: Analyze patterns → Identify correlations → Generate personalized recommendations.`;

    console.log('Making request to Hugging Face Router API...');

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
            content: 'You are an expert personalized health coach specializing in glucose management. Your strength is identifying unique patterns in individual user data and providing tailored recommendations. Use advanced reasoning to find correlations between foods, exercise, timing, and glucose responses specific to each user. Always provide exactly 3 personalized bullet points starting with •' 
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    console.log('HF Router API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('HF Router API error response:', errorText);
      throw new Error(`HF Router API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content;
    
    const parsedSuggestions = text.split('•').map((s: string) => s.trim()).filter((s: string) => s.length > 0);

    if (parsedSuggestions.length === 0) {
      throw new Error("AI returned no suggestions.");
    }

    console.log(`Generated ${parsedSuggestions.length} suggestions`);
    
    // Log successful analysis
    await auditLog(supabase, user.id, 'ai_suggestions_generated', 'ai-suggestions', {
      suggestionsCount: parsedSuggestions.length,
      dataPoints: {
        glucose: totalReadings,
        meals: meals.length,
        exercises: exercises.length
      }
    }, true);

    return createSuccessResponse({ suggestions: parsedSuggestions }, corsHeaders);

  } catch (error) {
    console.error('Error in ai-suggestions function:', error);
    
    // Log error if we have user context
    if (user && supabase) {
      await auditLog(supabase, user.id, 'function_error', 'ai-suggestions', {
        error: error.message
      }, false);
    }
    
    // Return error response with fallback suggestions
    const errorResponse = createErrorResponse(error, 500, corsHeaders);
    const errorData = JSON.parse(await errorResponse.text());
    
    return new Response(JSON.stringify({
      ...errorData,
      suggestions: [] // Always provide suggestions array for app compatibility
    }), {
      status: errorResponse.status,
      headers: errorResponse.headers
    });
  }
});
