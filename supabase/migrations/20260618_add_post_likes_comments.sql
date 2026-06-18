-- ============================================================
-- Migration: post_likes + post_comments + posts edit/delete RLS
-- Apply this in your Supabase dashboard → SQL editor
-- ============================================================

-- 1. Post likes
CREATE TABLE IF NOT EXISTS post_likes (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id    uuid        NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (post_id, user_id)
);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "likes_select" ON post_likes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "likes_insert" ON post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "likes_delete" ON post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- 2. Post comments / replies
CREATE TABLE IF NOT EXISTS post_comments (
  id         uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id    uuid        NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id  uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content    text        NOT NULL CHECK (char_length(content) > 0),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_select" ON post_comments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "comments_insert" ON post_comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);

CREATE POLICY "comments_update" ON post_comments
  FOR UPDATE USING (auth.uid() = author_id);

CREATE POLICY "comments_delete" ON post_comments
  FOR DELETE USING (auth.uid() = author_id);

-- Auto-update updated_at on edit
CREATE OR REPLACE FUNCTION update_post_comments_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_post_comments_updated_at ON post_comments;
CREATE TRIGGER trg_post_comments_updated_at
  BEFORE UPDATE ON post_comments
  FOR EACH ROW EXECUTE FUNCTION update_post_comments_updated_at();

-- 3. Allow post authors to edit and delete their own posts
-- (safe — skips if the policy already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'posts_update_own'
  ) THEN
    EXECUTE 'CREATE POLICY posts_update_own ON posts FOR UPDATE USING (auth.uid() = author_id)';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'posts' AND policyname = 'posts_delete_own'
  ) THEN
    EXECUTE 'CREATE POLICY posts_delete_own ON posts FOR DELETE USING (auth.uid() = author_id)';
  END IF;
END $$;
