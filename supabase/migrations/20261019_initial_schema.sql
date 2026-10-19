-- ==============================================================================
-- CASE HUB — PRODUCTION SUPABASE POSTGRESQL SCHEMA & ROW LEVEL SECURITY
-- Platform: Case Hub (Discover. Share. Compete.)
-- Institution: HSB Jaipur
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User Roles Enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('student', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 3. Users Table (Synchronized with Supabase Auth)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT,
    program_of_study TEXT,
    year_of_study TEXT,
    linkedin_url TEXT,
    bio TEXT,
    role user_role NOT NULL DEFAULT 'student',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Competitions Table
-- Note: Uploader email is deliberately NOT in this table to preserve privacy
CREATE TABLE IF NOT EXISTS public.competitions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    organizer TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    industry TEXT,
    registration_deadline TIMESTAMPTZ NOT NULL,
    event_start_date TIMESTAMPTZ,
    event_end_date TIMESTAMPTZ,
    min_team_size INTEGER NOT NULL DEFAULT 1 CHECK (min_team_size >= 1),
    max_team_size INTEGER NOT NULL DEFAULT 1 CHECK (max_team_size >= min_team_size),
    eligibility TEXT NOT NULL,
    mode TEXT NOT NULL CHECK (mode IN ('Online', 'Offline', 'Hybrid')),
    prize_details TEXT,
    entry_fee TEXT DEFAULT 'Free',
    official_source_url TEXT,
    official_registration_url TEXT NOT NULL,
    poster_url TEXT,
    case_brief_url TEXT,
    additional_resources TEXT,
    additional_notes TEXT,
    location TEXT,
    uploader_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    uploader_display_name TEXT NOT NULL,
    verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'verified')),
    verified_at TIMESTAMPTZ,
    verified_by TEXT,
    is_archived BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Sensitive Private Metadata Table
-- Separated from public table so public API queries cannot leak uploader emails
CREATE TABLE IF NOT EXISTS public.competition_private_metadata (
    competition_id TEXT PRIMARY KEY REFERENCES public.competitions(id) ON DELETE CASCADE,
    uploader_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    uploader_email TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Saved Competitions Table
CREATE TABLE IF NOT EXISTS public.saved_competitions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    competition_id TEXT NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_user_saved_competition UNIQUE (user_id, competition_id)
);

-- 7. Team Finder Listings
CREATE TABLE IF NOT EXISTS public.team_listings (
    id TEXT PRIMARY KEY,
    competition_id TEXT NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
    host_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    host_display_name TEXT NOT NULL,
    headline TEXT NOT NULL,
    description TEXT NOT NULL,
    target_team_size INTEGER NOT NULL CHECK (target_team_size >= 1),
    contact_method TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 8. Team Finder Members
CREATE TABLE IF NOT EXISTS public.team_members (
    id TEXT PRIMARY KEY,
    team_listing_id TEXT NOT NULL REFERENCES public.team_listings(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    user_display_name TEXT NOT NULL,
    user_avatar TEXT,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_team_member UNIQUE (team_listing_id, user_id)
);

-- 9. Reports Table
CREATE TABLE IF NOT EXISTS public.reports (
    id TEXT PRIMARY KEY,
    competition_id TEXT NOT NULL REFERENCES public.competitions(id) ON DELETE CASCADE,
    competition_name TEXT,
    reporting_user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    reporting_user_name TEXT,
    reason TEXT NOT NULL,
    additional_details TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
    reviewer_id TEXT REFERENCES public.users(id),
    reviewed_at TIMESTAMPTZ,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 10. Case Resources Table
CREATE TABLE IF NOT EXISTS public.case_resources (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    resource_type TEXT NOT NULL CHECK (resource_type IN ('link', 'document', 'framework')),
    url TEXT NOT NULL,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 11. Notification Logs Table (Outbox & Retry audit)
CREATE TABLE IF NOT EXISTS public.notification_logs (
    id TEXT PRIMARY KEY,
    recipient_email TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    template_type TEXT NOT NULL,
    competition_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    error_message TEXT,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_competitions_category ON public.competitions(category);
CREATE INDEX IF NOT EXISTS idx_competitions_deadline ON public.competitions(registration_deadline);
CREATE INDEX IF NOT EXISTS idx_competitions_mode ON public.competitions(mode);
CREATE INDEX IF NOT EXISTS idx_competitions_uploader ON public.competitions(uploader_id);
CREATE INDEX IF NOT EXISTS idx_saved_user ON public.saved_competitions(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_competition ON public.saved_competitions(competition_id);
CREATE INDEX IF NOT EXISTS idx_teams_competition ON public.team_listings(competition_id);
CREATE INDEX IF NOT EXISTS idx_team_members_listing ON public.team_members(team_listing_id);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competition_private_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_competitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

-- Users: Anyone can read profiles; users can update their own profile; only admins change roles
CREATE POLICY "Public profiles are viewable by everyone" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid()::text = id);

-- Competitions: Anyone can read unarchived; authenticated can create; creators/admins can update/delete
CREATE POLICY "Public can view active competitions" ON public.competitions FOR SELECT USING (is_archived = false);
CREATE POLICY "Admins can view all competitions including archived" ON public.competitions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::text AND role = 'admin')
);
CREATE POLICY "Authenticated users can create competitions" ON public.competitions FOR INSERT WITH CHECK (
  auth.uid()::text = uploader_id
);
CREATE POLICY "Owners and admins can update competitions" ON public.competitions FOR UPDATE USING (
  auth.uid()::text = uploader_id OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::text AND role = 'admin')
);
CREATE POLICY "Owners and admins can delete competitions" ON public.competitions FOR DELETE USING (
  auth.uid()::text = uploader_id OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::text AND role = 'admin')
);

-- Privacy Protection: Uploader email metadata is NEVER readable by public
CREATE POLICY "Only uploader or admins can view private metadata" ON public.competition_private_metadata FOR SELECT USING (
  auth.uid()::text = uploader_id OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::text AND role = 'admin')
);
CREATE POLICY "System can insert private metadata" ON public.competition_private_metadata FOR INSERT WITH CHECK (
  auth.uid()::text = uploader_id
);

-- Saved competitions: Users manage only their own
CREATE POLICY "Users view own saved" ON public.saved_competitions FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users insert own saved" ON public.saved_competitions FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users delete own saved" ON public.saved_competitions FOR DELETE USING (auth.uid()::text = user_id);

-- Team finder: Public view; authenticated create; host/admin manage
CREATE POLICY "Public view team listings" ON public.team_listings FOR SELECT USING (true);
CREATE POLICY "Auth users insert team listings" ON public.team_listings FOR INSERT WITH CHECK (auth.uid()::text = host_id);
CREATE POLICY "Host or admin update team listings" ON public.team_listings FOR UPDATE USING (
  auth.uid()::text = host_id OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::text AND role = 'admin')
);
CREATE POLICY "Host or admin delete team listings" ON public.team_listings FOR DELETE USING (
  auth.uid()::text = host_id OR EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::text AND role = 'admin')
);

CREATE POLICY "Public view team members" ON public.team_members FOR SELECT USING (true);
CREATE POLICY "Auth users join teams" ON public.team_members FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users leave team or host remove member" ON public.team_members FOR DELETE USING (
  auth.uid()::text = user_id OR EXISTS (
    SELECT 1 FROM public.team_listings WHERE id = team_listing_id AND host_id = auth.uid()::text
  ) OR EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid()::text AND role = 'admin'
  )
);

-- Reports: Authenticated create; only admins view/moderate
CREATE POLICY "Auth users insert reports" ON public.reports FOR INSERT WITH CHECK (auth.uid()::text = reporting_user_id);
CREATE POLICY "Admins view reports" ON public.reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::text AND role = 'admin')
);
CREATE POLICY "Admins update reports" ON public.reports FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::text AND role = 'admin')
);

-- Case Resources: Public view; admins manage
CREATE POLICY "Public view resources" ON public.case_resources FOR SELECT USING (true);
CREATE POLICY "Admins manage resources" ON public.case_resources FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::text AND role = 'admin')
);

-- Notification Logs: Only admins view/manage
CREATE POLICY "Admins view notification logs" ON public.notification_logs FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid()::text AND role = 'admin')
);
