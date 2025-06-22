
-- Create a function to insert sample glucose data for any authenticated user
CREATE OR REPLACE FUNCTION insert_sample_glucose_data()
RETURNS void
LANGUAGE plpgsql
SECURITY definer
AS $$
BEGIN
  -- Only insert if user is authenticated and has no existing readings
  IF auth.uid() IS NOT NULL AND (SELECT COUNT(*) FROM public.glucose_readings WHERE user_id = auth.uid()) = 0 THEN
    INSERT INTO public.glucose_readings (user_id, value, unit, timestamp, tag, notes, source) VALUES
    -- Day 10 (oldest)
    (auth.uid(), 95.5, 'mg/dL', NOW() - INTERVAL '10 days' + INTERVAL '7 hours', 'fasting', 'Morning reading', 'manual'),
    (auth.uid(), 125.2, 'mg/dL', NOW() - INTERVAL '10 days' + INTERVAL '12 hours', 'post-meal', 'After lunch', 'manual'),
    (auth.uid(), 110.8, 'mg/dL', NOW() - INTERVAL '10 days' + INTERVAL '18 hours', 'pre-meal', 'Before dinner', 'manual'),
    (auth.uid(), 102.3, 'mg/dL', NOW() - INTERVAL '10 days' + INTERVAL '21 hours', 'bedtime', 'Before sleep', 'manual'),

    -- Day 9
    (auth.uid(), 88.7, 'mg/dL', NOW() - INTERVAL '9 days' + INTERVAL '6 hours 30 minutes', 'fasting', 'Morning reading', 'manual'),
    (auth.uid(), 142.1, 'mg/dL', NOW() - INTERVAL '9 days' + INTERVAL '8 hours 45 minutes', 'post-meal', 'After breakfast', 'manual'),
    (auth.uid(), 118.5, 'mg/dL', NOW() - INTERVAL '9 days' + INTERVAL '13 hours', 'post-meal', 'After lunch', 'manual'),
    (auth.uid(), 95.2, 'mg/dL', NOW() - INTERVAL '9 days' + INTERVAL '17 hours 30 minutes', 'pre-meal', 'Before dinner', 'manual'),
    (auth.uid(), 108.9, 'mg/dL', NOW() - INTERVAL '9 days' + INTERVAL '22 hours', 'bedtime', 'Before sleep', 'manual'),

    -- Day 8
    (auth.uid(), 92.3, 'mg/dL', NOW() - INTERVAL '8 days' + INTERVAL '7 hours 15 minutes', 'fasting', 'Morning reading', 'manual'),
    (auth.uid(), 156.8, 'mg/dL', NOW() - INTERVAL '8 days' + INTERVAL '9 hours', 'post-meal', 'After breakfast', 'manual'),
    (auth.uid(), 132.4, 'mg/dL', NOW() - INTERVAL '8 days' + INTERVAL '12 hours 30 minutes', 'post-meal', 'After lunch', 'manual'),
    (auth.uid(), 104.7, 'mg/dL', NOW() - INTERVAL '8 days' + INTERVAL '18 hours 15 minutes', 'pre-meal', 'Before dinner', 'manual'),

    -- Day 7
    (auth.uid(), 97.1, 'mg/dL', NOW() - INTERVAL '7 days' + INTERVAL '6 hours 45 minutes', 'fasting', 'Morning reading', 'manual'),
    (auth.uid(), 128.9, 'mg/dL', NOW() - INTERVAL '7 days' + INTERVAL '8 hours 30 minutes', 'post-meal', 'After breakfast', 'manual'),
    (auth.uid(), 145.3, 'mg/dL', NOW() - INTERVAL '7 days' + INTERVAL '13 hours 15 minutes', 'post-meal', 'After lunch', 'manual'),
    (auth.uid(), 112.6, 'mg/dL', NOW() - INTERVAL '7 days' + INTERVAL '17 hours', 'pre-meal', 'Before dinner', 'manual'),
    (auth.uid(), 99.8, 'mg/dL', NOW() - INTERVAL '7 days' + INTERVAL '21 hours 30 minutes', 'bedtime', 'Before sleep', 'manual'),

    -- Day 6
    (auth.uid(), 85.4, 'mg/dL', NOW() - INTERVAL '6 days' + INTERVAL '7 hours', 'fasting', 'Morning reading', 'manual'),
    (auth.uid(), 139.7, 'mg/dL', NOW() - INTERVAL '6 days' + INTERVAL '9 hours 15 minutes', 'post-meal', 'After breakfast', 'manual'),
    (auth.uid(), 121.8, 'mg/dL', NOW() - INTERVAL '6 days' + INTERVAL '12 hours 45 minutes', 'post-meal', 'After lunch', 'manual'),
    (auth.uid(), 107.2, 'mg/dL', NOW() - INTERVAL '6 days' + INTERVAL '18 hours', 'pre-meal', 'Before dinner', 'manual'),

    -- Day 5
    (auth.uid(), 94.6, 'mg/dL', NOW() - INTERVAL '5 days' + INTERVAL '6 hours 30 minutes', 'fasting', 'Morning reading', 'manual'),
    (auth.uid(), 134.1, 'mg/dL', NOW() - INTERVAL '5 days' + INTERVAL '8 hours 45 minutes', 'post-meal', 'After breakfast', 'manual'),
    (auth.uid(), 148.9, 'mg/dL', NOW() - INTERVAL '5 days' + INTERVAL '13 hours 30 minutes', 'post-meal', 'After lunch', 'manual'),
    (auth.uid(), 116.3, 'mg/dL', NOW() - INTERVAL '5 days' + INTERVAL '17 hours 45 minutes', 'pre-meal', 'Before dinner', 'manual'),
    (auth.uid(), 103.5, 'mg/dL', NOW() - INTERVAL '5 days' + INTERVAL '22 hours 15 minutes', 'bedtime', 'Before sleep', 'manual'),

    -- Day 4
    (auth.uid(), 91.8, 'mg/dL', NOW() - INTERVAL '4 days' + INTERVAL '7 hours 15 minutes', 'fasting', 'Morning reading', 'manual'),
    (auth.uid(), 127.4, 'mg/dL', NOW() - INTERVAL '4 days' + INTERVAL '9 hours', 'post-meal', 'After breakfast', 'manual'),
    (auth.uid(), 141.2, 'mg/dL', NOW() - INTERVAL '4 days' + INTERVAL '12 hours 30 minutes', 'post-meal', 'After lunch', 'manual'),
    (auth.uid(), 109.7, 'mg/dL', NOW() - INTERVAL '4 days' + INTERVAL '18 hours 30 minutes', 'pre-meal', 'Before dinner', 'manual'),

    -- Day 3
    (auth.uid(), 96.2, 'mg/dL', NOW() - INTERVAL '3 days' + INTERVAL '6 hours 45 minutes', 'fasting', 'Morning reading', 'manual'),
    (auth.uid(), 152.6, 'mg/dL', NOW() - INTERVAL '3 days' + INTERVAL '8 hours 30 minutes', 'post-meal', 'After breakfast', 'manual'),
    (auth.uid(), 124.9, 'mg/dL', NOW() - INTERVAL '3 days' + INTERVAL '13 hours', 'post-meal', 'After lunch', 'manual'),
    (auth.uid(), 113.8, 'mg/dL', NOW() - INTERVAL '3 days' + INTERVAL '17 hours 15 minutes', 'pre-meal', 'Before dinner', 'manual'),
    (auth.uid(), 101.4, 'mg/dL', NOW() - INTERVAL '3 days' + INTERVAL '21 hours 45 minutes', 'bedtime', 'Before sleep', 'manual'),

    -- Day 2
    (auth.uid(), 89.5, 'mg/dL', NOW() - INTERVAL '2 days' + INTERVAL '7 hours', 'fasting', 'Morning reading', 'manual'),
    (auth.uid(), 136.3, 'mg/dL', NOW() - INTERVAL '2 days' + INTERVAL '9 hours 30 minutes', 'post-meal', 'After breakfast', 'manual'),
    (auth.uid(), 119.7, 'mg/dL', NOW() - INTERVAL '2 days' + INTERVAL '12 hours 45 minutes', 'post-meal', 'After lunch', 'manual'),
    (auth.uid(), 105.1, 'mg/dL', NOW() - INTERVAL '2 days' + INTERVAL '18 hours', 'pre-meal', 'Before dinner', 'manual'),

    -- Day 1 (yesterday)
    (auth.uid(), 93.7, 'mg/dL', NOW() - INTERVAL '1 day' + INTERVAL '6 hours 30 minutes', 'fasting', 'Morning reading', 'manual'),
    (auth.uid(), 144.8, 'mg/dL', NOW() - INTERVAL '1 day' + INTERVAL '8 hours 45 minutes', 'post-meal', 'After breakfast', 'manual'),
    (auth.uid(), 131.5, 'mg/dL', NOW() - INTERVAL '1 day' + INTERVAL '13 hours 15 minutes', 'post-meal', 'After lunch', 'manual'),
    (auth.uid(), 108.2, 'mg/dL', NOW() - INTERVAL '1 day' + INTERVAL '17 hours 30 minutes', 'pre-meal', 'Before dinner', 'manual'),
    (auth.uid(), 97.9, 'mg/dL', NOW() - INTERVAL '1 day' + INTERVAL '22 hours', 'bedtime', 'Before sleep', 'manual'),

    -- Today
    (auth.uid(), 87.3, 'mg/dL', NOW() - INTERVAL '17 hours 30 minutes', 'fasting', 'Morning reading', 'manual'),
    (auth.uid(), 138.4, 'mg/dL', NOW() - INTERVAL '15 hours 15 minutes', 'post-meal', 'After breakfast', 'manual'),
    (auth.uid(), 126.7, 'mg/dL', NOW() - INTERVAL '11 hours 45 minutes', 'post-meal', 'After lunch', 'manual'),
    (auth.uid(), 111.9, 'mg/dL', NOW() - INTERVAL '5 hours 30 minutes', 'pre-meal', 'Before dinner', 'manual');
  END IF;
END;
$$;
