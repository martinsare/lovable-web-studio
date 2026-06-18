                                                                                                                                                                                                                                                                                                                      CREATE TYPE public.funding_rail AS ENUM ('bank_transfer', 'wire', 'wallet_balance');
CREATE TYPE public.commitment_status AS ENUM ('draft', 'pending_payment', 'funded', 'in_escrow', 'released', 'refunded', 'cancelled');
CREATE TYPE public.wallet_transaction_type AS ENUM ('deposit', 'hold', 'release', 'refund', 'fee');
CREATE TYPE public.escrow_event_type AS ENUM ('funding_requested', 'funded', 'held_in_escrow', 'released', 'refunded', 'cancelled');

CREATE TABLE public.investor_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  currency TEXT NOT NULL DEFAULT 'NGN',
  ledger_balance NUMERIC NOT NULL DEFAULT 0,
  available_balance NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.investor_wallets TO authenticated;
GRANT ALL ON public.investor_wallets TO service_role;
ALTER TABLE public.investor_wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "investor_wallets_owner_read" ON public.investor_wallets
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "investor_wallets_owner_insert" ON public.investor_wallets
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "investor_wallets_owner_update" ON public.investor_wallets
  FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_investor_wallets_updated BEFORE UPDATE ON public.investor_wallets
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.investment_commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  business_entity_id UUID REFERENCES public.business_entities(id) ON DELETE SET NULL,
  investing_as TEXT NOT NULL DEFAULT 'individual',
  amount NUMERIC NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'NGN',
  rail public.funding_rail NOT NULL,
  status public.commitment_status NOT NULL DEFAULT 'draft',
  instrument_label TEXT,
  escrow_reference TEXT,
  disclosures_accepted BOOLEAN NOT NULL DEFAULT false,
  risk_acknowledged BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.investment_commitments TO authenticated;
GRANT ALL ON public.investment_commitments TO service_role;
ALTER TABLE public.investment_commitments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "investment_commitments_owner_read" ON public.investment_commitments
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "investment_commitments_owner_insert" ON public.investment_commitments
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "investment_commitments_owner_update" ON public.investment_commitments
  FOR UPDATE USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_investment_commitments_updated BEFORE UPDATE ON public.investment_commitments
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.funding_instructions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commitment_id UUID NOT NULL REFERENCES public.investment_commitments(id) ON DELETE CASCADE,
  rail public.funding_rail NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reference_code TEXT NOT NULL,
  account_name TEXT,
  bank_name TEXT,
  account_number TEXT,
  bank_country TEXT,
  beneficiary_name TEXT,
  beneficiary_address TEXT,
  swift_code TEXT,
  iban TEXT,
  wallet_hold_amount NUMERIC,
  expires_at TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.funding_instructions TO authenticated;
GRANT ALL ON public.funding_instructions TO service_role;
ALTER TABLE public.funding_instructions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "funding_instructions_owner_read" ON public.funding_instructions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.investment_commitments ic
      WHERE ic.id = commitment_id
        AND (ic.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
    )
  );
CREATE POLICY "funding_instructions_owner_insert" ON public.funding_instructions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.investment_commitments ic
      WHERE ic.id = commitment_id
        AND (ic.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
    )
  );
CREATE POLICY "funding_instructions_owner_update" ON public.funding_instructions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.investment_commitments ic
      WHERE ic.id = commitment_id
        AND (ic.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.investment_commitments ic
      WHERE ic.id = commitment_id
        AND (ic.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
    )
  );
CREATE TRIGGER trg_funding_instructions_updated BEFORE UPDATE ON public.funding_instructions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.investor_wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  commitment_id UUID REFERENCES public.investment_commitments(id) ON DELETE SET NULL,
  transaction_type public.wallet_transaction_type NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'posted',
  reference_code TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wallet_transactions_owner_read" ON public.wallet_transactions
  FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "wallet_transactions_owner_insert" ON public.wallet_transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.escrow_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  commitment_id UUID NOT NULL REFERENCES public.investment_commitments(id) ON DELETE CASCADE,
  event_type public.escrow_event_type NOT NULL,
  amount NUMERIC,
  note TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.escrow_events TO authenticated;
GRANT ALL ON public.escrow_events TO service_role;
ALTER TABLE public.escrow_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "escrow_events_owner_read" ON public.escrow_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.investment_commitments ic
      WHERE ic.id = commitment_id
        AND (ic.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
    )
  );
CREATE POLICY "escrow_events_owner_insert" ON public.escrow_events
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.investment_commitments ic
      WHERE ic.id = commitment_id
        AND (ic.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
    )
  );

CREATE INDEX idx_investment_commitments_user_id ON public.investment_commitments(user_id);
CREATE INDEX idx_investment_commitments_opportunity_id ON public.investment_commitments(opportunity_id);
CREATE INDEX idx_investment_commitments_status ON public.investment_commitments(status);
CREATE INDEX idx_funding_instructions_commitment_id ON public.funding_instructions(commitment_id);
CREATE INDEX idx_wallet_transactions_wallet_id ON public.wallet_transactions(wallet_id);
CREATE INDEX idx_escrow_events_commitment_id ON public.escrow_events(commitment_id);

CREATE OR REPLACE FUNCTION public.create_investment_commitment(
  p_opportunity_id UUID,
  p_business_entity_id UUID DEFAULT NULL,
  p_investing_as TEXT DEFAULT 'individual',
  p_amount NUMERIC DEFAULT 0,
  p_rail public.funding_rail DEFAULT 'bank_transfer',
  p_instrument_label TEXT DEFAULT NULL,
  p_disclosures_accepted BOOLEAN DEFAULT false,
  p_risk_acknowledged BOOLEAN DEFAULT false
)
RETURNS TABLE (
  commitment_id UUID,
  status public.commitment_status,
  reference_code TEXT,
  rail public.funding_rail,
  instructions JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_opportunity RECORD;
  v_wallet RECORD;
  v_commitment_id UUID;
  v_reference_code TEXT;
  v_status public.commitment_status := 'draft';
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero';
  END IF;

  IF NOT p_disclosures_accepted OR NOT p_risk_acknowledged THEN
    RAISE EXCEPTION 'Risk acknowledgement and disclosures acceptance are required';
  END IF;

  SELECT o.id, o.business_id, o.title, o.status, b.name AS business_name
  INTO v_opportunity
  FROM public.opportunities o
  JOIN public.businesses b ON b.id = o.business_id
  WHERE o.id = p_opportunity_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Opportunity not found';
  END IF;

  IF v_opportunity.status <> 'open' THEN
    RAISE EXCEPTION 'This opportunity is not currently open for investment';
  END IF;

  IF p_business_entity_id IS NOT NULL THEN
    PERFORM 1
    FROM public.business_entities be
    WHERE be.id = p_business_entity_id
      AND be.owner_user_id = v_user_id
      AND be.verification_status = 'approved';

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Selected business entity is not approved for investing';
    END IF;
  END IF;

  INSERT INTO public.investment_commitments (
    user_id,
    business_id,
    opportunity_id,
    business_entity_id,
    investing_as,
    amount,
    rail,
    instrument_label,
    disclosures_accepted,
    risk_acknowledged,
    metadata
  )
  VALUES (
    v_user_id,
    v_opportunity.business_id,
    p_opportunity_id,
    p_business_entity_id,
    p_investing_as,
    p_amount,
    p_rail,
    p_instrument_label,
    p_disclosures_accepted,
    p_risk_acknowledged,
    jsonb_build_object(
      'opportunity_title', v_opportunity.title,
      'business_name', v_opportunity.business_name,
      'created_via', 'checkout_flow'
    )
  )
  RETURNING id INTO v_commitment_id;

  v_reference_code := 'CFD-' || UPPER(SUBSTRING(REPLACE(v_commitment_id::TEXT, '-', '') FROM 1 FOR 10));

  IF p_rail = 'wallet_balance' THEN
    INSERT INTO public.investor_wallets (user_id)
    VALUES (v_user_id)
    ON CONFLICT (user_id) DO NOTHING;

    SELECT *
    INTO v_wallet
    FROM public.investor_wallets
    WHERE user_id = v_user_id
    FOR UPDATE;

    IF COALESCE(v_wallet.available_balance, 0) < p_amount THEN
      RAISE EXCEPTION 'Insufficient wallet balance';
    END IF;

    UPDATE public.investor_wallets
    SET
      available_balance = available_balance - p_amount,
      ledger_balance = ledger_balance - p_amount
    WHERE id = v_wallet.id;

    INSERT INTO public.wallet_transactions (
      wallet_id,
      user_id,
      commitment_id,
      transaction_type,
      amount,
      status,
      reference_code,
      metadata
    )
    VALUES (
      v_wallet.id,
      v_user_id,
      v_commitment_id,
      'hold',
      p_amount,
      'posted',
      v_reference_code,
      jsonb_build_object('rail', p_rail, 'action', 'wallet_hold_for_investment')
    );

    INSERT INTO public.funding_instructions (
      commitment_id,
      rail,
      status,
      reference_code,
      wallet_hold_amount,
      expires_at,
      metadata
    )
    VALUES (
      v_commitment_id,
      p_rail,
      'settled',
      v_reference_code,
      p_amount,
      now() + interval '15 minutes',
      jsonb_build_object(
        'headline', 'Wallet balance reserved',
        'message', 'Funds have been moved from your wallet into escrow for this commitment.'
      )
    );

    INSERT INTO public.escrow_events (
      commitment_id,
      event_type,
      amount,
      note,
      metadata
    )
    VALUES (
      v_commitment_id,
      'held_in_escrow',
      p_amount,
      'Wallet-funded commitment reserved in escrow',
      jsonb_build_object('rail', p_rail, 'reference_code', v_reference_code)
    );

    v_status := 'in_escrow';
  ELSIF p_rail = 'bank_transfer' THEN
    INSERT INTO public.funding_instructions (
      commitment_id,
      rail,
      status,
      reference_code,
      account_name,
      bank_name,
      account_number,
      bank_country,
      expires_at,
      metadata
    )
    VALUES (
      v_commitment_id,
      p_rail,
      'awaiting_transfer',
      v_reference_code,
      'CoFund Escrow Collections',
      'Settlement Partner Bank',
      '1029384756',
      'Nigeria',
      now() + interval '72 hours',
      jsonb_build_object(
        'headline', 'Fund this commitment by local bank transfer',
        'steps', jsonb_build_array(
          'Send the exact committed amount to the escrow collection account.',
          'Use the reference code as your payment narration.',
          'Transfers are reviewed before funds are marked in escrow.'
        )
      )
    );

    INSERT INTO public.escrow_events (
      commitment_id,
      event_type,
      amount,
      note,
      metadata
    )
    VALUES (
      v_commitment_id,
      'funding_requested',
      p_amount,
      'Bank transfer instructions generated',
      jsonb_build_object('rail', p_rail, 'reference_code', v_reference_code)
    );

    v_status := 'pending_payment';
  ELSE
    INSERT INTO public.funding_instructions (
      commitment_id,
      rail,
      status,
      reference_code,
      beneficiary_name,
      beneficiary_address,
      bank_name,
      bank_country,
      swift_code,
      iban,
      expires_at,
      metadata
    )
    VALUES (
      v_commitment_id,
      p_rail,
      'awaiting_wire',
      v_reference_code,
      'CoFund Escrow SPV',
      '27 Marina, Lagos, Nigeria',
      'Global Settlement Bank',
      'United Kingdom',
      'GSBKGB2L',
      'GB29NWBK60161331926819',
      now() + interval '5 days',
      jsonb_build_object(
        'headline', 'Fund this commitment by domestic or international wire',
        'steps', jsonb_build_array(
          'Share the beneficiary details with your bank or treasury desk.',
          'Include the reference code in the wire message field.',
          'Large wires may require manual reconciliation before escrow confirmation.'
        )
      )
    );

    INSERT INTO public.escrow_events (
      commitment_id,
      event_type,
      amount,
      note,
      metadata
    )
    VALUES (
      v_commitment_id,
      'funding_requested',
      p_amount,
      'Wire instructions generated',
      jsonb_build_object('rail', p_rail, 'reference_code', v_reference_code)
    );

    v_status := 'pending_payment';
  END IF;

  UPDATE public.investment_commitments
  SET
    status = v_status,
    escrow_reference = v_reference_code
  WHERE id = v_commitment_id;

  RETURN QUERY
  SELECT
    v_commitment_id,
    v_status,
    v_reference_code,
    p_rail,
    (
      SELECT jsonb_build_object(
        'status', fi.status,
        'reference_code', fi.reference_code,
        'account_name', fi.account_name,
        'bank_name', fi.bank_name,
        'account_number', fi.account_number,
        'bank_country', fi.bank_country,
        'beneficiary_name', fi.beneficiary_name,
        'beneficiary_address', fi.beneficiary_address,
        'swift_code', fi.swift_code,
        'iban', fi.iban,
        'wallet_hold_amount', fi.wallet_hold_amount,
        'expires_at', fi.expires_at,
        'metadata', fi.metadata
      )
      FROM public.funding_instructions fi
      WHERE fi.commitment_id = v_commitment_id
      ORDER BY fi.created_at DESC
      LIMIT 1
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_investment_commitment(UUID, UUID, TEXT, NUMERIC, public.funding_rail, TEXT, BOOLEAN, BOOLEAN) TO authenticated, service_role;
