-- Add Plan-related tables for goals, experiments, and user preferences

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    preferred_units TEXT DEFAULT 'mg/dL' CHECK (preferred_units IN ('mg/dL', 'mmol/L')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- User goals table 
CREATE TABLE IF NOT EXISTS user_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    target_per_week INTEGER NOT NULL DEFAULT 1 CHECK (target_per_week > 0),
    progress_this_week INTEGER DEFAULT 0 CHECK (progress_this_week >= 0),
    reminders_enabled BOOLEAN DEFAULT true,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Micro experiments table
CREATE TABLE IF NOT EXISTS micro_experiments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    experiment_type TEXT NOT NULL CHECK (experiment_type IN ('late_night_cutoff', 'post_dinner_walk', 'sleep_plus_30')),
    title TEXT NOT NULL,
    description TEXT,
    duration_weeks INTEGER DEFAULT 2 CHECK (duration_weeks > 0),
    status TEXT DEFAULT 'available' CHECK (status IN ('available', 'active', 'completed')),
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    before_score INTEGER CHECK (before_score >= 0 AND before_score <= 100),
    during_score INTEGER CHECK (during_score >= 0 AND during_score <= 100),
    outcome TEXT CHECK (outcome IN ('helped', 'inconclusive', 'noEffect')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- AI suggestion state table (to track dismissed/snoozed suggestions)
CREATE TABLE IF NOT EXISTS ai_suggestion_state (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    suggestion_hash TEXT NOT NULL, -- Hash of suggestion content to identify duplicates
    action TEXT NOT NULL CHECK (action IN ('try_for_week', 'snooze', 'not_relevant', 'why_this')),
    action_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE, -- For snoozed suggestions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS) policies
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE micro_experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_suggestion_state ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_preferences
CREATE POLICY "Users can view own preferences" ON user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON user_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own preferences" ON user_preferences FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for user_goals
CREATE POLICY "Users can view own goals" ON user_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON user_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON user_goals FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON user_goals FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for micro_experiments
CREATE POLICY "Users can view own experiments" ON micro_experiments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own experiments" ON micro_experiments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own experiments" ON micro_experiments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own experiments" ON micro_experiments FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for ai_suggestion_state
CREATE POLICY "Users can view own suggestion state" ON ai_suggestion_state FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own suggestion state" ON ai_suggestion_state FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own suggestion state" ON ai_suggestion_state FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own suggestion state" ON ai_suggestion_state FOR DELETE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX idx_user_goals_user_id ON user_goals(user_id);
CREATE INDEX idx_user_goals_status ON user_goals(user_id, status);
CREATE INDEX idx_micro_experiments_user_id ON micro_experiments(user_id);
CREATE INDEX idx_micro_experiments_status ON micro_experiments(user_id, status);
CREATE INDEX idx_ai_suggestion_state_user_id ON ai_suggestion_state(user_id);
CREATE INDEX idx_ai_suggestion_state_expires ON ai_suggestion_state(user_id, expires_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_user_goals_updated_at BEFORE UPDATE ON user_goals 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_micro_experiments_updated_at BEFORE UPDATE ON micro_experiments 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Insert default experiments for all users
INSERT INTO micro_experiments (user_id, experiment_type, title, description, duration_weeks, status) 
SELECT 
    id as user_id,
    'late_night_cutoff' as experiment_type,
    'Late-Night Cutoff' as title,
    'No meals after 9 PM for 2 weeks' as description,
    2 as duration_weeks,
    'available' as status
FROM auth.users 
WHERE id NOT IN (
    SELECT user_id FROM micro_experiments WHERE experiment_type = 'late_night_cutoff'
);

INSERT INTO micro_experiments (user_id, experiment_type, title, description, duration_weeks, status) 
SELECT 
    id as user_id,
    'post_dinner_walk' as experiment_type,
    'Post-Dinner Walk' as title,
    '10-minute walk after dinner' as description,
    2 as duration_weeks,
    'available' as status
FROM auth.users 
WHERE id NOT IN (
    SELECT user_id FROM micro_experiments WHERE experiment_type = 'post_dinner_walk'
);

INSERT INTO micro_experiments (user_id, experiment_type, title, description, duration_weeks, status) 
SELECT 
    id as user_id,
    'sleep_plus_30' as experiment_type,
    'Sleep +30 min' as title,
    'Go to bed 30 minutes earlier' as description,
    2 as duration_weeks,
    'available' as status
FROM auth.users 
WHERE id NOT IN (
    SELECT user_id FROM micro_experiments WHERE experiment_type = 'sleep_plus_30'
);