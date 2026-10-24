-- =================================================================
-- ELITE WEB KINGDOM - REAL-TIME COMPILER TELEMETRY & PRESENCE SCHEMA
-- Run this SQL in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/jgvgqgbhzadxvcolgvly/sql
-- =================================================================

-- 1. COMPILER EXECUTION TELEMETRY TABLE (All Code Runs & History)
CREATE TABLE IF NOT EXISTS public.compiler_telemetry (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT DEFAULT 'Anonymous Dev',
    college_name TEXT DEFAULT 'Web IDE',
    system_name TEXT DEFAULT '',
    language TEXT NOT NULL,
    status TEXT NOT NULL, -- 'SUCCESS' | 'ERROR'
    line_count INTEGER DEFAULT 1,
    code_snippet TEXT,
    execution_time_ms INTEGER DEFAULT 0,
    error_message TEXT,
    device TEXT DEFAULT 'Desktop',
    browser TEXT DEFAULT 'Browser',
    os TEXT DEFAULT 'OS',
    ip TEXT DEFAULT 'unknown',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. COMPILER ACTIVE SESSIONS TABLE (Real-Time Live Online Coders)
CREATE TABLE IF NOT EXISTS public.compiler_active_sessions (
    session_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_name TEXT DEFAULT 'Anonymous Dev',
    college_name TEXT DEFAULT 'Web IDE',
    current_language TEXT DEFAULT 'python',
    device TEXT DEFAULT 'Desktop',
    browser TEXT DEFAULT 'Browser',
    os TEXT DEFAULT 'OS',
    ip TEXT DEFAULT 'unknown',
    runs_count INTEGER DEFAULT 0,
    last_run_at TIMESTAMP WITH TIME ZONE,
    last_heartbeat TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    is_online BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.compiler_telemetry ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compiler_active_sessions ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES FOR COMPILER TELEMETRY
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'compiler_telemetry' 
        AND policyname = 'Allow public insert compiler_telemetry'
    ) THEN
        CREATE POLICY "Allow public insert compiler_telemetry" 
        ON public.compiler_telemetry 
        FOR INSERT 
        WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'compiler_telemetry' 
        AND policyname = 'Allow public select compiler_telemetry'
    ) THEN
        CREATE POLICY "Allow public select compiler_telemetry" 
        ON public.compiler_telemetry 
        FOR SELECT 
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'compiler_telemetry' 
        AND policyname = 'Allow public delete compiler_telemetry'
    ) THEN
        CREATE POLICY "Allow public delete compiler_telemetry" 
        ON public.compiler_telemetry 
        FOR DELETE 
        USING (true);
    END IF;
END $$;

-- 5. POLICIES FOR COMPILER ACTIVE SESSIONS
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'compiler_active_sessions' 
        AND policyname = 'Allow public insert compiler_active_sessions'
    ) THEN
        CREATE POLICY "Allow public insert compiler_active_sessions" 
        ON public.compiler_active_sessions 
        FOR INSERT 
        WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'compiler_active_sessions' 
        AND policyname = 'Allow public select compiler_active_sessions'
    ) THEN
        CREATE POLICY "Allow public select compiler_active_sessions" 
        ON public.compiler_active_sessions 
        FOR SELECT 
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'compiler_active_sessions' 
        AND policyname = 'Allow public update compiler_active_sessions'
    ) THEN
        CREATE POLICY "Allow public update compiler_active_sessions" 
        ON public.compiler_active_sessions 
        FOR UPDATE 
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'compiler_active_sessions' 
        AND policyname = 'Allow public delete compiler_active_sessions'
    ) THEN
        CREATE POLICY "Allow public delete compiler_active_sessions" 
        ON public.compiler_active_sessions 
        FOR DELETE 
        USING (true);
    END IF;
END $$;

-- 6. ENABLE REALTIME PUBLICATION FOR REALTIME BROADCAST & LISTENERS
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'compiler_telemetry'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.compiler_telemetry;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'compiler_active_sessions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.compiler_active_sessions;
    END IF;
END $$;

-- 7. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_compiler_telemetry_created_at ON public.compiler_telemetry (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_compiler_telemetry_lang ON public.compiler_telemetry (language);
CREATE INDEX IF NOT EXISTS idx_compiler_telemetry_user ON public.compiler_telemetry (user_id);
CREATE INDEX IF NOT EXISTS idx_compiler_active_sessions_heartbeat ON public.compiler_active_sessions (last_heartbeat DESC);
CREATE INDEX IF NOT EXISTS idx_compiler_active_sessions_online ON public.compiler_active_sessions (is_online);

-- 8. COMPILER USER PROFILES TABLE (Developer Registration: Name, Mobile, Email)
CREATE TABLE IF NOT EXISTS public.compiler_user_profiles (
    user_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    mobile TEXT NOT NULL,
    email TEXT NOT NULL,
    device TEXT DEFAULT 'Desktop',
    browser TEXT DEFAULT 'Browser',
    os TEXT DEFAULT 'OS',
    ip TEXT DEFAULT 'unknown',
    runs_count INTEGER DEFAULT 0,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Alter existing telemetry and active sessions tables to add user_mobile, user_email, run_id
ALTER TABLE public.compiler_telemetry ADD COLUMN IF NOT EXISTS run_id TEXT;
ALTER TABLE public.compiler_telemetry ADD COLUMN IF NOT EXISTS user_mobile TEXT;
ALTER TABLE public.compiler_telemetry ADD COLUMN IF NOT EXISTS user_email TEXT;

ALTER TABLE public.compiler_active_sessions ADD COLUMN IF NOT EXISTS user_mobile TEXT;
ALTER TABLE public.compiler_active_sessions ADD COLUMN IF NOT EXISTS user_email TEXT;

-- Enable RLS for profiles
ALTER TABLE public.compiler_user_profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'compiler_user_profiles' 
        AND policyname = 'Allow public insert compiler_user_profiles'
    ) THEN
        CREATE POLICY "Allow public insert compiler_user_profiles" 
        ON public.compiler_user_profiles 
        FOR INSERT 
        WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'compiler_user_profiles' 
        AND policyname = 'Allow public select compiler_user_profiles'
    ) THEN
        CREATE POLICY "Allow public select compiler_user_profiles" 
        ON public.compiler_user_profiles 
        FOR SELECT 
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'compiler_user_profiles' 
        AND policyname = 'Allow public update compiler_user_profiles'
    ) THEN
        CREATE POLICY "Allow public update compiler_user_profiles" 
        ON public.compiler_user_profiles 
        FOR UPDATE 
        USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'compiler_user_profiles' 
        AND policyname = 'Allow public delete compiler_user_profiles'
    ) THEN
        CREATE POLICY "Allow public delete compiler_user_profiles" 
        ON public.compiler_user_profiles 
        FOR DELETE 
        USING (true);
    END IF;
END $$;

-- Enable realtime for compiler_user_profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'compiler_user_profiles'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.compiler_user_profiles;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_compiler_user_profiles_created ON public.compiler_user_profiles (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_compiler_user_profiles_mobile ON public.compiler_user_profiles (mobile);

