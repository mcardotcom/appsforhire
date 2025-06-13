-- Drop existing users table and recreate with correct schema
DROP TABLE IF EXISTS public.users CASCADE;

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY, -- must match auth.uid()
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own data" ON public.users;
DROP POLICY IF EXISTS "Users can update their own data" ON public.users;
DROP POLICY IF EXISTS "Service role can do everything on users" ON public.users;

-- Recreate policies with proper checks
CREATE POLICY "Users can view their own data"
ON public.users
FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own data"
ON public.users
FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own data"
ON public.users
FOR UPDATE
USING (auth.uid() = id);

CREATE POLICY "Service role can do everything on users"
ON public.users
USING (auth.jwt() ->> 'role' = 'service_role'); 