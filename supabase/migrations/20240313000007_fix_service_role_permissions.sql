-- Grant schema usage to service_role
GRANT USAGE ON SCHEMA public TO service_role;

-- Grant all privileges on all tables to service_role
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO service_role;

-- Grant all privileges on all sequences to service_role
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Ensure service_role has access to future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO service_role; 