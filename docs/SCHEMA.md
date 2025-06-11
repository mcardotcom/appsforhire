users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  subscription_plan TEXT DEFAULT 'free',
  role TEXT DEFAULT 'user' -- 'user', 'admin', 'super_admin'
);

super_admins Table
CREATE TABLE super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  added_by UUID REFERENCES users(id), -- optional, for audit trail
  created_at TIMESTAMP DEFAULT now(),
  notes TEXT -- optional metadata (e.g., founder, technical lead, etc.)
);

api_keys Table (with rate limiting support)
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  key TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  rate_limit_per_minute INTEGER DEFAULT 100,
  last_request_at TIMESTAMP
burst_limit INTEGER DEFAULT 10, -- allow bursts
window_seconds INTEGER DEFAULT 60 -- sliding window
);

tools Table (optional but helpful for UI/docs)
CREATE TABLE tools ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, -- REMOVE UNIQUE constraint description TEXT, version TEXT DEFAULT 'v1', -- CHANGE from '1.0' to 'v1' is_active BOOLEAN DEFAULT true, endpoint_path TEXT NOT NULL, UNIQUE(name, version) -- ADD compound unique constraint );






tool_logs Table (with observability metrics)
CREATE TABLE tool_logs ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(), user_id UUID REFERENCES users(id) ON DELETE CASCADE, api_key_id UUID REFERENCES api_keys(id) ON DELETE CASCADE, tool_name TEXT NOT NULL, tool_version TEXT DEFAULT 'v1', -- ADD THIS LINE input_payload JSONB, output_payload JSONB, created_at TIMESTAMP DEFAULT now(), status TEXT DEFAULT 'success', execution_time_ms INTEGER, tokens_used INTEGER, error_message TEXT );




usage_summaries Table (for billing or dashboards)
CREATE TABLE usage_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL, -- format 'YYYY-MM'
  total_calls INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, month_year)
);


