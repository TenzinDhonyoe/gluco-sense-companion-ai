
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { glucoseData, logs } = await req.json();
    console.log('Processing AI suggestions request');

    if (!glucoseData || glucoseData.length === 0) {
      return new Response(JSON.stringify({ suggestions: [] }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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

    const openRouterApiKey = Deno.env.get('OPENROUTER_API_KEY');
    if (!openRouterApiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const glucose_series = glucoseData.slice(-20).map((d: any) => `${d.value} at ${d.time}`).join(', ');
    
    const formatLogs = (logType: string | string[], defaultText: string) => {
      const types = Array.isArray(logType) ? logType : [logType];
      const relevantLogs = logs.filter((log: any) => types.includes(log.type));
      if (relevantLogs.length === 0) return defaultText;
      return relevantLogs.map((log: any) => log.description).join('; ');
    };
    
    const meal_log = formatLogs(['meal', 'snack', 'beverage'], "No meals or snacks logged.");
    const exercise_log = formatLogs('exercise', "No exercise logged.");
    
    const sleep_hours = 7; // Placeholder
    const steps = 8500; // Placeholder

    const prompt = `You are a certified diabetes educator focusing on pre-diabetes prevention. Your tone is encouraging and actionable.

    Based on the following data for a user, return exactly 3 bullet-point suggestions to help keep glucose in a healthy range.
    Each suggestion must be 75 characters or less.
    Start each suggestion with a '•' character, and separate them with a new line.
    Do not include any other text, titles, or pleasantries in your response. Just the 3 bullet points.
    
    ---
    DATA:
    Past 24h readings (mg/dL): ${glucose_series}
    User's Recent Logs:
      – Meals/Snacks/Beverages: ${meal_log} 
      – Exercise: ${exercise_log}
    Vitals: ${sleep_hours}h sleep, ${steps} steps
    ---`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openRouterApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-v3',
        messages: [
          { role: 'system', content: 'You are a certified diabetes educator. Provide exactly 3 bullet-point suggestions, each 75 characters or less, starting with •' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices[0].message.content;
    
    const parsedSuggestions = text.split('•').map((s: string) => s.trim()).filter((s: string) => s.length > 0);

    if (parsedSuggestions.length === 0) {
      throw new Error("AI returned no suggestions.");
    }

    console.log(`Generated ${parsedSuggestions.length} suggestions`);

    return new Response(JSON.stringify({ 
      suggestions: parsedSuggestions 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-suggestions function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      suggestions: []
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
