-- =================================================================
-- ELITE WEB KINGDOM - COLLEGE MODE SUPABASE DATABASE SCHEMA
-- Run this SQL in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/jgvgqgbhzadxvcolgvly/sql
-- =================================================================

-- 1. COLLEGE ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS public.college_accounts (
    college_id TEXT PRIMARY KEY,
    college_name TEXT NOT NULL,
    department TEXT DEFAULT 'Engineering & Technology',
    admin_email TEXT,
    password TEXT DEFAULT '',
    default_pin TEXT DEFAULT '1234',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. REGISTERED LAB SYSTEMS TABLE
CREATE TABLE IF NOT EXISTS public.college_systems (
    system_id TEXT PRIMARY KEY,
    college_id TEXT REFERENCES public.college_accounts(college_id) ON DELETE CASCADE,
    college_name TEXT,
    system_name TEXT NOT NULL,
    lab_room TEXT DEFAULT 'Computer Lab 1',
    machine_id TEXT,
    status TEXT DEFAULT 'idle', -- 'idle' | 'locked' | 'violation'
    current_student_roll TEXT DEFAULT '',
    current_student_name TEXT DEFAULT '',
    current_exam_name TEXT DEFAULT '',
    violations_count INTEGER DEFAULT 0,
    exam_start_time BIGINT,
    last_ping TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. PROCTORING & SECURITY INCIDENT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.college_incident_logs (
    id TEXT PRIMARY KEY,
    college_id TEXT,
    system_id TEXT,
    system_name TEXT NOT NULL,
    student_roll TEXT DEFAULT 'Unknown',
    student_name TEXT DEFAULT 'Student',
    reason TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enable public anon access for lab systems and admin portal
-- =================================================================

ALTER TABLE public.college_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.college_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.college_incident_logs ENABLE ROW LEVEL SECURITY;

-- college_accounts policies
DROP POLICY IF EXISTS "Allow public read college_accounts" ON public.college_accounts;
CREATE POLICY "Allow public read college_accounts" ON public.college_accounts FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert college_accounts" ON public.college_accounts;
CREATE POLICY "Allow public insert college_accounts" ON public.college_accounts FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update college_accounts" ON public.college_accounts;
CREATE POLICY "Allow public update college_accounts" ON public.college_accounts FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete college_accounts" ON public.college_accounts;
CREATE POLICY "Allow public delete college_accounts" ON public.college_accounts FOR DELETE USING (true);

-- college_systems policies
DROP POLICY IF EXISTS "Allow public read college_systems" ON public.college_systems;
CREATE POLICY "Allow public read college_systems" ON public.college_systems FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert college_systems" ON public.college_systems;
CREATE POLICY "Allow public insert college_systems" ON public.college_systems FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update college_systems" ON public.college_systems;
CREATE POLICY "Allow public update college_systems" ON public.college_systems FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete college_systems" ON public.college_systems;
CREATE POLICY "Allow public delete college_systems" ON public.college_systems FOR DELETE USING (true);

-- college_incident_logs policies
DROP POLICY IF EXISTS "Allow public read college_incident_logs" ON public.college_incident_logs;
CREATE POLICY "Allow public read college_incident_logs" ON public.college_incident_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert college_incident_logs" ON public.college_incident_logs;
CREATE POLICY "Allow public insert college_incident_logs" ON public.college_incident_logs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public delete college_incident_logs" ON public.college_incident_logs;
CREATE POLICY "Allow public delete college_incident_logs" ON public.college_incident_logs FOR DELETE USING (true);

-- =================================================================
-- REALTIME PUBLICATION
-- Enable realtime cross-tab and cross-network broadcasting
-- =================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.college_accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.college_systems;
ALTER PUBLICATION supabase_realtime ADD TABLE public.college_incident_logs;

-- Pre-seed demo college account
INSERT INTO public.college_accounts (college_id, college_name, department, admin_email, password, default_pin)
VALUES ('EWK-COLLEGE-01', 'Elite Engineering College', 'Computer Science & Engineering', 'admin@elitecollege.edu.in', '', '1234')
ON CONFLICT (college_id) DO NOTHING;
