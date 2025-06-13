-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create api_keys table
CREATE TABLE IF NOT EXISTS public.api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    key TEXT UNIQUE NOT NULL,
    rate_limit_per_minute INTEGER NOT NULL DEFAULT 100,
    burst_limit INTEGER NOT NULL DEFAULT 10,
    window_seconds INTEGER NOT NULL DEFAULT 60,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create tool_logs table
CREATE TABLE IF NOT EXISTS public.tool_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    api_key_id UUID NOT NULL REFERENCES public.api_keys(id) ON DELETE CASCADE,
    tool_name TEXT NOT NULL,
    tool_version TEXT NOT NULL,
    input_payload JSONB NOT NULL,
    output_payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'success',
    execution_time_ms INTEGER,
    tokens_used INTEGER,
    error_message TEXT
);

-- Create usage_summaries table
CREATE TABLE IF NOT EXISTS public.usage_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    month_year TEXT NOT NULL,
    total_calls INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, month_year)
);

-- Create RLS policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tool_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_summaries ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own data" ON public.users
    FOR SELECT USING (auth.uid() = id);

-- API keys policies
CREATE POLICY "Users can view their own API keys" ON public.api_keys
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own API keys" ON public.api_keys
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own API keys" ON public.api_keys
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own API keys" ON public.api_keys
    FOR DELETE USING (auth.uid() = user_id);

-- Tool logs policies
CREATE POLICY "Users can view their own tool logs" ON public.tool_logs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own tool logs" ON public.tool_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usage summaries policies
CREATE POLICY "Users can view their own usage summaries" ON public.usage_summaries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own usage summaries" ON public.usage_summaries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own usage summaries" ON public.usage_summaries
    FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_tool_logs_user_id ON public.tool_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_tool_logs_api_key_id ON public.tool_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_usage_summaries_user_id ON public.usage_summaries(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_summaries_month_year ON public.usage_summaries(month_year); 