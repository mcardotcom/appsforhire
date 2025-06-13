-- Schema access
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Table access
GRANT SELECT, INSERT, UPDATE ON public.users TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO anon, authenticated;
GRANT SELECT, INSERT ON public.tool_logs TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.usage_summaries TO anon, authenticated;

-- Sequences (for UUID fallback or serial-based IDs)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public'
    LOOP
        EXECUTE format('GRANT USAGE ON SEQUENCE public.%I TO anon', r.sequence_name);
        EXECUTE format('GRANT USAGE ON SEQUENCE public.%I TO authenticated', r.sequence_name);
    END LOOP;
END $$; 