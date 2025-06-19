
-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a cron job that runs every 5 minutes to generate glucose readings
SELECT cron.schedule(
    'generate-glucose-readings-every-5min',
    '*/5 * * * *', -- Every 5 minutes
    $$
    SELECT
        net.http_post(
            url := 'https://xpsvcmozrxfmfelnotyj.supabase.co/functions/v1/generate-glucose-reading',
            headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhwc3ZjbW96cnhmbWZlbG5vdHlqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMTQ4ODcsImV4cCI6MjA2NTY5MDg4N30.gjSh2_PCF4AX_GGwgI-Fb-U5AqATlL5dANV-Kf_h-xg"}'::jsonb,
            body := '{"scheduled": true}'::jsonb
        ) as request_id;
    $$
);

-- Create an index to optimize queries for sensor readings
CREATE INDEX IF NOT EXISTS idx_glucose_readings_sensor_timestamp 
ON public.glucose_readings(user_id, timestamp DESC) 
WHERE source = 'sensor';
