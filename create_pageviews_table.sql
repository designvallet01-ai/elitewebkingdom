-- =====================================================
-- ELITE WEB KINGDOM - REAL-TIME VISITOR TRACKING TABLE
-- Run this SQL in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/jgvgqgbhzadxvcolgvly/sql
-- =====================================================

-- 1. Create pageviews table (if not already existing)
CREATE TABLE IF NOT EXISTS public.pageviews (
    id BIGSERIAL PRIMARY KEY,
    url TEXT NOT NULL DEFAULT '/',
    hostname TEXT NOT NULL DEFAULT 'elitewebkingdom.in',
    user_agent TEXT,
    referrer TEXT DEFAULT 'direct',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Optional: Add dedicated columns for enriched visitor telemetry
ALTER TABLE public.pageviews ADD COLUMN IF NOT EXISTS device TEXT;
ALTER TABLE public.pageviews ADD COLUMN IF NOT EXISTS browser TEXT;
ALTER TABLE public.pageviews ADD COLUMN IF NOT EXISTS os TEXT;
ALTER TABLE public.pageviews ADD COLUMN IF NOT EXISTS ip TEXT;

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.pageviews ENABLE ROW LEVEL SECURITY;

-- 3. Allow anonymous public visitors to log pageviews
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'pageviews' 
        AND policyname = 'Allow public insert pageviews'
    ) THEN
        CREATE POLICY "Allow public insert pageviews" 
        ON public.pageviews 
        FOR INSERT 
        WITH CHECK (true);
    END IF;
END $$;

-- 4. Allow public / admin to count and view pageviews
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'pageviews' 
        AND policyname = 'Allow public select pageviews'
    ) THEN
        CREATE POLICY "Allow public select pageviews" 
        ON public.pageviews 
        FOR SELECT 
        USING (true);
    END IF;
END $$;

-- 5. Enable Supabase Realtime broadcast for live updates
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'pageviews'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.pageviews;
    END IF;
END $$;

-- 6. Indexes for fast aggregation and querying
CREATE INDEX IF NOT EXISTS idx_pageviews_created_at ON public.pageviews (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pageviews_url ON public.pageviews (url);
