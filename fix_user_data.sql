-- Step 1: Find your current authenticated user ID
-- Run this first to get your user ID:

SELECT 
  id as user_id,
  email,
  created_at,
  (SELECT COUNT(*) FROM glucose_readings WHERE user_id = auth.users.id) as glucose_count,
  (SELECT COUNT(*) FROM meals WHERE user_id = auth.users.id) as meals_count,
  (SELECT COUNT(*) FROM exercises WHERE user_id = auth.users.id) as exercises_count
FROM auth.users 
ORDER BY created_at DESC
LIMIT 5;

-- Step 2: Copy your user_id from above and replace 'YOUR_ACTUAL_USER_ID' below
-- Then run the rest of this script:

-- Clear any existing data for your user
DELETE FROM glucose_readings WHERE user_id = 'YOUR_ACTUAL_USER_ID';
DELETE FROM food_items WHERE meal_id IN (SELECT id FROM meals WHERE user_id = 'YOUR_ACTUAL_USER_ID');
DELETE FROM meals WHERE user_id = 'YOUR_ACTUAL_USER_ID';
DELETE FROM exercises WHERE user_id = 'YOUR_ACTUAL_USER_ID';

-- Insert sample glucose readings (replace YOUR_ACTUAL_USER_ID)
INSERT INTO glucose_readings (user_id, value, timestamp, notes) VALUES 
('YOUR_ACTUAL_USER_ID', 95, NOW() - INTERVAL '7 days', 'Morning fasting'),
('YOUR_ACTUAL_USER_ID', 125, NOW() - INTERVAL '7 days' + INTERVAL '2 hours', 'After breakfast'),
('YOUR_ACTUAL_USER_ID', 145, NOW() - INTERVAL '7 days' + INTERVAL '5 hours', 'Post-lunch'),
('YOUR_ACTUAL_USER_ID', 92, NOW() - INTERVAL '6 days', 'Morning fasting'),
('YOUR_ACTUAL_USER_ID', 120, NOW() - INTERVAL '6 days' + INTERVAL '2 hours', 'After breakfast'),
('YOUR_ACTUAL_USER_ID', 140, NOW() - INTERVAL '6 days' + INTERVAL '5 hours', 'Post-lunch'),
('YOUR_ACTUAL_USER_ID', 88, NOW() - INTERVAL '5 days', 'Morning fasting - exercise day'),
('YOUR_ACTUAL_USER_ID', 115, NOW() - INTERVAL '5 days' + INTERVAL '2 hours', 'After breakfast'),
('YOUR_ACTUAL_USER_ID', 130, NOW() - INTERVAL '5 days' + INTERVAL '5 hours', 'Post-lunch'),
('YOUR_ACTUAL_USER_ID', 89, NOW() - INTERVAL '1 day', 'Morning fasting'),
('YOUR_ACTUAL_USER_ID', 119, NOW() - INTERVAL '1 day' + INTERVAL '2 hours', 'After breakfast'),
('YOUR_ACTUAL_USER_ID', 136, NOW() - INTERVAL '1 day' + INTERVAL '5 hours', 'Post-lunch'),
('YOUR_ACTUAL_USER_ID', 92, NOW() - INTERVAL '1 hour', 'Morning fasting'),
('YOUR_ACTUAL_USER_ID', 123, NOW() - INTERVAL '30 minutes', 'After breakfast');

-- Insert sample meals (replace YOUR_ACTUAL_USER_ID)
INSERT INTO meals (user_id, meal_type, meal_name, timestamp, total_calories, total_carbs, total_protein, total_fat, total_fiber) VALUES 
('YOUR_ACTUAL_USER_ID', 'breakfast', 'Oatmeal with berries and almonds', NOW() - INTERVAL '7 days' + INTERVAL '8 hours 30 minutes', 350, 45, 12, 14, 8),
('YOUR_ACTUAL_USER_ID', 'lunch', 'Grilled chicken salad with quinoa', NOW() - INTERVAL '7 days' + INTERVAL '13 hours', 420, 35, 35, 18, 6),
('YOUR_ACTUAL_USER_ID', 'dinner', 'Pizza and garlic bread', NOW() - INTERVAL '6 days' + INTERVAL '21 hours', 680, 75, 25, 28, 4),
('YOUR_ACTUAL_USER_ID', 'breakfast', 'Protein smoothie with spinach', NOW() - INTERVAL '5 days' + INTERVAL '8 hours 30 minutes', 290, 28, 25, 8, 6),
('YOUR_ACTUAL_USER_ID', 'lunch', 'Grilled chicken breast with quinoa', NOW() - INTERVAL '5 days' + INTERVAL '13 hours', 420, 38, 40, 12, 6),
('YOUR_ACTUAL_USER_ID', 'breakfast', 'Greek yogurt with berries and nuts', NOW() - INTERVAL '30 minutes', 300, 32, 20, 12, 6);

-- Insert sample exercises (replace YOUR_ACTUAL_USER_ID)
INSERT INTO exercises (user_id, exercise_name, exercise_type, duration_minutes, intensity, calories_burned, timestamp) VALUES 
('YOUR_ACTUAL_USER_ID', 'Weight training - upper body', 'strength', 45, 'moderate', 180, NOW() - INTERVAL '5 days' + INTERVAL '16 hours'),
('YOUR_ACTUAL_USER_ID', 'Post-lunch walk', 'cardio', 20, 'low', 80, NOW() - INTERVAL '4 days' + INTERVAL '14 hours 30 minutes'),
('YOUR_ACTUAL_USER_ID', 'Full body workout', 'strength', 50, 'high', 220, NOW() - INTERVAL '3 days' + INTERVAL '16 hours 30 minutes'),
('YOUR_ACTUAL_USER_ID', 'Evening walk in neighborhood', 'cardio', 30, 'moderate', 120, NOW() - INTERVAL '2 days' + INTERVAL '20 hours 30 minutes'),
('YOUR_ACTUAL_USER_ID', 'Morning jog', 'cardio', 25, 'moderate', 200, NOW() - INTERVAL '1 day' + INTERVAL '6 hours 30 minutes');

-- Step 3: Verify the data was inserted correctly
SELECT 
  'glucose_readings' as table_name, 
  COUNT(*) as record_count,
  MIN(timestamp) as earliest,
  MAX(timestamp) as latest
FROM glucose_readings 
WHERE user_id = 'YOUR_ACTUAL_USER_ID'
UNION ALL
SELECT 
  'meals' as table_name, 
  COUNT(*) as record_count,
  MIN(timestamp) as earliest,
  MAX(timestamp) as latest
FROM meals 
WHERE user_id = 'YOUR_ACTUAL_USER_ID'
UNION ALL
SELECT 
  'exercises' as table_name, 
  COUNT(*) as record_count,
  MIN(timestamp) as earliest,
  MAX(timestamp) as latest
FROM exercises 
WHERE user_id = 'YOUR_ACTUAL_USER_ID';

-- INSTRUCTIONS:
-- 1. Run Step 1 to find your user ID
-- 2. Copy your user_id and replace every 'YOUR_ACTUAL_USER_ID' with it
-- 3. Run Steps 2 and 3 to insert and verify the data
-- 4. Test the app - Timeline and Insights should now show data