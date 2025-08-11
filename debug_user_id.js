// Debug script to check current authenticated user ID
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jjzjurutvkogdpzuemde.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impqemp1cnV0dmtvZ2RwenVlbWRlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzEzNTA5MjMsImV4cCI6MjA0NjkyNjkyM30.0NLzYKR25a2lkSaLiO7DPCg9PGQj8RY1K-HkGaA0Czs'

const supabase = createClient(supabaseUrl, supabaseKey)
const SAMPLE_USER_ID = '58d88a39-494b-462f-8166-bd661a7e8b26'

async function debugUserAndData() {
  console.log('🔍 Debug: User ID and Data Analysis')
  console.log('================================')
  
  try {
    // Check sample data exists for specific user ID
    console.log('\\n1. Checking sample data for user:', SAMPLE_USER_ID)
    
    const { data: sampleGlucose, error: glucoseError } = await supabase
      .from('glucose_readings')
      .select('id, value, timestamp')
      .eq('user_id', SAMPLE_USER_ID)
      .limit(5)
    
    if (glucoseError) {
      console.error('❌ Error fetching sample glucose data:', glucoseError.message)
    } else {
      console.log(`✅ Found ${sampleGlucose?.length || 0} glucose readings for sample user`)
      if (sampleGlucose && sampleGlucose.length > 0) {
        console.log('   Sample readings:', sampleGlucose.map(r => `${r.value}mg/dL at ${r.timestamp}`))
      }
    }
    
    const { data: sampleMeals, error: mealsError } = await supabase
      .from('meals')
      .select('id, meal_name, timestamp')
      .eq('user_id', SAMPLE_USER_ID)
      .limit(5)
    
    if (mealsError) {
      console.error('❌ Error fetching sample meals data:', mealsError.message)
    } else {
      console.log(`✅ Found ${sampleMeals?.length || 0} meals for sample user`)
      if (sampleMeals && sampleMeals.length > 0) {
        console.log('   Sample meals:', sampleMeals.map(m => `${m.meal_name} at ${m.timestamp}`))
      }
    }
    
    // Check all users in the system
    console.log('\\n2. Checking all users in the system:')
    
    const { data: allUsers, error: usersError } = await supabase
      .from('glucose_readings')
      .select('user_id')
      .limit(100)
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError.message)
    } else {
      const uniqueUsers = [...new Set(allUsers?.map(u => u.user_id) || [])]
      console.log(`✅ Found data for ${uniqueUsers.length} unique users:`)
      uniqueUsers.forEach((userId, i) => {
        console.log(`   ${i + 1}. ${userId} ${userId === SAMPLE_USER_ID ? '← SAMPLE USER' : ''}`)
      })
    }
    
    // Instructions for fixing user ID mismatch
    console.log('\\n3. 🔧 TROUBLESHOOTING INSTRUCTIONS:')
    console.log('================================')
    console.log('')
    console.log('If you see data for other user IDs but not the sample user:')
    console.log('Option A: Update sample data to use your current user ID')
    console.log('   1. Sign in to the app and check browser dev tools for your user ID')
    console.log('   2. Replace SAMPLE_USER_ID in execute_sample_data.sql with your actual user ID') 
    console.log('   3. Re-run the SQL in Supabase dashboard')
    console.log('')
    console.log('Option B: Create a test user with the sample user ID')
    console.log('   1. Use Supabase Auth to create user: 58d88a39-494b-462f-8166-bd661a7e8b26')
    console.log('   2. Sign in with that test account')
    console.log('')
    console.log('Current sample data user ID:', SAMPLE_USER_ID)
    
  } catch (error) {
    console.error('❌ Error in debug script:', error.message)
  }
}

// Run the debug analysis
debugUserAndData()