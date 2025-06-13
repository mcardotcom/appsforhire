-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Users can view their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can insert their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can update their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can delete their own API keys" ON public.api_keys;
DROP POLICY IF EXISTS "Users can view their own tool logs" ON public.tool_logs;
DROP POLICY IF EXISTS "Users can insert their own tool logs" ON public.tool_logs;
DROP POLICY IF EXISTS "Users can view their own usage summaries" ON public.usage_summaries;
DROP POLICY IF EXISTS "Users can insert their own usage summaries" ON public.usage_summaries;
DROP POLICY IF EXISTS "Users can update their own usage summaries" ON public.usage_summaries;
DROP POLICY IF EXISTS "Service role can do everything on users" ON public.users;
DROP POLICY IF EXISTS "Service role can do everything on api_keys" ON public.api_keys;
DROP POLICY IF EXISTS "Service role can do everything on tool_logs" ON public.tool_logs;
DROP POLICY IF EXISTS "Service role can do everything on usage_summaries" ON public.usage_summaries;

-- Enable RLS on all tables if not already enabled
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'users' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'api_keys' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'tool_logs' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.tool_logs ENABLE ROW LEVEL SECURITY;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'usage_summaries' 
        AND rowsecurity = true
    ) THEN
        ALTER TABLE public.usage_summaries ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create policies only if they don't exist
DO $$ 
BEGIN
    -- Users table policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'users' 
        AND policyname = 'Users can view their own data'
    ) THEN
        CREATE POLICY "Users can view their own data"
        ON public.users
        FOR SELECT
        USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'users' 
        AND policyname = 'Users can insert their own data'
    ) THEN
        CREATE POLICY "Users can insert their own data"
        ON public.users
        FOR INSERT
        WITH CHECK (auth.uid() = id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'users' 
        AND policyname = 'Users can update their own data'
    ) THEN
        CREATE POLICY "Users can update their own data"
        ON public.users
        FOR UPDATE
        USING (auth.uid() = id);
    END IF;

    -- API Keys table policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'api_keys' 
        AND policyname = 'Users can view their own API keys'
    ) THEN
        CREATE POLICY "Users can view their own API keys"
        ON public.api_keys
        FOR SELECT
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'api_keys' 
        AND policyname = 'Users can insert their own API keys'
    ) THEN
        CREATE POLICY "Users can insert their own API keys"
        ON public.api_keys
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'api_keys' 
        AND policyname = 'Users can update their own API keys'
    ) THEN
        CREATE POLICY "Users can update their own API keys"
        ON public.api_keys
        FOR UPDATE
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'api_keys' 
        AND policyname = 'Users can delete their own API keys'
    ) THEN
        CREATE POLICY "Users can delete their own API keys"
        ON public.api_keys
        FOR DELETE
        USING (auth.uid() = user_id);
    END IF;

    -- Tool Logs table policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'tool_logs' 
        AND policyname = 'Users can view their own tool logs'
    ) THEN
        CREATE POLICY "Users can view their own tool logs"
        ON public.tool_logs
        FOR SELECT
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'tool_logs' 
        AND policyname = 'Users can insert their own tool logs'
    ) THEN
        CREATE POLICY "Users can insert their own tool logs"
        ON public.tool_logs
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    END IF;

    -- Usage Summaries table policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'usage_summaries' 
        AND policyname = 'Users can view their own usage summaries'
    ) THEN
        CREATE POLICY "Users can view their own usage summaries"
        ON public.usage_summaries
        FOR SELECT
        USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'usage_summaries' 
        AND policyname = 'Users can insert their own usage summaries'
    ) THEN
        CREATE POLICY "Users can insert their own usage summaries"
        ON public.usage_summaries
        FOR INSERT
        WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'usage_summaries' 
        AND policyname = 'Users can update their own usage summaries'
    ) THEN
        CREATE POLICY "Users can update their own usage summaries"
        ON public.usage_summaries
        FOR UPDATE
        USING (auth.uid() = user_id);
    END IF;

    -- Service role bypass policies
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'users' 
        AND policyname = 'Service role can do everything on users'
    ) THEN
        CREATE POLICY "Service role can do everything on users"
        ON public.users
        USING (auth.jwt() ->> 'role' = 'service_role');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'api_keys' 
        AND policyname = 'Service role can do everything on api_keys'
    ) THEN
        CREATE POLICY "Service role can do everything on api_keys"
        ON public.api_keys
        USING (auth.jwt() ->> 'role' = 'service_role');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'tool_logs' 
        AND policyname = 'Service role can do everything on tool_logs'
    ) THEN
        CREATE POLICY "Service role can do everything on tool_logs"
        ON public.tool_logs
        USING (auth.jwt() ->> 'role' = 'service_role');
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'usage_summaries' 
        AND policyname = 'Service role can do everything on usage_summaries'
    ) THEN
        CREATE POLICY "Service role can do everything on usage_summaries"
        ON public.usage_summaries
        USING (auth.jwt() ->> 'role' = 'service_role');
    END IF;
END $$; 