-- Add followers_count and following_count to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS followers_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS following_count INT NOT NULL DEFAULT 0;

-- User-to-user follows table
CREATE TABLE IF NOT EXISTS public.user_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_follows_unique UNIQUE (follower_id, following_id),
  CONSTRAINT user_follows_no_self CHECK (follower_id <> following_id)
);

GRANT SELECT, INSERT, DELETE ON public.user_follows TO authenticated;
GRANT ALL ON public.user_follows TO service_role;

ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_follows_public_read" ON public.user_follows
  FOR SELECT USING (true);

CREATE POLICY "user_follows_self_insert" ON public.user_follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "user_follows_self_delete" ON public.user_follows
  FOR DELETE USING (auth.uid() = follower_id);

-- Trigger: increment counts when a follow is created
CREATE OR REPLACE FUNCTION public.handle_follow_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles SET followers_count = followers_count + 1 WHERE id = NEW.following_id;
  UPDATE public.profiles SET following_count = following_count + 1 WHERE id = NEW.follower_id;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_user_follows_after_insert
AFTER INSERT ON public.user_follows
FOR EACH ROW EXECUTE FUNCTION public.handle_follow_insert();

-- Trigger: decrement counts when a follow is removed
CREATE OR REPLACE FUNCTION public.handle_follow_delete()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.profiles SET followers_count = GREATEST(0, followers_count - 1) WHERE id = OLD.following_id;
  UPDATE public.profiles SET following_count = GREATEST(0, following_count - 1) WHERE id = OLD.follower_id;
  RETURN OLD;
END; $$;

CREATE TRIGGER trg_user_follows_after_delete
AFTER DELETE ON public.user_follows
FOR EACH ROW EXECUTE FUNCTION public.handle_follow_delete();
