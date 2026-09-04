-- =====================================================
-- ELITE WEB KINGDOM - REAL-TIME VISITOR TRACKING TABLE
-- Run this SQL in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/jgvgqgbhzadxvcolgvly/sql
-- =====================================================

-- 1. Create pageviews table
CREATE TABLE IF NOT EXISTS public.pageviews (
    id BIGSERIAL PRIMARY KEY,
    url TEXT NOT NULL DEFAULT '/',
    hostname TEXT NOT NULL DEFAULT 'elitewebkingdom.in',
    user_agent TEXT,
    referrer TEXT DEFAULT 'direct',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.pageviews ENABLE ROW LEVEL SECURITY;

-- 3. Allow anonymous public visitors to log pageviews
CREATE POLICY "Allow public insert pageviews" 
ON public.pageviews 
FOR INSERT 
WITH CHECK (true);

-- 4. Allow public / admin to count and view pageviews
CREATE POLICY "Allow public select pageviews" 
ON public.pageviews 
FOR SELECT 
USING (true);

-- 5. Enable Supabase Realtime broadcast for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.pageviews;
