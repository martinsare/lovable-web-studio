CREATE TYPE public.mentor_application_status AS ENUM (
  'draft',
  'pending_review',
  'needs_action',
  'approved',
  'rejected'
);

CREATE TABLE public.mentor_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  applicant_name TEXT,
  applicant_email TEXT,
  mentor_focus TEXT,
  status public.mentor_application_status NOT NULL DEFAULT 'draft',
  platform_joined_at TIMESTAMPTZ,
  last_active_at TIMESTAMPTZ,
  investment_count INT NOT NULL DEFAULT 0,
  total_invested_amount NUMERIC NOT NULL DEFAULT 0,
  experience_summary TEXT NOT NULL,
  qualification_summary TEXT NOT NULL,
  proof_storage_bucket TEXT,
  proof_storage_path TEXT,
  proof_original_filename TEXT,
  proof_mime_type TEXT,
  proof_file_size BIGINT,
  application_note TEXT,
  reviewer_note TEXT,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.mentor_applications TO authenticated;
GRANT ALL ON public.mentor_applications TO service_role;
ALTER TABLE public.mentor_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mentor_applications_owner_read" ON public.mentor_applications
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "mentor_applications_owner_insert" ON public.mentor_applications
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "mentor_applications_owner_update" ON public.mentor_applications
  FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "mentor_applications_owner_delete" ON public.mentor_applications
  FOR DELETE USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_mentor_applications_updated BEFORE UPDATE ON public.mentor_applications
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'mentor-application-documents',
  'mentor-application-documents',
  false,
  15728640,
  ARRAY[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "mentor_application_docs_storage_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'mentor-application-documents'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR auth.uid()::TEXT = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "mentor_application_docs_storage_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'mentor-application-documents'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR auth.uid()::TEXT = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "mentor_application_docs_storage_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'mentor-application-documents'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR auth.uid()::TEXT = (storage.foldername(name))[1]
    )
  )
  WITH CHECK (
    bucket_id = 'mentor-application-documents'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR auth.uid()::TEXT = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "mentor_application_docs_storage_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'mentor-application-documents'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR auth.uid()::TEXT = (storage.foldername(name))[1]
    )
  );

CREATE INDEX idx_mentor_applications_user_id ON public.mentor_applications(user_id);
CREATE INDEX idx_mentor_applications_status ON public.mentor_applications(status);
