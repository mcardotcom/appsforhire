-- Create usage_summaries table
CREATE TABLE IF NOT EXISTS usage_summaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    total_calls INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    success_rate DECIMAL DEFAULT 0,
    avg_response_time INTEGER DEFAULT 0,
    calls_change INTEGER DEFAULT 0,
    tokens_change INTEGER DEFAULT 0,
    success_rate_change DECIMAL DEFAULT 0,
    response_time_change INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create tool_logs table
CREATE TABLE IF NOT EXISTS tool_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    tool_name TEXT NOT NULL,
    tool_version TEXT NOT NULL,
    status TEXT NOT NULL,
    execution_time_ms INTEGER,
    tokens_used INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    key_name TEXT NOT NULL,
    key_value TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    last_used_at TIMESTAMP WITH TIME ZONE
);

-- Create RLS policies
ALTER TABLE usage_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE tool_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Usage summaries policies
CREATE POLICY "Users can view their own usage summaries"
    ON usage_summaries FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage summaries"
    ON usage_summaries FOR UPDATE
    USING (auth.uid() = user_id);

-- Tool logs policies
CREATE POLICY "Users can view their own tool logs"
    ON tool_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tool logs"
    ON tool_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- API keys policies
CREATE POLICY "Users can view their own API keys"
    ON api_keys FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own API keys"
    ON api_keys FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys"
    ON api_keys FOR UPDATE
    USING (auth.uid() = user_id);

-- Create functions and triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_usage_summaries_updated_at
    BEFORE UPDATE ON usage_summaries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 