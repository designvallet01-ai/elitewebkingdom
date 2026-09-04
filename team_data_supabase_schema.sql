-- =================================================================
-- ELITE WEB KINGDOM - SUPABASE TEAM DATA DATABASE SCHEMA
-- Run this SQL in your Supabase SQL Editor (https://supabase.com/dashboard)
-- =================================================================

-- 1. TEAM MEMBERS TABLE
CREATE TABLE IF NOT EXISTS public.team_members (
    id TEXT PRIMARY KEY,
    team_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    password TEXT NOT NULL,
    avatar TEXT,
    status TEXT DEFAULT 'Online',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TEAM TASKS TABLE
CREATE TABLE IF NOT EXISTS public.team_tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    priority TEXT DEFAULT 'Medium',
    assigned_to TEXT NOT NULL,
    assigned_by_name TEXT DEFAULT 'Admin',
    status TEXT DEFAULT 'Pending',
    due_date TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TEAM STANDUPS TABLE
CREATE TABLE IF NOT EXISTS public.team_standups (
    id TEXT PRIMARY KEY,
    user_name TEXT NOT NULL,
    user_role TEXT,
    user_avatar TEXT,
    accomplished TEXT NOT NULL,
    next TEXT NOT NULL,
    blockers TEXT DEFAULT 'None',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. CLIENT PROJECTS TABLE
CREATE TABLE IF NOT EXISTS public.client_projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    client TEXT NOT NULL,
    progress INTEGER DEFAULT 0,
    tech TEXT,
    deadline TEXT,
    status TEXT DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. PUBLISHED STORE ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.published_store_items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    price TEXT DEFAULT 'Free',
    preview_url TEXT,
    download_url TEXT,
    description TEXT,
    tech_stack TEXT,
    image_url TEXT,
    badge TEXT DEFAULT 'Verified',
    status TEXT DEFAULT 'Published',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS) & Grant Permissive Access for Anon/Authenticated
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_standups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.published_store_items ENABLE ROW LEVEL SECURITY;

-- Create Policies for Anonymous & Authenticated access
CREATE POLICY "Allow public select team_members" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "Allow public insert team_members" ON public.team_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update team_members" ON public.team_members FOR UPDATE USING (true);
CREATE POLICY "Allow public delete team_members" ON public.team_members FOR DELETE USING (true);

CREATE POLICY "Allow public select team_tasks" ON public.team_tasks FOR SELECT USING (true);
CREATE POLICY "Allow public insert team_tasks" ON public.team_tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update team_tasks" ON public.team_tasks FOR UPDATE USING (true);
CREATE POLICY "Allow public delete team_tasks" ON public.team_tasks FOR DELETE USING (true);

CREATE POLICY "Allow public select team_standups" ON public.team_standups FOR SELECT USING (true);
CREATE POLICY "Allow public insert team_standups" ON public.team_standups FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update team_standups" ON public.team_standups FOR UPDATE USING (true);
CREATE POLICY "Allow public delete team_standups" ON public.team_standups FOR DELETE USING (true);

CREATE POLICY "Allow public select client_projects" ON public.client_projects FOR SELECT USING (true);
CREATE POLICY "Allow public insert client_projects" ON public.client_projects FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update client_projects" ON public.client_projects FOR UPDATE USING (true);
CREATE POLICY "Allow public delete client_projects" ON public.client_projects FOR DELETE USING (true);

CREATE POLICY "Allow public select published_store_items" ON public.published_store_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert published_store_items" ON public.published_store_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update published_store_items" ON public.published_store_items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete published_store_items" ON public.published_store_items FOR DELETE USING (true);

-- 6. REAL-TIME PAGEVIEWS & VISITOR TRACKING TABLE
CREATE TABLE IF NOT EXISTS public.pageviews (
    id BIGSERIAL PRIMARY KEY,
    url TEXT NOT NULL DEFAULT '/',
    hostname TEXT NOT NULL DEFAULT 'elitewebkingdom.in',
    user_agent TEXT,
    referrer TEXT DEFAULT 'direct',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.pageviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert pageviews" ON public.pageviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public select pageviews" ON public.pageviews FOR SELECT USING (true);

-- Enable Supabase Realtime for pageviews
ALTER PUBLICATION supabase_realtime ADD TABLE public.pageviews;


