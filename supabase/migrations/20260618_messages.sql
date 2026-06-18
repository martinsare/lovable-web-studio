-- =============================================
-- Direct messaging: conversations + messages
-- =============================================

-- Conversations between exactly two participants.
-- participant_a is always the lexicographically smaller user id
-- so the UNIQUE constraint prevents duplicates.
CREATE TABLE IF NOT EXISTS public.conversations (
  id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_a        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant_b        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_preview TEXT,
  CONSTRAINT conversations_unique UNIQUE (participant_a, participant_b),
  CONSTRAINT conversations_no_self CHECK (participant_a <> participant_b)
);

CREATE INDEX IF NOT EXISTS conversations_participant_a_idx ON public.conversations (participant_a);
CREATE INDEX IF NOT EXISTS conversations_participant_b_idx ON public.conversations (participant_b);
CREATE INDEX IF NOT EXISTS conversations_last_message_at_idx ON public.conversations (last_message_at DESC);

GRANT SELECT, INSERT ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "conversations_participants_select" ON public.conversations
  FOR SELECT USING (auth.uid() = participant_a OR auth.uid() = participant_b);

CREATE POLICY "conversations_participants_insert" ON public.conversations
  FOR INSERT WITH CHECK (auth.uid() = participant_a OR auth.uid() = participant_b);

-- Messages inside a conversation
CREATE TABLE IF NOT EXISTS public.messages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID        NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body            TEXT        NOT NULL CHECK (char_length(body) > 0 AND char_length(body) <= 2000),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS messages_conversation_id_idx ON public.messages (conversation_id, created_at);

GRANT SELECT, INSERT ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Only participants in the conversation can read its messages
CREATE POLICY "messages_select" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())
    )
  );

-- Only participants can send messages, and sender_id must be themselves
CREATE POLICY "messages_insert" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())
    )
  );

-- Allow participants to mark messages as read
CREATE POLICY "messages_update_read" ON public.messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
        AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())
    )
  ) WITH CHECK (true);

-- Trigger: keep conversation.last_message_at + preview up to date
CREATE OR REPLACE FUNCTION public.handle_message_insert()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.conversations
  SET
    last_message_at      = NEW.created_at,
    last_message_preview = left(NEW.body, 80)
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_message_after_insert
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.handle_message_insert();

-- Enable real-time for messages so threads update live
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
