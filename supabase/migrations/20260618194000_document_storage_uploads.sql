ALTER TABLE public.offering_documents
  ADD COLUMN IF NOT EXISTS storage_bucket TEXT,
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS original_filename TEXT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT,
  ADD COLUMN IF NOT EXISTS file_size BIGINT,
  ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ;

ALTER TABLE public.business_entity_documents
  ADD COLUMN IF NOT EXISTS storage_bucket TEXT,
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS original_filename TEXT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT,
  ADD COLUMN IF NOT EXISTS file_size BIGINT,
  ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ;

ALTER TABLE public.investor_statements
  ADD COLUMN IF NOT EXISTS storage_bucket TEXT,
  ADD COLUMN IF NOT EXISTS storage_path TEXT,
  ADD COLUMN IF NOT EXISTS original_filename TEXT,
  ADD COLUMN IF NOT EXISTS mime_type TEXT,
  ADD COLUMN IF NOT EXISTS file_size BIGINT,
  ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMPTZ;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'business-entity-documents',
    'business-entity-documents',
    false,
    15728640,
    ARRAY[
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/webp',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  ),
  (
    'offering-documents',
    'offering-documents',
    false,
    15728640,
    ARRAY[
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/webp',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  ),
  (
    'investor-statements',
    'investor-statements',
    false,
    15728640,
    ARRAY[
      'application/pdf',
      'image/png',
      'image/jpeg',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]
  )
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "entity_documents_storage_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'business-entity-documents'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1
        FROM public.business_entities be
        WHERE be.id::TEXT = (storage.foldername(name))[1]
          AND be.owner_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "entity_documents_storage_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'business-entity-documents'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1
        FROM public.business_entities be
        WHERE be.id::TEXT = (storage.foldername(name))[1]
          AND be.owner_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "entity_documents_storage_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'business-entity-documents'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1
        FROM public.business_entities be
        WHERE be.id::TEXT = (storage.foldername(name))[1]
          AND be.owner_user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    bucket_id = 'business-entity-documents'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1
        FROM public.business_entities be
        WHERE be.id::TEXT = (storage.foldername(name))[1]
          AND be.owner_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "entity_documents_storage_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'business-entity-documents'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1
        FROM public.business_entities be
        WHERE be.id::TEXT = (storage.foldername(name))[1]
          AND be.owner_user_id = auth.uid()
      )
    )
  );

CREATE POLICY "offering_documents_storage_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'offering-documents'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1
        FROM public.businesses b
        JOIN public.opportunities o ON o.business_id = b.id
        WHERE o.id::TEXT = (storage.foldername(name))[1]
          AND b.owner_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1
        FROM public.investment_commitments ic
        WHERE ic.opportunity_id::TEXT = (storage.foldername(name))[1]
          AND ic.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "offering_documents_storage_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'offering-documents'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1
        FROM public.businesses b
        JOIN public.opportunities o ON o.business_id = b.id
        WHERE o.id::TEXT = (storage.foldername(name))[1]
          AND b.owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "offering_documents_storage_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'offering-documents'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1
        FROM public.businesses b
        JOIN public.opportunities o ON o.business_id = b.id
        WHERE o.id::TEXT = (storage.foldername(name))[1]
          AND b.owner_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    bucket_id = 'offering-documents'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1
        FROM public.businesses b
        JOIN public.opportunities o ON o.business_id = b.id
        WHERE o.id::TEXT = (storage.foldername(name))[1]
          AND b.owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "offering_documents_storage_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'offering-documents'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1
        FROM public.businesses b
        JOIN public.opportunities o ON o.business_id = b.id
        WHERE o.id::TEXT = (storage.foldername(name))[1]
          AND b.owner_id = auth.uid()
      )
    )
  );

CREATE POLICY "investor_statements_storage_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'investor-statements'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR auth.uid()::TEXT = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "investor_statements_storage_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'investor-statements'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR auth.uid()::TEXT = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "investor_statements_storage_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'investor-statements'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR auth.uid()::TEXT = (storage.foldername(name))[1]
    )
  )
  WITH CHECK (
    bucket_id = 'investor-statements'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR auth.uid()::TEXT = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "investor_statements_storage_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'investor-statements'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR auth.uid()::TEXT = (storage.foldername(name))[1]
    )
  );
