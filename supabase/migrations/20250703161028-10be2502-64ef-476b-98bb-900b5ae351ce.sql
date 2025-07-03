-- Insert sample glucose data for specific user
INSERT INTO public.glucose_readings (user_id, value, unit, timestamp, tag, notes, source) VALUES
-- Day 10 (oldest)
('58d88a39-494b-462f-8166-bd661a7e8b26', 95.5, 'mg/dL', NOW() - INTERVAL '10 days' + INTERVAL '7 hours', 'fasting', 'Morning reading', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 125.2, 'mg/dL', NOW() - INTERVAL '10 days' + INTERVAL '12 hours', 'post-meal', 'After lunch', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 110.8, 'mg/dL', NOW() - INTERVAL '10 days' + INTERVAL '18 hours', 'pre-meal', 'Before dinner', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 102.3, 'mg/dL', NOW() - INTERVAL '10 days' + INTERVAL '21 hours', 'bedtime', 'Before sleep', 'manual'),

-- Day 9
('58d88a39-494b-462f-8166-bd661a7e8b26', 88.7, 'mg/dL', NOW() - INTERVAL '9 days' + INTERVAL '6 hours 30 minutes', 'fasting', 'Morning reading', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 142.1, 'mg/dL', NOW() - INTERVAL '9 days' + INTERVAL '8 hours 45 minutes', 'post-meal', 'After breakfast', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 118.5, 'mg/dL', NOW() - INTERVAL '9 days' + INTERVAL '13 hours', 'post-meal', 'After lunch', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 95.2, 'mg/dL', NOW() - INTERVAL '9 days' + INTERVAL '17 hours 30 minutes', 'pre-meal', 'Before dinner', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 108.9, 'mg/dL', NOW() - INTERVAL '9 days' + INTERVAL '22 hours', 'bedtime', 'Before sleep', 'manual'),

-- Day 8
('58d88a39-494b-462f-8166-bd661a7e8b26', 92.3, 'mg/dL', NOW() - INTERVAL '8 days' + INTERVAL '7 hours 15 minutes', 'fasting', 'Morning reading', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 156.8, 'mg/dL', NOW() - INTERVAL '8 days' + INTERVAL '9 hours', 'post-meal', 'After breakfast', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 132.4, 'mg/dL', NOW() - INTERVAL '8 days' + INTERVAL '12 hours 30 minutes', 'post-meal', 'After lunch', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 104.7, 'mg/dL', NOW() - INTERVAL '8 days' + INTERVAL '18 hours 15 minutes', 'pre-meal', 'Before dinner', 'manual'),

-- Day 7
('58d88a39-494b-462f-8166-bd661a7e8b26', 97.1, 'mg/dL', NOW() - INTERVAL '7 days' + INTERVAL '6 hours 45 minutes', 'fasting', 'Morning reading', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 128.9, 'mg/dL', NOW() - INTERVAL '7 days' + INTERVAL '8 hours 30 minutes', 'post-meal', 'After breakfast', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 145.3, 'mg/dL', NOW() - INTERVAL '7 days' + INTERVAL '13 hours 15 minutes', 'post-meal', 'After lunch', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 112.6, 'mg/dL', NOW() - INTERVAL '7 days' + INTERVAL '17 hours', 'pre-meal', 'Before dinner', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 99.8, 'mg/dL', NOW() - INTERVAL '7 days' + INTERVAL '21 hours 30 minutes', 'bedtime', 'Before sleep', 'manual'),

-- Day 6
('58d88a39-494b-462f-8166-bd661a7e8b26', 85.4, 'mg/dL', NOW() - INTERVAL '6 days' + INTERVAL '7 hours', 'fasting', 'Morning reading', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 139.7, 'mg/dL', NOW() - INTERVAL '6 days' + INTERVAL '9 hours 15 minutes', 'post-meal', 'After breakfast', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 121.8, 'mg/dL', NOW() - INTERVAL '6 days' + INTERVAL '12 hours 45 minutes', 'post-meal', 'After lunch', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 107.2, 'mg/dL', NOW() - INTERVAL '6 days' + INTERVAL '18 hours', 'pre-meal', 'Before dinner', 'manual'),

-- Day 5
('58d88a39-494b-462f-8166-bd661a7e8b26', 94.6, 'mg/dL', NOW() - INTERVAL '5 days' + INTERVAL '6 hours 30 minutes', 'fasting', 'Morning reading', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 134.1, 'mg/dL', NOW() - INTERVAL '5 days' + INTERVAL '8 hours 45 minutes', 'post-meal', 'After breakfast', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 148.9, 'mg/dL', NOW() - INTERVAL '5 days' + INTERVAL '13 hours 30 minutes', 'post-meal', 'After lunch', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 116.3, 'mg/dL', NOW() - INTERVAL '5 days' + INTERVAL '17 hours 45 minutes', 'pre-meal', 'Before dinner', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 103.5, 'mg/dL', NOW() - INTERVAL '5 days' + INTERVAL '22 hours 15 minutes', 'bedtime', 'Before sleep', 'manual'),

-- Day 4
('58d88a39-494b-462f-8166-bd661a7e8b26', 91.8, 'mg/dL', NOW() - INTERVAL '4 days' + INTERVAL '7 hours 15 minutes', 'fasting', 'Morning reading', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 127.4, 'mg/dL', NOW() - INTERVAL '4 days' + INTERVAL '9 hours', 'post-meal', 'After breakfast', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 141.2, 'mg/dL', NOW() - INTERVAL '4 days' + INTERVAL '12 hours 30 minutes', 'post-meal', 'After lunch', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 109.7, 'mg/dL', NOW() - INTERVAL '4 days' + INTERVAL '18 hours 30 minutes', 'pre-meal', 'Before dinner', 'manual'),

-- Day 3
('58d88a39-494b-462f-8166-bd661a7e8b26', 96.2, 'mg/dL', NOW() - INTERVAL '3 days' + INTERVAL '6 hours 45 minutes', 'fasting', 'Morning reading', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 152.6, 'mg/dL', NOW() - INTERVAL '3 days' + INTERVAL '8 hours 30 minutes', 'post-meal', 'After breakfast', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 124.9, 'mg/dL', NOW() - INTERVAL '3 days' + INTERVAL '13 hours', 'post-meal', 'After lunch', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 113.8, 'mg/dL', NOW() - INTERVAL '3 days' + INTERVAL '17 hours 15 minutes', 'pre-meal', 'Before dinner', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 101.4, 'mg/dL', NOW() - INTERVAL '3 days' + INTERVAL '21 hours 45 minutes', 'bedtime', 'Before sleep', 'manual'),

-- Day 2
('58d88a39-494b-462f-8166-bd661a7e8b26', 89.5, 'mg/dL', NOW() - INTERVAL '2 days' + INTERVAL '7 hours', 'fasting', 'Morning reading', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 136.3, 'mg/dL', NOW() - INTERVAL '2 days' + INTERVAL '9 hours 30 minutes', 'post-meal', 'After breakfast', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 119.7, 'mg/dL', NOW() - INTERVAL '2 days' + INTERVAL '12 hours 45 minutes', 'post-meal', 'After lunch', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 105.1, 'mg/dL', NOW() - INTERVAL '2 days' + INTERVAL '18 hours', 'pre-meal', 'Before dinner', 'manual'),

-- Day 1 (yesterday)
('58d88a39-494b-462f-8166-bd661a7e8b26', 93.7, 'mg/dL', NOW() - INTERVAL '1 day' + INTERVAL '6 hours 30 minutes', 'fasting', 'Morning reading', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 144.8, 'mg/dL', NOW() - INTERVAL '1 day' + INTERVAL '8 hours 45 minutes', 'post-meal', 'After breakfast', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 131.5, 'mg/dL', NOW() - INTERVAL '1 day' + INTERVAL '13 hours 15 minutes', 'post-meal', 'After lunch', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 108.2, 'mg/dL', NOW() - INTERVAL '1 day' + INTERVAL '17 hours 30 minutes', 'pre-meal', 'Before dinner', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 97.9, 'mg/dL', NOW() - INTERVAL '1 day' + INTERVAL '22 hours', 'bedtime', 'Before sleep', 'manual'),

-- Today
('58d88a39-494b-462f-8166-bd661a7e8b26', 87.3, 'mg/dL', NOW() - INTERVAL '17 hours 30 minutes', 'fasting', 'Morning reading', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 138.4, 'mg/dL', NOW() - INTERVAL '15 hours 15 minutes', 'post-meal', 'After breakfast', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 126.7, 'mg/dL', NOW() - INTERVAL '11 hours 45 minutes', 'post-meal', 'After lunch', 'manual'),
('58d88a39-494b-462f-8166-bd661a7e8b26', 111.9, 'mg/dL', NOW() - INTERVAL '5 hours 30 minutes', 'pre-meal', 'Before dinner', 'manual');