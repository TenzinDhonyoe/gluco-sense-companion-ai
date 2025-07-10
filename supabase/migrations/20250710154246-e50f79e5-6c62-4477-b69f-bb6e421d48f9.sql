-- Insert a full week of sample glucose data with daily fluctuations for user 58d88a39-494b-462f-8166-bd661a7e8b26
INSERT INTO public.glucose_readings (user_id, value, unit, timestamp, tag, notes, source) VALUES
-- Day 7 (oldest)
('58d88a39-494b-462f-8166-bd661a7e8b26', 94.2, 'mg/dL', NOW() - INTERVAL '7 days' + INTERVAL '6 hours 45 minutes', 'fasting', 'Morning reading', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 138.7, 'mg/dL', NOW() - INTERVAL '7 days' + INTERVAL '8 hours 30 minutes', 'post-meal', 'After breakfast', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 106.5, 'mg/dL', NOW() - INTERVAL '7 days' + INTERVAL '11 hours', 'random', 'Mid-morning check', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 115.3, 'mg/dL', NOW() - INTERVAL '7 days' + INTERVAL '12 hours 15 minutes', 'pre-meal', 'Before lunch', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 164.8, 'mg/dL', NOW() - INTERVAL '7 days' + INTERVAL '13 hours 45 minutes', 'post-meal', 'After lunch', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 128.2, 'mg/dL', NOW() - INTERVAL '7 days' + INTERVAL '15 hours 30 minutes', 'random', 'Afternoon reading', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 111.7, 'mg/dL', NOW() - INTERVAL '7 days' + INTERVAL '18 hours', 'pre-meal', 'Before dinner', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 142.1, 'mg/dL', NOW() - INTERVAL '7 days' + INTERVAL '19 hours 30 minutes', 'post-meal', 'After dinner', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 98.6, 'mg/dL', NOW() - INTERVAL '7 days' + INTERVAL '22 hours', 'bedtime', 'Before sleep', 'manual'),

-- Day 6
('58d88a39-494b-462f-8166-bd661a7e8b26', 89.4, 'mg/dL', NOW() - INTERVAL '6 days' + INTERVAL '7 hours', 'fasting', 'Morning reading', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 145.9, 'mg/dL', NOW() - INTERVAL '6 days' + INTERVAL '8 hours 45 minutes', 'post-meal', 'After breakfast', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 122.3, 'mg/dL', NOW() - INTERVAL '6 days' + INTERVAL '10 hours 30 minutes', 'random', 'Mid-morning snack', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 108.8, 'mg/dL', NOW() - INTERVAL '6 days' + INTERVAL '12 hours', 'pre-meal', 'Before lunch', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 158.5, 'mg/dL', NOW() - INTERVAL '6 days' + INTERVAL '13 hours 30 minutes', 'post-meal', 'After lunch', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 131.7, 'mg/dL', NOW() - INTERVAL '6 days' + INTERVAL '16 hours', 'random', 'Late afternoon', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 118.2, 'mg/dL', NOW() - INTERVAL '6 days' + INTERVAL '17 hours 45 minutes', 'pre-meal', 'Before dinner', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 149.6, 'mg/dL', NOW() - INTERVAL '6 days' + INTERVAL '19 hours 15 minutes', 'post-meal', 'After dinner', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 103.4, 'mg/dL', NOW() - INTERVAL '6 days' + INTERVAL '21 hours 30 minutes', 'bedtime', 'Before sleep', 'manual'),

-- Day 5
('58d88a39-494b-462f-8166-bd661a7e8b26', 92.7, 'mg/dL', NOW() - INTERVAL '5 days' + INTERVAL '6 hours 30 minutes', 'fasting', 'Morning reading', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 134.2, 'mg/dL', NOW() - INTERVAL '5 days' + INTERVAL '8 hours 15 minutes', 'post-meal', 'After breakfast', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 116.8, 'mg/dL', NOW() - INTERVAL '5 days' + INTERVAL '11 hours 30 minutes', 'random', 'Mid-morning', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 103.5, 'mg/dL', NOW() - INTERVAL '5 days' + INTERVAL '12 hours 45 minutes', 'pre-meal', 'Before lunch', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 171.3, 'mg/dL', NOW() - INTERVAL '5 days' + INTERVAL '14 hours', 'post-meal', 'After lunch - high carb meal', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 143.7, 'mg/dL', NOW() - INTERVAL '5 days' + INTERVAL '15 hours 45 minutes', 'random', 'Post-lunch elevated', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 125.4, 'mg/dL', NOW() - INTERVAL '5 days' + INTERVAL '17 hours 30 minutes', 'pre-meal', 'Before dinner', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 156.8, 'mg/dL', NOW() - INTERVAL '5 days' + INTERVAL '19 hours', 'post-meal', 'After dinner', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 107.9, 'mg/dL', NOW() - INTERVAL '5 days' + INTERVAL '22 hours 15 minutes', 'bedtime', 'Before sleep', 'manual'),

-- Day 4
('58d88a39-494b-462f-8166-bd661a7e8b26', 88.1, 'mg/dL', NOW() - INTERVAL '4 days' + INTERVAL '7 hours 15 minutes', 'fasting', 'Morning reading', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 141.6, 'mg/dL', NOW() - INTERVAL '4 days' + INTERVAL '9 hours', 'post-meal', 'After breakfast', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 119.3, 'mg/dL', NOW() - INTERVAL '4 days' + INTERVAL '11 hours 15 minutes', 'random', 'Mid-morning', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 112.7, 'mg/dL', NOW() - INTERVAL '4 days' + INTERVAL '12 hours 30 minutes', 'pre-meal', 'Before lunch', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 152.4, 'mg/dL', NOW() - INTERVAL '4 days' + INTERVAL '13 hours 45 minutes', 'post-meal', 'After lunch', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 136.8, 'mg/dL', NOW() - INTERVAL '4 days' + INTERVAL '16 hours 30 minutes', 'random', 'Afternoon reading', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 114.5, 'mg/dL', NOW() - INTERVAL '4 days' + INTERVAL '18 hours 15 minutes', 'pre-meal', 'Before dinner', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 139.2, 'mg/dL', NOW() - INTERVAL '4 days' + INTERVAL '19 hours 30 minutes', 'post-meal', 'After dinner', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 95.7, 'mg/dL', NOW() - INTERVAL '4 days' + INTERVAL '21 hours 45 minutes', 'bedtime', 'Before sleep', 'manual'),

-- Day 3
('58d88a39-494b-462f-8166-bd661a7e8b26', 91.3, 'mg/dL', NOW() - INTERVAL '3 days' + INTERVAL '6 hours 45 minutes', 'fasting', 'Morning reading', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 148.7, 'mg/dL', NOW() - INTERVAL '3 days' + INTERVAL '8 hours 30 minutes', 'post-meal', 'After breakfast', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 124.5, 'mg/dL', NOW() - INTERVAL '3 days' + INTERVAL '10 hours 45 minutes', 'random', 'Mid-morning coffee', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 109.8, 'mg/dL', NOW() - INTERVAL '3 days' + INTERVAL '12 hours 15 minutes', 'pre-meal', 'Before lunch', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 167.2, 'mg/dL', NOW() - INTERVAL '3 days' + INTERVAL '13 hours 30 minutes', 'post-meal', 'After lunch - pizza', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 145.1, 'mg/dL', NOW() - INTERVAL '3 days' + INTERVAL '15 hours', 'random', 'Still elevated', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 121.6, 'mg/dL', NOW() - INTERVAL '3 days' + INTERVAL '17 hours 45 minutes', 'pre-meal', 'Before dinner', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 144.9, 'mg/dL', NOW() - INTERVAL '3 days' + INTERVAL '19 hours 15 minutes', 'post-meal', 'After dinner', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 101.3, 'mg/dL', NOW() - INTERVAL '3 days' + INTERVAL '22 hours', 'bedtime', 'Before sleep', 'manual'),

-- Day 2
('58d88a39-494b-462f-8166-bd661a7e8b26', 86.9, 'mg/dL', NOW() - INTERVAL '2 days' + INTERVAL '7 hours', 'fasting', 'Morning reading', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 132.4, 'mg/dL', NOW() - INTERVAL '2 days' + INTERVAL '8 hours 45 minutes', 'post-meal', 'After breakfast', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 113.7, 'mg/dL', NOW() - INTERVAL '2 days' + INTERVAL '11 hours', 'random', 'Mid-morning', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 106.2, 'mg/dL', NOW() - INTERVAL '2 days' + INTERVAL '12 hours 30 minutes', 'pre-meal', 'Before lunch', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 159.8, 'mg/dL', NOW() - INTERVAL '2 days' + INTERVAL '14 hours', 'post-meal', 'After lunch', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 138.5, 'mg/dL', NOW() - INTERVAL '2 days' + INTERVAL '16 hours 15 minutes', 'random', 'Afternoon snack', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 117.3, 'mg/dL', NOW() - INTERVAL '2 days' + INTERVAL '18 hours', 'pre-meal', 'Before dinner', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 146.7, 'mg/dL', NOW() - INTERVAL '2 days' + INTERVAL '19 hours 45 minutes', 'post-meal', 'After dinner', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 98.4, 'mg/dL', NOW() - INTERVAL '2 days' + INTERVAL '21 hours 30 minutes', 'bedtime', 'Before sleep', 'manual'),

-- Day 1 (yesterday)
('58d88a39-494b-462f-8166-bd661a7e8b26', 93.5, 'mg/dL', NOW() - INTERVAL '1 day' + INTERVAL '6 hours 30 minutes', 'fasting', 'Morning reading', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 140.2, 'mg/dL', NOW() - INTERVAL '1 day' + INTERVAL '8 hours 15 minutes', 'post-meal', 'After breakfast', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 126.8, 'mg/dL', NOW() - INTERVAL '1 day' + INTERVAL '10 hours 30 minutes', 'random', 'Mid-morning', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 111.4, 'mg/dL', NOW() - INTERVAL '1 day' + INTERVAL '12 hours 45 minutes', 'pre-meal', 'Before lunch', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 163.7, 'mg/dL', NOW() - INTERVAL '1 day' + INTERVAL '13 hours 45 minutes', 'post-meal', 'After lunch', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 141.9, 'mg/dL', NOW() - INTERVAL '1 day' + INTERVAL '15 hours 30 minutes', 'random', 'Afternoon', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 123.6, 'mg/dL', NOW() - INTERVAL '1 day' + INTERVAL '17 hours 15 minutes', 'pre-meal', 'Before dinner', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 151.3, 'mg/dL', NOW() - INTERVAL '1 day' + INTERVAL '19 hours', 'post-meal', 'After dinner', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 104.7, 'mg/dL', NOW() - INTERVAL '1 day' + INTERVAL '22 hours 15 minutes', 'bedtime', 'Before sleep', 'manual'),

-- Today
('58d88a39-494b-462f-8166-bd661a7e8b26', 89.8, 'mg/dL', NOW() - INTERVAL '16 hours 30 minutes', 'fasting', 'Morning reading', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 137.5, 'mg/dL', NOW() - INTERVAL '14 hours 45 minutes', 'post-meal', 'After breakfast', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 120.2, 'mg/dL', NOW() - INTERVAL '12 hours 15 minutes', 'random', 'Mid-morning', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 108.6, 'mg/dL', NOW() - INTERVAL '10 hours 30 minutes', 'pre-meal', 'Before lunch', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 155.4, 'mg/dL', NOW() - INTERVAL '9 hours', 'post-meal', 'After lunch', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 133.7, 'mg/dL', NOW() - INTERVAL '6 hours 45 minutes', 'random', 'Afternoon', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 115.9, 'mg/dL', NOW() - INTERVAL '4 hours 30 minutes', 'pre-meal', 'Before dinner', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 148.1, 'mg/dL', NOW() - INTERVAL '3 hours', 'post-meal', 'After dinner', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 112.3, 'mg/dL', NOW() - INTERVAL '1 hour 15 minutes', 'random', 'Evening reading', 'manual');