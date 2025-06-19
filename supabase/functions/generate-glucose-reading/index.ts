import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Database {
  public: {
    Tables: {
      glucose_readings: {
        Insert: {
          user_id: string
          value: number
          unit?: string
          timestamp?: string
          tag?: string | null
          notes?: string | null
          source?: string
          is_sensor_reading?: boolean
        }
      }
    }
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get all users who have glucose readings (active users)
    const { data: activeUsers, error: usersError } = await supabaseClient
      .from('glucose_readings')
      .select('user_id')
      .eq('source', 'manual') // Only users who have manually logged readings
      .order('timestamp', { ascending: false })

    if (usersError) {
      console.error('Error fetching users:', usersError)
      throw usersError
    }

    // Get unique user IDs
    const uniqueUserIds = [...new Set(activeUsers?.map(reading => reading.user_id) || [])]
    
    console.log(`Generating glucose readings for ${uniqueUserIds.length} active users`)

    // Generate readings for each active user
    for (const userId of uniqueUserIds) {
      // Get the user's latest reading to make the new reading realistic
      const { data: latestReading } = await supabaseClient
        .from('glucose_readings')
        .select('value, timestamp')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(1)
        .single()

      let baseValue = 120 // Default baseline
      if (latestReading) {
        baseValue = latestReading.value
      }

      // Generate a realistic glucose variation (-20 to +20 mg/dL from last reading)
      const variation = (Math.random() - 0.5) * 40
      let newValue = baseValue + variation

      // Keep values within realistic bounds (70-300 mg/dL)
      newValue = Math.max(70, Math.min(300, newValue))
      
      // Round to nearest whole number
      newValue = Math.round(newValue)

      // Insert the new reading
      const { error: insertError } = await supabaseClient
        .from('glucose_readings')
        .insert({
          user_id: userId,
          value: newValue,
          unit: 'mg/dL',
          timestamp: new Date().toISOString(),
          source: 'sensor',
          is_sensor_reading: true,
          tag: 'random',
          notes: 'Auto-generated sensor reading'
        })

      if (insertError) {
        console.error(`Error inserting reading for user ${userId}:`, insertError)
      } else {
        console.log(`Generated glucose reading ${newValue} mg/dL for user ${userId}`)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Generated readings for ${uniqueUserIds.length} users`,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in generate-glucose-reading function:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})
