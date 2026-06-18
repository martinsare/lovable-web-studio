CREATE TYPE public.verification_provider AS ENUM ('sumsub', 'youverify');
CREATE TYPE public.verification_subject_type AS ENUM ('individual_investor', 'business_entity', 'beneficial_owner');
CREATE TYPE public.verification_status AS ENUM ('draft', 'pending_submission', 'in_review', 'approved', 'rejected', 'needs_action', 'expired');

CREATE TABLE public.business_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID REFERENCES public.businesses(id) ON DELETE SET NULL,
  legal_name TEXT NOT NULL,
  trading_name TEXT,
  registration_number TEXT NOT NULL,
  tax_id TEXT,
  country TEXT NOT NULL,
  incorporation_date DATE,
  entity_type TEXT,
  registered_address TEXT,
  operating_address TEXT,
  verification_status public.verification_status NOT NULL DEFAULT 'draft',
  trust_score NUMERIC,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.business_entities TO authenticated;
GRANT ALL ON public.business_entities TO service_role;
ALTER TABLE public.business_entities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "business_entities_owner_read" ON public.business_entities
  FOR SELECT USING (auth.uid() = owner_user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "business_entities_owner_insert" ON public.business_entities
  FOR INSERT WITH CHECK (auth.uid() = owner_user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "business_entities_owner_update" ON public.business_entities
  FOR UPDATE USING (auth.uid() = owner_user_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = owner_user_id OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_business_entities_updated BEFORE UPDATE ON public.business_entities
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.ubo_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_entity_id UUID NOT NULL REFERENCES public.business_entities(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  role_title TEXT,
  ownership_percent NUMERIC(5,2),
  date_of_birth DATE,
  nationality TEXT,
  email TEXT,
  phone TEXT,
  residential_address TEXT,
  verification_status public.verification_status NOT NULL DEFAULT 'draft',
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.ubo_records TO authenticated;
GRANT ALL ON public.ubo_records TO service_role;
ALTER TABLE public.ubo_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ubo_owner_read" ON public.ubo_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.business_entities be
      WHERE be.id = business_entity_id
        AND (be.owner_user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
    )
  );
CREATE POLICY "ubo_owner_insert" ON public.ubo_records
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.business_entities be
      WHERE be.id = business_entity_id
        AND (be.owner_user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
    )
  );
CREATE POLICY "ubo_owner_update" ON public.ubo_records
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.business_entities be
      WHERE be.id = business_entity_id
        AND (be.owner_user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.business_entities be
      WHERE be.id = business_entity_id
        AND (be.owner_user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
    )
  );
CREATE TRIGGER trg_ubo_records_updated BEFORE UPDATE ON public.ubo_records
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.verification_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_entity_id UUID REFERENCES public.business_entities(id) ON DELETE CASCADE,
  ubo_record_id UUID REFERENCES public.ubo_records(id) ON DELETE CASCADE,
  provider public.verification_provider NOT NULL,
  subject_type public.verification_subject_type NOT NULL,
  status public.verification_status NOT NULL DEFAULT 'draft',
  provider_session_id TEXT NOT NULL,
  provider_applicant_id TEXT,
  review_url TEXT,
  request_payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  response_payload JSONB NOT NULL DEFAULT '{}'::JSONB,
  last_webhook_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(provider, provider_session_id)
);

GRANT SELECT, INSERT, UPDATE ON public.verification_sessions TO authenticated;
GRANT ALL ON public.verification_sessions TO service_role;
ALTER TABLE public.verification_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "verification_sessions_owner_read" ON public.verification_sessions
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(),'admin')
    OR EXISTS (
      SELECT 1 FROM public.business_entities be
      WHERE be.id = business_entity_id AND be.owner_user_id = auth.uid()
    )
  );
CREATE POLICY "verification_sessions_owner_insert" ON public.verification_sessions
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR public.has_role(auth.uid(),'admin')
    OR EXISTS (
      SELECT 1 FROM public.business_entities be
      WHERE be.id = business_entity_id AND be.owner_user_id = auth.uid()
    )
  );
CREATE POLICY "verification_sessions_owner_update" ON public.verification_sessions
  FOR UPDATE USING (
    auth.uid() = user_id
    OR public.has_role(auth.uid(),'admin')
    OR EXISTS (
      SELECT 1 FROM public.business_entities be
      WHERE be.id = business_entity_id AND be.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR public.has_role(auth.uid(),'admin')
    OR EXISTS (
      SELECT 1 FROM public.business_entities be
      WHERE be.id = business_entity_id AND be.owner_user_id = auth.uid()
    )
  );
CREATE TRIGGER trg_verification_sessions_updated BEFORE UPDATE ON public.verification_sessions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_business_entities_owner_user_id ON public.business_entities(owner_user_id);
CREATE INDEX idx_ubo_records_business_entity_id ON public.ubo_records(business_entity_id);
CREATE INDEX idx_verification_sessions_user_id ON public.verification_sessions(user_id);
CREATE INDEX idx_verification_sessions_business_entity_id ON public.verification_sessions(business_entity_id);
CREATE INDEX idx_verification_sessions_status ON public.verification_sessions(status);
