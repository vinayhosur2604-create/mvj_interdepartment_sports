-- Apply this migration to an existing project without rerunning the
-- destructive setup script in supabase_schema.sql.

ALTER TABLE public.announcements
    ADD COLUMN IF NOT EXISTS image_url TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS image_path TEXT DEFAULT '';

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

DROP POLICY IF EXISTS "Public users can view announcement photos" ON storage.objects;
CREATE POLICY "Public users can view announcement photos" ON storage.objects
    FOR SELECT USING (bucket_id = 'announcement-photos');

DROP POLICY IF EXISTS "Authenticated users can upload announcement photos" ON storage.objects;
CREATE POLICY "Authenticated users can upload announcement photos" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'announcement-photos'
        AND EXISTS (
            SELECT 1 FROM public.admin_profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Authenticated users can delete announcement photos" ON storage.objects;
CREATE POLICY "Authenticated users can delete announcement photos" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'announcement-photos'
        AND EXISTS (
            SELECT 1 FROM public.admin_profiles
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime'
              AND schemaname = 'public'
              AND tablename = 'departments'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.departments;
        END IF;
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime'
              AND schemaname = 'public'
              AND tablename = 'sports'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.sports;
        END IF;
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime'
              AND schemaname = 'public'
              AND tablename = 'matches'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
        END IF;
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime'
              AND schemaname = 'public'
              AND tablename = 'announcements'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.announcements;
        END IF;
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime'
              AND schemaname = 'public'
              AND tablename = 'tournament_settings'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.tournament_settings;
        END IF;
    END IF;
END $$;
