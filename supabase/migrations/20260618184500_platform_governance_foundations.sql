CREATE TYPE public.suitability_outcome AS ENUM ('pending', 'passed', 'needs_review', 'failed');
CREATE TYPE public.document_scope AS ENUM ('opportunity', 'business_entity', 'commitment', 'profile');
CREATE TYPE public.document_status AS ENUM ('draft', 'uploaded', 'approved', 'rejected', 'expired');
CREATE TYPE public.wallet_request_status AS ENUM ('pending', 'submitted', 'processing', 'completed', 'rejected', 'cancelled');
CREATE TYPE public.reconciliation_status AS ENUM ('pending', 'received', 'matched', 'in_escrow', 'released', 'refunded', 'flagged');
CREATE TYPE public.round_state AS ENUM ('draft', 'live', 'soft_committed', 'funded', 'escrowed', 'closed', 'released', 'refunded');
CREATE TYPE public.audit_severity AS ENUM ('info', 'warning', 'critical');

ALTER TABLE public.opportunities
  ADD COLUMN IF NOT EXISTS round_state public.round_state NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS minimum_investment NUMERIC DEFAULT 50000,
  ADD COLUMN IF NOT EXISTS risk_level TEXT,
  ADD COLUMN IF NOT EXISTS instrument_type TEXT,
  ADD COLUMN IF NOT EXISTS duration_days INTEGER,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS legal_terms_url TEXT;

CREATE TABLE public.investor_suitability_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  jurisdiction TEXT NOT NULL,
  experience_level TEXT,
  annual_income_range TEXT,
  net_worth_range TEXT,
  loss_capacity TEXT,
  liquidity_needs TEXT,
  investment_horizon TEXT,
  risk_tolerance TEXT,
  answers JSONB NOT NULL DEFAULT '{}'::JSONB,
  score NUMERIC NOT NULL DEFAULT 0,
  outcome public.suitability_outcome NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.investor_suitability_assessments TO authenticated;
GRANT ALL ON public.investor_suitability_assessments TO service_role;
ALTER TABLE public.investor_suitability_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "suitability_owner_read" ON public.investor_suitability_assessments
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "suitability_owner_insert" ON public.investor_suitability_assessments
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "suitability_owner_update" ON public.investor_suitability_assessments
  FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_suitability_updated BEFORE UPDATE ON public.investor_suitability_assessments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.offering_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope public.document_scope NOT NULL,
  opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE,
  business_entity_id UUID REFERENCES public.business_entities(id) ON DELETE CASCADE,
  commitment_id UUID REFERENCES public.investment_commitments(id) ON DELETE CASCADE,
  uploader_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  document_type TEXT NOT NULL,
  file_url TEXT,
  description TEXT,
  visibility TEXT NOT NULL DEFAULT 'investors',
  status public.document_status NOT NULL DEFAULT 'draft',
  version_label TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.offering_documents TO authenticated;
GRANT ALL ON public.offering_documents TO service_role;
ALTER TABLE public.offering_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "offering_documents_read" ON public.offering_documents
  FOR SELECT USING (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (
      SELECT 1 FROM public.investment_commitments ic
      WHERE ic.opportunity_id = offering_documents.opportunity_id
        AND ic.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.businesses b
      JOIN public.opportunities o ON o.business_id = b.id
      WHERE o.id = offering_documents.opportunity_id
        AND b.owner_id = auth.uid()
    )
  );
CREATE POLICY "offering_documents_write" ON public.offering_documents
  FOR ALL USING (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (
      SELECT 1 FROM public.businesses b
      JOIN public.opportunities o ON o.business_id = b.id
      WHERE o.id = offering_documents.opportunity_id
        AND b.owner_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (
      SELECT 1 FROM public.businesses b
      JOIN public.opportunities o ON o.business_id = b.id
      WHERE o.id = offering_documents.opportunity_id
        AND b.owner_id = auth.uid()
    )
  );
CREATE TRIGGER trg_offering_documents_updated BEFORE UPDATE ON public.offering_documents
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.business_entity_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_entity_id UUID NOT NULL REFERENCES public.business_entities(id) ON DELETE CASCADE,
  uploader_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  document_type TEXT NOT NULL,
  file_url TEXT,
  status public.document_status NOT NULL DEFAULT 'draft',
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.business_entity_documents TO authenticated;
GRANT ALL ON public.business_entity_documents TO service_role;
ALTER TABLE public.business_entity_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "entity_documents_owner_read" ON public.business_entity_documents
  FOR SELECT USING (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (
      SELECT 1 FROM public.business_entities be
      WHERE be.id = business_entity_documents.business_entity_id
        AND be.owner_user_id = auth.uid()
    )
  );
CREATE POLICY "entity_documents_owner_write" ON public.business_entity_documents
  FOR ALL USING (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (
      SELECT 1 FROM public.business_entities be
      WHERE be.id = business_entity_documents.business_entity_id
        AND be.owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (
      SELECT 1 FROM public.business_entities be
      WHERE be.id = business_entity_documents.business_entity_id
        AND be.owner_user_id = auth.uid()
    )
  );
CREATE TRIGGER trg_entity_documents_updated BEFORE UPDATE ON public.business_entity_documents
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.opportunity_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  author_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'investors',
  status TEXT NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.opportunity_updates TO authenticated;
GRANT ALL ON public.opportunity_updates TO service_role;
ALTER TABLE public.opportunity_updates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "opportunity_updates_read" ON public.opportunity_updates
  FOR SELECT USING (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (
      SELECT 1 FROM public.businesses b
      JOIN public.opportunities o ON o.business_id = b.id
      WHERE o.id = opportunity_updates.opportunity_id
        AND b.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.investment_commitments ic
      WHERE ic.opportunity_id = opportunity_updates.opportunity_id
        AND ic.user_id = auth.uid()
    )
  );
CREATE POLICY "opportunity_updates_write" ON public.opportunity_updates
  FOR ALL USING (
    public.has_role(auth.uid(),'admin')
    OR auth.uid() = author_user_id
  )
  WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR auth.uid() = author_user_id
  );
CREATE TRIGGER trg_opportunity_updates_updated BEFORE UPDATE ON public.opportunity_updates
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.payment_reconciliation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commitment_id UUID NOT NULL REFERENCES public.investment_commitments(id) ON DELETE CASCADE,
  funding_instruction_id UUID REFERENCES public.funding_instructions(id) ON DELETE SET NULL,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.reconciliation_status NOT NULL,
  amount NUMERIC,
  external_reference TEXT,
  note TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.payment_reconciliation_events TO authenticated;
GRANT ALL ON public.payment_reconciliation_events TO service_role;
ALTER TABLE public.payment_reconciliation_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reconciliation_read" ON public.payment_reconciliation_events
  FOR SELECT USING (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (
      SELECT 1 FROM public.investment_commitments ic
      WHERE ic.id = payment_reconciliation_events.commitment_id
        AND ic.user_id = auth.uid()
    )
  );
CREATE POLICY "reconciliation_insert" ON public.payment_reconciliation_events
  FOR INSERT WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (
      SELECT 1 FROM public.investment_commitments ic
      WHERE ic.id = payment_reconciliation_events.commitment_id
        AND ic.user_id = auth.uid()
    )
  );

CREATE TABLE public.investor_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  commitment_id UUID REFERENCES public.investment_commitments(id) ON DELETE SET NULL,
  statement_type TEXT NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.investor_statements TO authenticated;
GRANT ALL ON public.investor_statements TO service_role;
ALTER TABLE public.investor_statements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "investor_statements_owner_read" ON public.investor_statements
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "investor_statements_owner_insert" ON public.investor_statements
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.payout_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commitment_id UUID NOT NULL REFERENCES public.investment_commitments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  note TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.payout_events TO authenticated;
GRANT ALL ON public.payout_events TO service_role;
ALTER TABLE public.payout_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payouts_owner_read" ON public.payout_events
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "payouts_owner_insert" ON public.payout_events
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.refund_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commitment_id UUID NOT NULL REFERENCES public.investment_commitments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled',
  note TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.refund_events TO authenticated;
GRANT ALL ON public.refund_events TO service_role;
ALTER TABLE public.refund_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "refunds_owner_read" ON public.refund_events
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "refunds_owner_insert" ON public.refund_events
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.wallet_deposit_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES public.investor_wallets(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  rail public.funding_rail NOT NULL DEFAULT 'bank_transfer',
  status public.wallet_request_status NOT NULL DEFAULT 'pending',
  reference_code TEXT,
  note TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.wallet_deposit_requests TO authenticated;
GRANT ALL ON public.wallet_deposit_requests TO service_role;
ALTER TABLE public.wallet_deposit_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wallet_deposits_owner_read" ON public.wallet_deposit_requests
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "wallet_deposits_owner_insert" ON public.wallet_deposit_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "wallet_deposits_owner_update" ON public.wallet_deposit_requests
  FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_wallet_deposit_requests_updated BEFORE UPDATE ON public.wallet_deposit_requests
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.wallet_withdrawal_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID REFERENCES public.investor_wallets(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  destination_label TEXT,
  destination_details JSONB NOT NULL DEFAULT '{}'::JSONB,
  status public.wallet_request_status NOT NULL DEFAULT 'pending',
  note TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.wallet_withdrawal_requests TO authenticated;
GRANT ALL ON public.wallet_withdrawal_requests TO service_role;
ALTER TABLE public.wallet_withdrawal_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wallet_withdrawals_owner_read" ON public.wallet_withdrawal_requests
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "wallet_withdrawals_owner_insert" ON public.wallet_withdrawal_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "wallet_withdrawals_owner_update" ON public.wallet_withdrawal_requests
  FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_wallet_withdrawal_requests_updated BEFORE UPDATE ON public.wallet_withdrawal_requests
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.admin_audit_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_table TEXT NOT NULL,
  target_id UUID,
  action TEXT NOT NULL,
  severity public.audit_severity NOT NULL DEFAULT 'info',
  note TEXT,
  suspicious BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.admin_audit_events TO authenticated;
GRANT ALL ON public.admin_audit_events TO service_role;
ALTER TABLE public.admin_audit_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_audit_read" ON public.admin_audit_events
  FOR SELECT USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin_audit_insert" ON public.admin_audit_events
  FOR INSERT WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  note TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.security_events TO authenticated;
GRANT ALL ON public.security_events TO service_role;
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "security_events_owner_read" ON public.security_events
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "security_events_owner_insert" ON public.security_events
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.opportunity_round_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  round_state public.round_state NOT NULL,
  note TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.opportunity_round_events TO authenticated;
GRANT ALL ON public.opportunity_round_events TO service_role;
ALTER TABLE public.opportunity_round_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "round_events_read" ON public.opportunity_round_events
  FOR SELECT USING (true);
CREATE POLICY "round_events_insert" ON public.opportunity_round_events
  FOR INSERT WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE INDEX idx_suitability_user_id ON public.investor_suitability_assessments(user_id);
CREATE INDEX idx_offering_documents_opportunity_id ON public.offering_documents(opportunity_id);
CREATE INDEX idx_entity_documents_business_entity_id ON public.business_entity_documents(business_entity_id);
CREATE INDEX idx_opportunity_updates_opportunity_id ON public.opportunity_updates(opportunity_id);
CREATE INDEX idx_reconciliation_commitment_id ON public.payment_reconciliation_events(commitment_id);
CREATE INDEX idx_wallet_deposit_user_id ON public.wallet_deposit_requests(user_id);
CREATE INDEX idx_wallet_withdrawal_user_id ON public.wallet_withdrawal_requests(user_id);
CREATE INDEX idx_admin_audit_created_at ON public.admin_audit_events(created_at DESC);
CREATE INDEX idx_security_events_user_id ON public.security_events(user_id);
CREATE INDEX idx_opportunity_round_events_opportunity_id ON public.opportunity_round_events(opportunity_id);
