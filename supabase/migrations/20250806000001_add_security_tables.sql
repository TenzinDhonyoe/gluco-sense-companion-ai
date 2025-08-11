-- Add security-related tables for rate limiting and audit logging

-- Rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rate_limit_key TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for efficient rate limit queries
CREATE INDEX IF NOT EXISTS idx_rate_limits_key_timestamp ON rate_limits(rate_limit_key, timestamp);
CREATE INDEX IF NOT EXISTS idx_rate_limits_timestamp ON rate_limits(timestamp);

-- Audit logging table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  success BOOLEAN DEFAULT TRUE,
  timestamp TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ip_address INET,
  user_agent TEXT
);

-- Index for efficient audit log queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_endpoint_timestamp ON audit_logs(endpoint, timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);

-- Row Level Security for rate_limits table
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own rate limit records" ON rate_limits
  FOR ALL USING (auth.uid() = user_id);

-- Row Level Security for audit_logs table  
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own audit logs" ON audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage all records for cleanup
CREATE POLICY "Service role can manage all rate limit records" ON rate_limits
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage all audit logs" ON audit_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Function to clean up old rate limit records (runs daily)
CREATE OR REPLACE FUNCTION cleanup_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM rate_limits 
  WHERE timestamp < NOW() - INTERVAL '24 hours';
END;
$$;

-- Function to clean up old audit logs (keep 90 days)
CREATE OR REPLACE FUNCTION cleanup_audit_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM audit_logs 
  WHERE timestamp < NOW() - INTERVAL '90 days';
END;
$$;