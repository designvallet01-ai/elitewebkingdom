-- =================================================================
-- ELITE WEB KINGDOM - CERTIFICATES DATABASE SCHEMA
-- Run this SQL in your Supabase SQL Editor (https://supabase.com/dashboard)
-- =================================================================

-- 1. CREATE CERTIFICATES TABLE
CREATE TABLE IF NOT EXISTS public.certificates (
    id TEXT PRIMARY KEY,
    certificate_id TEXT UNIQUE NOT NULL,
    main_heading TEXT NOT NULL DEFAULT 'Certificate of Achievement',
    recipient_name TEXT NOT NULL,
    award_category TEXT NOT NULL,
    achievement_description TEXT NOT NULL,
    performance_month TEXT NOT NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    issuer_name TEXT NOT NULL DEFAULT 'Elite Web Kingdom',
    signatory_name TEXT NOT NULL DEFAULT 'Gowri Narayana Guduru',
    signatory_role TEXT NOT NULL DEFAULT 'Principal System Architect & Founder',
    status TEXT NOT NULL DEFAULT 'Verified',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. CREATE INDEXES FOR ULTRA-FAST LOOKUPS & SEARCH
CREATE INDEX IF NOT EXISTS idx_certificates_cert_id ON public.certificates (certificate_id);
CREATE INDEX IF NOT EXISTS idx_certificates_recipient ON public.certificates (recipient_name);
CREATE INDEX IF NOT EXISTS idx_certificates_issue_date ON public.certificates (issue_date);
CREATE INDEX IF NOT EXISTS idx_certificates_created_at ON public.certificates (created_at DESC);

-- 3. ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES FOR PUBLIC VERIFICATION & MANAGEMENT
-- Allow anyone to verify certificates by reading records
CREATE POLICY "Allow public select certificates" 
ON public.certificates 
FOR SELECT 
USING (true);

-- Allow inserting new certificates (Admin and Team portals)
CREATE POLICY "Allow public insert certificates" 
ON public.certificates 
FOR INSERT 
WITH CHECK (true);

-- Allow updating certificates
CREATE POLICY "Allow public update certificates" 
ON public.certificates 
FOR UPDATE 
USING (true);

-- Allow deleting certificates
CREATE POLICY "Allow public delete certificates" 
ON public.certificates 
FOR DELETE 
USING (true);

-- 5. SEED INITIAL FOUNDATIONAL TOP PERFORMER CERTIFICATE
INSERT INTO public.certificates (
    id,
    certificate_id,
    main_heading,
    recipient_name,
    award_category,
    achievement_description,
    performance_month,
    issue_date,
    issuer_name,
    signatory_name,
    signatory_role,
    status
) VALUES (
    'cert-seed-001',
    'EIDE-2026-10-0001',
    'Certificate of Achievement',
    'Gowri Narayana Guduru',
    'Top Performer & Engineering Excellence',
    'Awarded for outstanding system architecture, real-time multi-cluster compiler engine delivery, and relentless leadership in enterprise engineering.',
    'October 2026',
    '2026-10-25',
    'Elite Web Kingdom & Elite IDE',
    'Gowri Narayana Guduru',
    'Principal System Architect & Founder',
    'Verified'
) ON CONFLICT (certificate_id) DO NOTHING;
