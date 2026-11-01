-- ====================================================================
-- MVJ INTERDEPARTMENT SPORTS - SUPABASE DATABASE SCHEMA
-- Official Sports Management & Tournament Portal
-- MVJ College of Engineering (MVJCE)
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES CREATION

-- Table: departments
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS sports CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS announcements CASCADE;
DROP TABLE IF EXISTS tournament_settings CASCADE;
DROP TABLE IF EXISTS admin_profiles CASCADE;

CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    points INTEGER NOT NULL DEFAULT 0,
    gold INTEGER NOT NULL DEFAULT 0,
    silver INTEGER NOT NULL DEFAULT 0,
    bronze INTEGER NOT NULL DEFAULT 0,
    color TEXT DEFAULT '#174EA6',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: sports
CREATE TABLE sports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    icon TEXT NOT NULL DEFAULT 'fa-trophy',
    image TEXT DEFAULT '',
    description TEXT DEFAULT '',
    current_stage TEXT DEFAULT 'Group Stage',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: matches
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sport_id UUID NOT NULL REFERENCES sports(id) ON DELETE CASCADE,
    stage TEXT NOT NULL DEFAULT 'Regular', -- 'Regular', 'Semi-Final', 'Grand Final'
    stage_label TEXT DEFAULT '', -- e.g. 'Match 1', 'Semi-Final 1', 'Championship Final'
    team_a TEXT NOT NULL,
    team_b TEXT NOT NULL,
    team_a_logo TEXT DEFAULT '',
    team_b_logo TEXT DEFAULT '',
    score_a TEXT DEFAULT '-',
    score_b TEXT DEFAULT '-',
    match_date DATE NOT NULL,
    match_time TEXT NOT NULL,
    venue TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Upcoming', -- 'Upcoming', 'Live', 'Completed'
    winner TEXT DEFAULT '',
    result TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: announcements
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT DEFAULT 'General', -- 'Notice', 'Schedule Change', 'Postponement', 'Result'
    publish_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_published BOOLEAN DEFAULT TRUE,
    image_url TEXT DEFAULT '',
    image_path TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: tournament_settings
CREATE TABLE tournament_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tournament_name TEXT NOT NULL DEFAULT 'MVJ Interdepartment Sports Championship',
    academic_year TEXT NOT NULL DEFAULT '2026-2027',
    tournament_status TEXT NOT NULL DEFAULT 'Ongoing', -- 'Upcoming', 'Ongoing', 'Completed'
    homepage_tagline TEXT NOT NULL DEFAULT 'ONE COLLEGE. MULTIPLE DEPARTMENTS. ONE CHAMPION.',
    homepage_subtitle TEXT NOT NULL DEFAULT 'Celebrating sportsmanship, teamwork and interdepartmental excellence at MVJ College of Engineering.',
    banner_image TEXT DEFAULT '',
    logo_path TEXT DEFAULT 'assets/images/mvj-logo.png',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: admin_profiles
CREATE TABLE admin_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL DEFAULT 'MVJ Sports Admin',
    role TEXT NOT NULL DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ====================================================================
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Enable RLS on all tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- PUBLIC READ POLICIES (Students & Guests)
CREATE POLICY "Public users can view departments" ON departments
    FOR SELECT USING (true);

CREATE POLICY "Public users can view sports" ON sports
    FOR SELECT USING (true);

CREATE POLICY "Public users can view matches" ON matches
    FOR SELECT USING (true);

CREATE POLICY "Public users can view published announcements" ON announcements
    FOR SELECT USING (is_published = true);

CREATE POLICY "Public users can view tournament settings" ON tournament_settings
    FOR SELECT USING (true);

-- ADMIN CRUD POLICIES (Authenticated Admins)
-- Departments
CREATE POLICY "Admins have full access to departments" ON departments
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Sports
CREATE POLICY "Admins have full access to sports" ON sports
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Matches
CREATE POLICY "Admins have full access to matches" ON matches
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Announcements
CREATE POLICY "Admins have full access to announcements" ON announcements
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Tournament Settings
CREATE POLICY "Admins have full access to settings" ON tournament_settings
    FOR ALL TO authenticated
    USING (true)
    WITH CHECK (true);

-- Admin Profiles
CREATE POLICY "Admins can view profiles" ON admin_profiles
    FOR SELECT TO authenticated
    USING (true);

-- Public announcement images; only authenticated users can upload or remove them.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'announcement-photos',
    'announcement-photos',
    TRUE,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "Public users can view announcement photos" ON storage.objects
    FOR SELECT USING (bucket_id = 'announcement-photos');

CREATE POLICY "Authenticated users can upload announcement photos" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'announcement-photos'
        AND EXISTS (
            SELECT 1 FROM public.admin_profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Authenticated users can delete announcement photos" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'announcement-photos'
        AND EXISTS (
            SELECT 1 FROM public.admin_profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- ====================================================================
-- 4. REALTIME REPLICATION SETUP
-- ====================================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE departments;
        ALTER PUBLICATION supabase_realtime ADD TABLE sports;
        ALTER PUBLICATION supabase_realtime ADD TABLE matches;
        ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
        ALTER PUBLICATION supabase_realtime ADD TABLE tournament_settings;
    END IF;
END $$;

-- ====================================================================
-- 5. SEED DATA
-- ====================================================================

-- Departments (8 initial departments with colors and realistic points)
INSERT INTO departments (name, code, points, gold, silver, bronze, color) VALUES
('Computer Science & Engineering', 'CSE', 135, 4, 2, 1, '#174EA6'),
('Artificial Intelligence & Machine Learning', 'AIML', 110, 3, 2, 2, '#2878D0'),
('Information Science & Engineering', 'ISE', 90, 2, 3, 1, '#0D9488'),
('Electronics & Communication Engineering', 'ECE', 75, 2, 1, 2, '#7C3AED'),
('Electrical & Electronics Engineering', 'EEE', 60, 1, 2, 1, '#EA580C'),
('Mechanical Engineering', 'ME', 45, 1, 1, 1, '#D97706'),
('Civil Engineering', 'CIVIL', 35, 0, 1, 2, '#475569'),
('Master of Business Administration', 'MBA', 25, 0, 1, 1, '#DB2777');

-- Tournament Settings
INSERT INTO tournament_settings (
    tournament_name,
    academic_year,
    tournament_status,
    homepage_tagline,
    homepage_subtitle,
    logo_path
) VALUES (
    'MVJ Interdepartment Sports Championship',
    '2026-2027',
    'Ongoing',
    'ONE COLLEGE. MULTIPLE DEPARTMENTS. ONE CHAMPION.',
    'Celebrating sportsmanship, teamwork and interdepartmental excellence at MVJ College of Engineering.',
    'assets/images/mvj-logo.png'
);

-- Sports (10 initial sports)
INSERT INTO sports (id, name, slug, icon, description, current_stage) VALUES
('a0000001-0000-0000-0000-000000000001', 'Cricket', 'cricket', 'fa-baseball-bat-ball', 'Interdepartment 15-over T-15 cricket championship with knockout fixtures.', 'Semi-Finals'),
('a0000001-0000-0000-0000-000000000002', 'Football', 'football', 'fa-futbol', 'High-intensity 7-a-side football tournament played on the main MVJ ground.', 'Semi-Finals'),
('a0000001-0000-0000-0000-000000000003', 'Volleyball', 'volleyball', 'fa-volleyball', 'Fast-paced standard interdepartment volleyball clash on the outdoor court.', 'Grand Final'),
('a0000001-0000-0000-0000-000000000004', 'Basketball', 'basketball', 'fa-basketball', 'Full-court 5v5 basketball tournament held at the MVJ Sports Complex.', 'Regular Matches'),
('a0000001-0000-0000-0000-000000000005', 'Kabaddi', 'kabaddi', 'fa-people-group', 'Traditional high-energy Kabaddi tournament with pro-rules on the mud court.', 'Completed'),
('a0000001-0000-0000-0000-000000000006', 'Badminton', 'badminton', 'fa-feather', 'Singles and doubles indoor badminton tournament at the college auditorium.', 'Semi-Finals'),
('a0000001-0000-0000-0000-000000000007', 'Table Tennis', 'table-tennis', 'fa-table-tennis-paddle-ball', 'Indoor speed and spin tournament in the indoor sports room.', 'Regular Matches'),
('a0000001-0000-0000-0000-000000000008', 'Chess', 'chess', 'fa-chess-knight', 'Classical 30-minute rapid interdepartment chess showdown.', 'Completed'),
('a0000001-0000-0000-0000-000000000009', 'Throwball', 'throwball', 'fa-volleyball', 'Women''s interdepartment throwball championship with fierce rallies.', 'Regular Matches'),
('a0000001-0000-0000-0000-000000000010', 'Athletics', 'athletics', 'fa-person-running', '100m, 200m, 4x100m relay, shot put and long jump track and field events.', 'Ongoing');

-- Matches across Cricket, Football, Volleyball, Basketball, etc.
-- Cricket Matches (Regular, Semi-Finals, Grand Final)
INSERT INTO matches (sport_id, stage, stage_label, team_a, team_b, score_a, score_b, match_date, match_time, venue, status, winner, result) VALUES
-- Cricket Regular
('a0000001-0000-0000-0000-000000000001', 'Regular', 'Match 1', 'CSE', 'ME', '142/4 (15.0)', '118/8 (15.0)', '2026-10-25', '09:00 AM', 'Main Cricket Ground', 'Completed', 'CSE', 'CSE won by 24 runs'),
('a0000001-0000-0000-0000-000000000001', 'Regular', 'Match 2', 'AIML', 'CIVIL', '158/3 (15.0)', '122/9 (15.0)', '2026-10-25', '01:30 PM', 'Main Cricket Ground', 'Completed', 'AIML', 'AIML won by 36 runs'),
('a0000001-0000-0000-0000-000000000001', 'Regular', 'Match 3', 'ISE', 'EEE', '130/6 (15.0)', '131/4 (14.2)', '2026-10-26', '09:00 AM', 'Main Cricket Ground', 'Completed', 'EEE', 'EEE won by 6 wickets'),
('a0000001-0000-0000-0000-000000000001', 'Regular', 'Match 4', 'ECE', 'MBA', '165/2 (15.0)', '98/10 (12.4)', '2026-10-26', '01:30 PM', 'Main Cricket Ground', 'Completed', 'ECE', 'ECE won by 67 runs'),
-- Cricket Semi-Finals
('a0000001-0000-0000-0000-000000000001', 'Semi-Final', 'Semi-Final 1', 'CSE', 'EEE', '82/1 (8.4)', '125/7 (15.0)', '2026-10-31', '10:00 AM', 'Main Cricket Ground', 'Live', '', 'CSE needs 44 runs in 38 balls'),
('a0000001-0000-0000-0000-000000000001', 'Semi-Final', 'Semi-Final 2', 'AIML', 'ECE', '-', '-', '2026-11-01', '09:30 AM', 'Main Cricket Ground', 'Upcoming', '', 'Winner advances to Grand Final'),
-- Cricket Grand Final
('a0000001-0000-0000-0000-000000000001', 'Grand Final', 'The Championship Final', 'Winner SF 1', 'Winner SF 2', '-', '-', '2026-11-03', '01:30 PM', 'Main Cricket Ground', 'Upcoming', '', 'Championship Gold Medal Match');

-- Football Matches
INSERT INTO matches (sport_id, stage, stage_label, team_a, team_b, score_a, score_b, match_date, match_time, venue, status, winner, result) VALUES
('a0000001-0000-0000-0000-000000000002', 'Regular', 'Quarter-Final 1', 'CSE', 'ECE', '3', '1', '2026-10-27', '02:00 PM', 'Football Field A', 'Completed', 'CSE', 'CSE won 3 - 1'),
('a0000001-0000-0000-0000-000000000002', 'Regular', 'Quarter-Final 2', 'AIML', 'ME', '2', '0', '2026-10-27', '03:45 PM', 'Football Field A', 'Completed', 'AIML', 'AIML won 2 - 0'),
('a0000001-0000-0000-0000-000000000002', 'Regular', 'Quarter-Final 3', 'ISE', 'CIVIL', '4', '2', '2026-10-28', '02:00 PM', 'Football Field A', 'Completed', 'ISE', 'ISE won 4 - 2 on penalties'),
('a0000001-0000-0000-0000-000000000002', 'Semi-Final', 'Semi-Final 1', 'CSE', 'ISE', '1', '0', '2026-10-31', '03:00 PM', 'Football Field A', 'Live', '', 'Second half in progress (52 min)'),
('a0000001-0000-0000-0000-000000000002', 'Semi-Final', 'Semi-Final 2', 'AIML', 'EEE', '-', '-', '2026-11-01', '02:30 PM', 'Football Field A', 'Upcoming', '', 'High-voltage clash for final berth'),
('a0000001-0000-0000-0000-000000000002', 'Grand Final', 'The Championship Final', 'Winner SF 1', 'Winner SF 2', '-', '-', '2026-11-04', '03:30 PM', 'Football Field A', 'Upcoming', '', 'Title decider trophy match');

-- Volleyball Matches (Completed up to Grand Final)
INSERT INTO matches (sport_id, stage, stage_label, team_a, team_b, score_a, score_b, match_date, match_time, venue, status, winner, result) VALUES
('a0000001-0000-0000-0000-000000000003', 'Regular', 'Match 1', 'AIML', 'CIVIL', '2', '0', '2026-10-24', '10:00 AM', 'Volleyball Court', 'Completed', 'AIML', 'AIML won (25-18, 25-20)'),
('a0000001-0000-0000-0000-000000000003', 'Semi-Final', 'Semi-Final 1', 'CSE', 'ECE', '2', '1', '2026-10-29', '11:00 AM', 'Volleyball Court', 'Completed', 'CSE', 'CSE won thrilling decider set'),
('a0000001-0000-0000-0000-000000000003', 'Semi-Final', 'Semi-Final 2', 'AIML', 'ME', '2', '0', '2026-10-29', '02:00 PM', 'Volleyball Court', 'Completed', 'AIML', 'AIML won straight sets'),
('a0000001-0000-0000-0000-000000000003', 'Grand Final', 'The Championship Final', 'CSE', 'AIML', '3', '1', '2026-10-30', '03:30 PM', 'Volleyball Court', 'Completed', 'CSE', 'CSE Champion (25-22, 23-25, 25-19, 25-21)');

-- Basketball Matches
INSERT INTO matches (sport_id, stage, stage_label, team_a, team_b, score_a, score_b, match_date, match_time, venue, status, winner, result) VALUES
('a0000001-0000-0000-0000-000000000004', 'Regular', 'Match 1', 'ISE', 'MBA', '54', '38', '2026-10-28', '11:00 AM', 'Indoor Sports Complex', 'Completed', 'ISE', 'ISE won by 16 points'),
('a0000001-0000-0000-0000-000000000004', 'Regular', 'Match 2', 'ECE', 'ME', '42', '40', '2026-10-29', '01:00 PM', 'Indoor Sports Complex', 'Completed', 'ECE', 'ECE won in buzzer-beater thriller'),
('a0000001-0000-0000-0000-000000000004', 'Semi-Final', 'Semi-Final 1', 'CSE', 'ECE', '-', '-', '2026-11-01', '10:00 AM', 'Indoor Sports Complex', 'Upcoming', '', 'Top seed CSE takes on ECE'),
('a0000001-0000-0000-0000-000000000004', 'Semi-Final', 'Semi-Final 2', 'AIML', 'ISE', '-', '-', '2026-11-01', '12:00 PM', 'Indoor Sports Complex', 'Upcoming', '', 'AIML vs ISE showdown'),
('a0000001-0000-0000-0000-000000000004', 'Grand Final', 'The Championship Final', 'Winner SF 1', 'Winner SF 2', '-', '-', '2026-11-03', '04:00 PM', 'Indoor Sports Complex', 'Upcoming', '', 'Championship Trophy Final');

-- Announcements
INSERT INTO announcements (title, description, category, publish_date, is_published) VALUES
('Cricket Semi-Finals Live Streaming and Scoreboard', 'Cricket Semi-Final 1 between CSE and EEE is currently underway at the Main Cricket Ground. Check live scores right here on the portal.', 'Notice', CURRENT_DATE, true),
('Athletics Heats Schedule Released', 'Track and field athletics heats for 100m, 200m, and 4x100m relay will commence tomorrow at 8:30 AM at the College Track.', 'Schedule Change', CURRENT_DATE, true),
('Volleyball Finals Concluded: CSE Clinches Gold', 'Heartiest congratulations to the Computer Science & Engineering department for winning the Gold Medal in Volleyball after an intense 4-set grand final.', 'Result', CURRENT_DATE - INTERVAL '1 day', true),
('Tournament Fair Play & Discipline Guidelines', 'All participating student athletes and department supporters are requested to maintain sportsmanship and discipline on and off the court.', 'General', CURRENT_DATE - INTERVAL '3 days', true);
