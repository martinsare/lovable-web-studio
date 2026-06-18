# CoFund Platform Foundations

This document maps CoFund's trust-driven product direction into the core platform systems that now exist in the codebase.

## 1. Appropriateness and Suitability

- Route: `src/routes/_authenticated/suitability.tsx`
- Logic: `src/lib/suitability.ts`
- Table: `public.investor_suitability_assessments`

Purpose:
- records risk tolerance, experience, liquidity needs, and loss capacity
- produces a scored suitability outcome
- updates profile compliance metadata for funding decisions

## 2. Payment Reconciliation Workflow

- Tables:
  - `public.payment_reconciliation_events`
  - `public.investment_commitments`
  - `public.funding_instructions`
  - `public.escrow_events`
- Admin surface: `src/routes/_authenticated/admin.tsx`

Purpose:
- marks inbound money as received, matched, escrowed, released, or refunded
- provides operator history instead of relying on hidden manual checks

## 3. Security Center

- Route: `src/routes/_authenticated/security.tsx`
- Existing readiness logic:
  - `src/hooks/use-security.ts`
  - `src/lib/auth-security.ts`
- Table: `public.security_events`

Purpose:
- makes MFA, assurance level, funding access, and key security actions visible
- provides a product-owned security timeline

## 4. Document Center and Offering Room

- Route: `src/routes/_authenticated/offerings/$opportunityId.tsx`
- Tables:
  - `public.offering_documents`
  - `public.opportunity_updates`
  - `public.opportunity_round_events`

Purpose:
- centralizes offering docs, issuer updates, disclosures, and round-state history

## 5. Post-Investment Lifecycle

- Tables:
  - `public.investor_statements`
  - `public.payout_events`
  - `public.refund_events`
- Portfolio route: `src/routes/_authenticated/portfolio.tsx`

Purpose:
- prepares the platform for receipts, statements, payouts, refunds, and ownership history

## 6. Wallet Top-up and Withdrawal

- Route: `src/routes/_authenticated/wallet.tsx`
- Tables:
  - `public.investor_wallets`
  - `public.wallet_transactions`
  - `public.wallet_deposit_requests`
  - `public.wallet_withdrawal_requests`

Purpose:
- separates wallet funding from direct opportunity checkout
- gives operations a request queue and users a cash-management view

## 7. Entity Document Upload UX

- Founder workspace: `src/routes/_authenticated/my-business.tsx`
- Table: `public.business_entity_documents`

Purpose:
- prepares KYB collection for CAC docs, TIN, board approvals, shareholder records, and UBO evidence

## 8. Offering Governance and Investor Communications

- Offering room route: `src/routes/_authenticated/offerings/$opportunityId.tsx`
- Tables:
  - `public.opportunity_updates`
  - `public.offering_documents`
  - `public.opportunity_round_events`

Purpose:
- keeps investment-specific communication separate from general community content

## 9. Admin Audit Trail

- Table: `public.admin_audit_events`
- Admin route: `src/routes/_authenticated/admin.tsx`

Purpose:
- captures review decisions, reconciliation actions, notes, and suspicious flags

## 10. Legal Round State Machine

- Enum: `public.round_state`
- Updated table: `public.opportunities`
- History table: `public.opportunity_round_events`

Supported round states:
- `draft`
- `live`
- `soft_committed`
- `funded`
- `escrowed`
- `closed`
- `released`
- `refunded`

Purpose:
- makes offering and support workflows explicit
- improves lifecycle reporting and investor communication

## Main Migration Files

- `supabase/migrations/20260618153000_investment_checkout.sql`
- `supabase/migrations/20260618184500_platform_governance_foundations.sql`

## Notes

- These foundations provide the platform structure and operator flows.
- Live external integrations such as payment processors, Sumsub, Youverify, notifications, storage-backed file upload, and document signing still need to be wired to production services.
