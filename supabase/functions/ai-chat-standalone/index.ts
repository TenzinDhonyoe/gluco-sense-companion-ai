import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': "default-src 'none'; script-src 'none';",
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
};

// Simple input sanitization
function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[<>'"\\]/g, '')
    .replace(/\${.*?}/g, '')
    .replace(/`/g, '')
    .slice(0, 1000)
    .trim();
}

// Simple rate limiting check (simplified for standalone version)
async function checkRateLimit(supabase: any, userId: string): Promise<boolean> {
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    // Check if rate_limits table exists, if not just return true (allow)
    const { data, error } = await supabase
      .from('rate_limits')
      .select('id')
      .eq('user_id', userId)
      .eq('endpoint', 'ai-chat')
      .gte('timestamp', oneHourAgo);

    if (error) {
      console.log('Rate limiting table not available, allowing request');
      return true; // If table doesn't exist, allow the request
    }

    // Allow up to 30 requests per hour
    const requestCount = data?.length || 0;
    if (requestCount >= 30) {
      return false;
    }

    // Log this request
    await supabase
      .from('rate_limits')
      .insert({
        user_id: userId,
        endpoint: 'ai-chat',
        rate_limit_key: `${userId}-ai-chat`,
        timestamp: new Date().toISOString()
      });

    return true;
  } catch (error) {
    console.log('Rate limiting error, allowing request:', error);
    return true; // On error, allow the request
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: { ...corsHeaders, ...SECURITY_HEADERS } });
  }

  let user: any = null;
  let supabase: any = null;

  try {
    // Parse request
    const body = await req.json();
    const { message, conversationHistory = [], userContext = {} } = body;
    
    console.log('Processing AI chat request');

    // Validate message
    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { ...corsHeaders, ...SECURITY_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    // Sanitize message
    const sanitizedMessage = sanitizeInput(message);
    if (!sanitizedMessage) {
      return new Response(JSON.stringify({ error: 'Invalid message' }), {
        status: 400,
        headers: { ...corsHeaders, ...SECURITY_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    supabase = createClient(supabaseUrl, supabaseKey);

    // Get authenticated user
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !authUser) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, ...SECURITY_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    user = authUser;

    // Simple rate limiting
    const rateLimitOk = await checkRateLimit(supabase, user.id);
    if (!rateLimitOk) {
      return new Response(JSON.stringify({ error: 'Rate limit exceeded. Try again later.' }), {
        status: 429,
        headers: { ...corsHeaders, ...SECURITY_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    // Get Hugging Face API token
    const HF_API_TOKEN = Deno.env.get('HF_API_TOKEN');
    if (!HF_API_TOKEN) {
      console.error('HF_API_TOKEN not configured');
      return new Response(JSON.stringify({
        response: generateFallbackResponse(sanitizedMessage, userContext),
        source: 'fallback'
      }), {
        status: 200,
        headers: { ...corsHeaders, ...SECURITY_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    // Build context from user data
    let contextInfo = '';
    if (userContext.recentGlucose && userContext.recentGlucose.length > 0) {
      const avgGlucose = userContext.recentGlucose.reduce((sum: number, reading: any) => sum + reading.value, 0) / userContext.recentGlucose.length;
      contextInfo += `Recent average glucose: ${Math.round(avgGlucose)} mg/dL. `;
    }
    
    if (userContext.recentMeals && userContext.recentMeals.length > 0) {
      contextInfo += `Recent meals logged: ${userContext.recentMeals.length}. `;
    }
    
    if (userContext.recentExercises && userContext.recentExercises.length > 0) {
      contextInfo += `Recent workouts: ${userContext.recentExercises.length}. `;
    }

    // Build conversation context
    let conversationContext = '';
    if (conversationHistory.length > 0) {
      conversationContext = conversationHistory
        .slice(-6) // Last 6 messages for context
        .map((msg: any) => `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`)
        .join('\n');
    }

    // Create the prompt for the AI
    const systemPrompt = `You are GlucoCoach AI, a friendly and supportive diabetes management assistant. You help users understand their glucose patterns and make healthy lifestyle choices.

COMMUNICATION STYLE:
- Write in a warm, conversational tone like a knowledgeable friend
- Use simple, clear language without technical jargon
- NO asterisks, hashes, tables, or special formatting
- Write in natural paragraphs with proper sentences
- Be encouraging and positive
- Keep responses conversational and easy to read

CONTENT GUIDELINES:
- Focus on practical lifestyle tips and wellness advice
- Use the user's actual data when available to personalize responses
- Give specific, actionable suggestions
- Keep responses under 150 words for mobile readability
- Never diagnose medical conditions or replace medical advice
- Always suggest consulting healthcare providers for medical concerns

${contextInfo ? `USER'S RECENT DATA: ${contextInfo}` : ''}

${conversationContext ? `RECENT CONVERSATION:\n${conversationContext}\n` : ''}

USER'S MESSAGE: ${sanitizedMessage}

Respond naturally as GlucoCoach AI in a conversational, friendly manner:`;

    console.log('Calling Hugging Face API with OpenAI OSS model');

    // Call Hugging Face API with OpenAI OSS model
    const hfResponse = await fetch('https://router.huggingface.co/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${HF_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          {
            role: 'system',
            content: 'You are GlucoCoach AI, a friendly diabetes management assistant. Respond naturally and conversationally without special formatting, asterisks, or technical jargon. Keep responses under 150 words and focus on practical wellness advice.'
          },
          {
            role: 'user',
            content: systemPrompt
          }
        ],
        max_tokens: 200,
        temperature: 0.4,
        stream: false
      })
    });

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text();
      console.error('Hugging Face API error:', errorText);
      
      // Fallback to simple response if AI fails
      const fallbackResponse = generateFallbackResponse(sanitizedMessage, userContext);
      
      return new Response(JSON.stringify({
        response: fallbackResponse,
        source: 'fallback'
      }), {
        status: 200,
        headers: { ...corsHeaders, ...SECURITY_HEADERS, 'Content-Type': 'application/json' }
      });
    }

    const aiData = await hfResponse.json();
    let aiResponse = aiData.choices?.[0]?.message?.content || 'I apologize, but I could not process your request right now. Please try again.';

    // Clean up the response
    aiResponse = aiResponse.trim();
    
    // Remove common formatting artifacts
    aiResponse = aiResponse
      .replace(/\*\*/g, '') // Remove asterisks
      .replace(/\*/g, '')   // Remove single asterisks
      .replace(/#{2,}/g, '') // Remove multiple hashes
      .replace(/\|/g, '')    // Remove pipe characters
      .replace(/---+/g, '')  // Remove dashes
      .replace(/\n\s*\n/g, '\n\n') // Clean up extra line breaks
      .replace(/^\s*[-•]\s*/gm, '') // Remove bullet points at start of lines
      .trim();
    
    // Ensure response isn't too long
    if (aiResponse.length > 400) {
      aiResponse = aiResponse.substring(0, 397) + '...';
    }

    console.log('AI response generated successfully');

    return new Response(JSON.stringify({
      response: aiResponse,
      source: 'ai'
    }), {
      status: 200,
      headers: { ...corsHeaders, ...SECURITY_HEADERS, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('AI chat error:', error);
    
    // Return fallback response on error
    const fallbackResponse = generateFallbackResponse(
      body?.message || 'Hello',
      body?.userContext || {}
    );

    return new Response(JSON.stringify({
      response: fallbackResponse,
      source: 'fallback'
    }), {
      status: 200,
      headers: { ...corsHeaders, ...SECURITY_HEADERS, 'Content-Type': 'application/json' }
    });
  }
});

// Fallback response generator
function generateFallbackResponse(message: string, userContext: any): string {
  const lowerMessage = message.toLowerCase();
  
  // Context-aware responses
  const avgGlucose = userContext.recentGlucose?.length > 0 
    ? Math.round(userContext.recentGlucose.reduce((sum: number, r: any) => sum + r.value, 0) / userContext.recentGlucose.length)
    : null;

  if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
    return `Hello! I'm GlucoCoach AI, here to help with your diabetes management. ${avgGlucose ? `Your recent average glucose is ${avgGlucose} mg/dL. ` : ''}How can I assist you today?`;
  }
  
  if (lowerMessage.includes('glucose') || lowerMessage.includes('blood sugar') || lowerMessage.includes('trend')) {
    if (avgGlucose) {
      return `Based on your recent readings, your average glucose is ${avgGlucose} mg/dL. ${avgGlucose > 140 ? 'Consider focusing on balanced meals and post-meal walks to help manage levels.' : 'Your levels look well-managed! Keep up the good work with your current routine.'}`;
    }
    return "I'd love to help with your glucose management! Start logging some readings so I can provide personalized insights about your trends.";
  }
  
  if (lowerMessage.includes('meal') || lowerMessage.includes('food') || lowerMessage.includes('eat')) {
    const mealCount = userContext.recentMeals?.length || 0;
    return `Here's a simple meal idea: try grilled salmon with quinoa and roasted vegetables. ${mealCount > 0 ? `I noticed you've been tracking your meals - that's fantastic!` : 'Logging your meals can help me give you more personalized suggestions.'} The protein and fiber help keep glucose levels steady. What sounds good to you?`;
  }
  
  if (lowerMessage.includes('exercise') || lowerMessage.includes('workout')) {
    const exerciseCount = userContext.recentExercises?.length || 0;
    return `Exercise is excellent for glucose management! ${exerciseCount > 0 ? `I see you've been staying active with ${exerciseCount} recent workouts.` : 'Even a 10-15 minute walk after meals can help reduce glucose spikes.'} Try timing exercise 30-60 minutes after meals for the best effect.`;
  }
  
  return "I'm here to help with your diabetes management! I can provide insights about glucose trends, meal planning, exercise timing, and lifestyle factors. What would you like to know more about?";
}