-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant privileges on users table
GRANT SELECT, INSERT, UPDATE ON public.users TO anon, authenticated;

-- Grant privileges on api_keys table
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO anon, authenticated;

-- Grant privileges on tool_logs table
GRANT SELECT, INSERT ON public.tool_logs TO anon, authenticated;

-- Grant privileges on usage_summaries table
GRANT SELECT, INSERT, UPDATE ON public.usage_summaries TO anon, authenticated; 