-- Grant schema usage to both roles
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Users table permissions
GRANT INSERT, SELECT, UPDATE ON public.users TO anon;
GRANT INSERT, SELECT, UPDATE ON public.users TO authenticated;

-- API Keys table permissions
GRANT INSERT, SELECT, UPDATE, DELETE ON public.api_keys TO anon;
GRANT INSERT, SELECT, UPDATE, DELETE ON public.api_keys TO authenticated;

-- Tool Logs table permissions
GRANT INSERT, SELECT ON public.tool_logs TO anon;
GRANT INSERT, SELECT ON public.tool_logs TO authenticated;

-- Usage Summaries table permissions
GRANT INSERT, SELECT, UPDATE ON public.usage_summaries TO anon;
GRANT INSERT, SELECT, UPDATE ON public.usage_summaries TO authenticated;

-- Grant usage on sequences (if any exist)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public'
    LOOP
        EXECUTE 'GRANT USAGE ON SEQUENCE public.' || quote_ident(r.sequence_name) || ' TO anon';
        EXECUTE 'GRANT USAGE ON SEQUENCE public.' || quote_ident(r.sequence_name) || ' TO authenticated';
    END LOOP;
END $$; 