begin;

do $$
begin

drop table if exists demo_users;
create table demo_users as
select id, email
from auth.users
where email in (
  'admin@cofund.test',
  'founder1@cofund.test',
  'founder2@cofund.test',
  'founder3@cofund.test',
  'investor1@cofund.test',
  'investor2@cofund.test',
  'investor3@cofund.test',
  'mentor1@cofund.test'
);

insert into public.profiles (id, full_name, username, bio, location, occupation, onboarded)
values
  ((select id from demo_users where email = 'admin@cofund.test'), 'CoFund Admin', 'cofund-admin', 'Platform administrator', 'Lagos, Nigeria', 'Operations', true),
  ((select id from demo_users where email = 'founder1@cofund.test'), 'Amara Okonkwo', 'amara-okonkwo', 'Founder building agritech infrastructure.', 'Lagos, Nigeria', 'Founder / CEO', true),
  ((select id from demo_users where email = 'founder2@cofund.test'), 'Kemi Adebayo', 'kemi-adebayo', 'Founder building healthtech for SMEs.', 'Abuja, Nigeria', 'Founder / COO', true),
  ((select id from demo_users where email = 'founder3@cofund.test'), 'Nana Mensah', 'nana-mensah', 'Startup builder focused on logistics and climate.', 'Accra, Ghana', 'Founder / Product', true),
  ((select id from demo_users where email = 'investor1@cofund.test'), 'David Mensah', 'david-mensah', 'Angel investor focused on African growth businesses.', 'Accra, Ghana', 'Angel Investor', true),
  ((select id from demo_users where email = 'investor2@cofund.test'), 'Zainab Bello', 'zainab-bello', 'Investor with a portfolio across fintech and commerce.', 'Abuja, Nigeria', 'Investor', true),
  ((select id from demo_users where email = 'investor3@cofund.test'), 'Sade Akin', 'sade-akin', 'Diaspora investor backing high-trust SMEs.', 'London, UK', 'Investor', true),
  ((select id from demo_users where email = 'mentor1@cofund.test'), 'Ngozi Eze', 'ngozi-eze', 'Operator and advisor across fintech and SME growth.', 'Abuja, Nigeria', 'Advisor', true)
on conflict (id) do update
set full_name = excluded.full_name,
    username = excluded.username,
    bio = excluded.bio,
    location = excluded.location,
    occupation = excluded.occupation,
    onboarded = excluded.onboarded;

insert into public.user_roles (user_id, role)
values
  ((select id from demo_users where email = 'admin@cofund.test'), 'admin'),
  ((select id from demo_users where email = 'founder1@cofund.test'), 'business_owner'),
  ((select id from demo_users where email = 'founder1@cofund.test'), 'community_member'),
  ((select id from demo_users where email = 'founder2@cofund.test'), 'business_owner'),
  ((select id from demo_users where email = 'founder2@cofund.test'), 'community_member'),
  ((select id from demo_users where email = 'founder3@cofund.test'), 'startup_builder'),
  ((select id from demo_users where email = 'founder3@cofund.test'), 'community_member'),
  ((select id from demo_users where email = 'investor1@cofund.test'), 'investor'),
  ((select id from demo_users where email = 'investor1@cofund.test'), 'community_member'),
  ((select id from demo_users where email = 'investor2@cofund.test'), 'investor'),
  ((select id from demo_users where email = 'investor2@cofund.test'), 'community_member'),
  ((select id from demo_users where email = 'investor3@cofund.test'), 'investor'),
  ((select id from demo_users where email = 'investor3@cofund.test'), 'community_member'),
  ((select id from demo_users where email = 'mentor1@cofund.test'), 'investor'),
  ((select id from demo_users where email = 'mentor1@cofund.test'), 'professional'),
  ((select id from demo_users where email = 'mentor1@cofund.test'), 'community_member')
on conflict (user_id, role) do nothing;

insert into public.businesses (
  id, owner_id, name, slug, industry, location, tagline,
  description, founded_year, trust_score, verified, followers_count,
  featured, spotlight, revenue_growth_pct
)
values
  (
    gen_random_uuid(),
    (select id from demo_users where email = 'founder1@cofund.test'),
    'AgroFlow',
    'agroflow',
    'Agritech',
    'Lagos, Nigeria',
    'Smarter supply chains for smallholder farmers',
    'AgroFlow helps food businesses source, finance, and trace inventory across fragmented African supply chains.',
    2023,
    84,
    true,
    1240,
    true,
    true,
    48.5
  ),
  (
    gen_random_uuid(),
    (select id from demo_users where email = 'founder2@cofund.test'),
    'MedEase',
    'medease',
    'Healthtech',
    'Abuja, Nigeria',
    'Healthcare operations for busy clinics',
    'MedEase helps clinics manage bookings, payments, and patient follow-up in one platform.',
    2022,
    79,
    true,
    860,
    true,
    false,
    31.2
  ),
  (
    gen_random_uuid(),
    (select id from demo_users where email = 'founder3@cofund.test'),
    'RouteLoop',
    'routeloop',
    'Logistics',
    'Accra, Ghana',
    'Last-mile logistics built for African commerce',
    'RouteLoop gives merchants visibility into delivery routes, driver performance, and customer updates.',
    2024,
    76,
    true,
    540,
    false,
    true,
    26.7
  )
on conflict (slug) do update
set owner_id = excluded.owner_id,
    name = excluded.name,
    industry = excluded.industry,
    location = excluded.location,
    tagline = excluded.tagline,
    description = excluded.description,
    founded_year = excluded.founded_year,
    trust_score = excluded.trust_score,
    verified = excluded.verified,
    followers_count = excluded.followers_count,
    featured = excluded.featured,
    spotlight = excluded.spotlight,
    revenue_growth_pct = excluded.revenue_growth_pct;

drop table if exists demo_businesses;
create table demo_businesses as
select id, slug, owner_id
from public.businesses
where slug in ('agroflow','medease','routeloop');

insert into public.opportunities (
  id, business_id, title, summary, goal_amount, raised_amount,
  target_return_pct, status, featured, closes_at,
  round_state, minimum_investment, risk_level, instrument_type, duration_days,
  published_at, closed_at, legal_terms_url
)
select
  gen_random_uuid(),
  b.id,
  case b.slug
    when 'agroflow' then 'AgroFlow Seed Round'
    when 'medease' then 'MedEase Growth Round'
    else 'RouteLoop Expansion Round'
  end,
  case b.slug
    when 'agroflow' then 'Scaling logistics, payments, and farmer financing.'
    when 'medease' then 'Expanding into more clinics and patient workflows.'
    else 'Launching new corridors and merchant tools.'
  end,
  case b.slug
    when 'agroflow' then 2500000
    when 'medease' then 1800000
    else 1500000
  end,
  case b.slug
    when 'agroflow' then 850000
    when 'medease' then 620000
    else 430000
  end,
  case b.slug
    when 'agroflow' then 18
    when 'medease' then 16
    else 15
  end,
  'open',
  true,
  now() + interval '21 days',
  'live',
  50000,
  case b.slug when 'routeloop' then 'high' else 'medium' end,
  'equity',
  180,
  now() - interval '14 days',
  null,
  'https://example.com/legal/' || b.slug
from demo_businesses b
on conflict do nothing;

drop table if exists demo_opportunities;
create table demo_opportunities as
select o.id, o.business_id, b.slug, b.owner_id
from public.opportunities o
join public.businesses b on b.id = o.business_id
where b.slug in ('agroflow','medease','routeloop');

insert into public.posts (id, author_id, business_id, content, category, created_at)
values
  (gen_random_uuid(), (select id from demo_users where email = 'founder1@cofund.test'), (select id from public.businesses where slug = 'agroflow' limit 1), 'We just onboarded 120 new farms this month and are expanding into northern supply corridors.', 'company_update', now() - interval '2 days'),
  (gen_random_uuid(), (select id from demo_users where email = 'investor1@cofund.test'), null, 'Excited to back businesses solving real infrastructure gaps across Africa.', 'investing', now() - interval '1 day'),
  (gen_random_uuid(), (select id from demo_users where email = 'mentor1@cofund.test'), null, 'Mentorship works best when founders are active, accountable, and building with discipline.', 'mentorship', now() - interval '6 hours');

insert into public.partners (id, name, logo_url, url, display_order, active)
values
  (gen_random_uuid(), 'Bridge Bank', null, 'https://example.com', 1, true),
  (gen_random_uuid(), 'KYC Connect', null, 'https://example.com', 2, true),
  (gen_random_uuid(), 'Capital Trust', null, 'https://example.com', 3, true);

insert into public.site_stats (key, label, value, display_order, visible)
values
  ('businesses_funded', 'Businesses funded', '128', 1, true),
  ('capital_raised', 'Capital raised', '₦1.8B', 2, true),
  ('verified_investors', 'Verified investors', '4,250', 3, true),
  ('active_communities', 'Active communities', '96', 4, true)
on conflict (key) do update
set label = excluded.label,
    value = excluded.value,
    display_order = excluded.display_order,
    visible = excluded.visible;

insert into public.learning_articles (
  id, title, slug, excerpt, body, cover_url, category, published, created_at
)
values
  (gen_random_uuid(), 'How CoFund verification works', 'how-cofund-verification-works', 'Understand KYC, KYB, and investor suitability on CoFund.', 'This is a demo article explaining onboarding, verification, and investment safety.', null, 'Compliance', true, now() - interval '10 days'),
  (gen_random_uuid(), 'What founders should prepare before raising', 'what-founders-should-prepare-before-raising', 'Documents and metrics that help a round move faster.', 'This is a demo article for founders preparing for a raise.', null, 'Fundraising', true, now() - interval '7 days'),
  (gen_random_uuid(), 'How investors assess risk on CoFund', 'how-investors-assess-risk-on-cofund', 'Risk, time horizon, and portfolio construction in private markets.', 'This is a demo article for investors using CoFund.', null, 'Investing', true, now() - interval '4 days')
on conflict (slug) do update
set title = excluded.title,
    excerpt = excluded.excerpt,
    body = excluded.body,
    cover_url = excluded.cover_url,
    category = excluded.category,
    published = excluded.published;

insert into public.business_entities (
  id, owner_user_id, business_id, legal_name, trading_name,
  registration_number, tax_id, country, incorporation_date, entity_type,
  registered_address, operating_address, verification_status, trust_score, metadata
)
select
  gen_random_uuid(),
  biz.owner_id,
  biz.id,
  case biz.slug
    when 'agroflow' then 'AgroFlow Limited'
    when 'medease' then 'MedEase Health Limited'
    else 'RouteLoop Logistics Limited'
  end,
  biz.name,
  case biz.slug
    when 'agroflow' then 'RC-AGF-2023-001'
    when 'medease' then 'RC-MED-2022-014'
    else 'RC-RL-2024-009'
  end,
  case biz.slug
    when 'agroflow' then 'TIN-99887766'
    when 'medease' then 'TIN-55443322'
    else 'TIN-11224455'
  end,
  case biz.slug when 'routeloop' then 'Ghana' else 'Nigeria' end,
  case biz.slug
    when 'agroflow' then date '2023-05-18'
    when 'medease' then date '2022-08-09'
    else date '2024-02-14'
  end,
  'Private limited company',
  case biz.slug
    when 'agroflow' then '12 Admiralty Way, Lekki, Lagos, Nigeria'
    when 'medease' then '4 Tafawa Balewa Crescent, Abuja, Nigeria'
    else '18 Ring Road Central, Accra, Ghana'
  end,
  case biz.slug
    when 'agroflow' then '12 Admiralty Way, Lekki, Lagos, Nigeria'
    when 'medease' then '4 Tafawa Balewa Crescent, Abuja, Nigeria'
    else '18 Ring Road Central, Accra, Ghana'
  end,
  'approved',
  case biz.slug when 'agroflow' then 88 when 'medease' then 84 else 80 end,
  jsonb_build_object('source', 'seed_script')
from public.businesses biz
where biz.slug in ('agroflow','medease','routeloop')
on conflict do nothing;

drop table if exists demo_business_entities;
create table demo_business_entities as
select be.id, be.business_id, biz.slug, be.owner_user_id
from public.business_entities be
join public.businesses biz on biz.id = be.business_id
where biz.slug in ('agroflow','medease','routeloop');

insert into public.ubo_records (
  id, business_entity_id, user_id, full_name, role_title, ownership_percent,
  date_of_birth, nationality, email, phone, residential_address, verification_status
)
select
  gen_random_uuid(),
  be.id,
  be.owner_user_id,
  case be.slug
    when 'agroflow' then 'Amara Okonkwo'
    when 'medease' then 'Kemi Adebayo'
    else 'Nana Mensah'
  end,
  case be.slug
    when 'agroflow' then 'Founder / Director'
    when 'medease' then 'Founder / COO'
    else 'Founder / Product Lead'
  end,
  case be.slug when 'agroflow' then 62.50 when 'medease' then 55.00 else 48.00 end,
  case be.slug
    when 'agroflow' then date '1990-04-21'
    when 'medease' then date '1989-11-03'
    else date '1992-07-15'
  end,
  case be.slug when 'routeloop' then 'Ghana' else 'Nigeria' end,
  case be.slug
    when 'agroflow' then 'founder1@cofund.test'
    when 'medease' then 'founder2@cofund.test'
    else 'founder3@cofund.test'
  end,
  case be.slug
    when 'agroflow' then '+2348000000000'
    when 'medease' then '+2348011111111'
    else '+233240000000'
  end,
  case be.slug
    when 'agroflow' then '12 Admiralty Way, Lekki, Lagos, Nigeria'
    when 'medease' then '4 Tafawa Balewa Crescent, Abuja, Nigeria'
    else '18 Ring Road Central, Accra, Ghana'
  end,
  'approved'
from demo_business_entities be
on conflict do nothing;

drop table if exists demo_ubo_records;
create table demo_ubo_records as
select ub.id, ub.business_entity_id
from public.ubo_records ub
join public.business_entities be on be.id = ub.business_entity_id
join public.businesses biz on biz.id = be.business_id
where biz.slug in ('agroflow','medease','routeloop');

insert into public.verification_sessions (
  id, user_id, business_entity_id, ubo_record_id, provider,
  subject_type, status, provider_session_id, provider_applicant_id,
  review_url, request_payload, response_payload, last_webhook_at
)
select
  gen_random_uuid(),
  be.owner_user_id,
  be.id,
  ub.id,
  'youverify',
  'business_entity',
  'approved',
  'yv-business-' || be.slug,
  'yv-app-' || be.slug,
  'https://example.com/review/' || be.slug,
  jsonb_build_object('type', 'kyb', 'business', be.slug),
  jsonb_build_object('status', 'approved'),
  now() - interval '1 day'
from demo_business_entities be
left join demo_ubo_records ub on ub.business_entity_id = be.id
on conflict (provider, provider_session_id) do nothing;

insert into public.investor_wallets (
  user_id, currency, ledger_balance, available_balance, status, metadata
)
values
  ((select id from demo_users where email = 'investor1@cofund.test'), 'NGN', 1500000, 1250000, 'active', '{"tier":"angel"}'::jsonb),
  ((select id from demo_users where email = 'investor2@cofund.test'), 'NGN', 3200000, 3000000, 'active', '{"tier":"growth"}'::jsonb),
  ((select id from demo_users where email = 'investor3@cofund.test'), 'NGN', 5500000, 5100000, 'active', '{"tier":"diaspora"}'::jsonb)
on conflict (user_id) do update
set currency = excluded.currency,
    ledger_balance = excluded.ledger_balance,
    available_balance = excluded.available_balance,
    status = excluded.status,
    metadata = excluded.metadata;

insert into public.investor_suitability_assessments (
  id, user_id, jurisdiction, experience_level, annual_income_range, net_worth_range,
  loss_capacity, liquidity_needs, investment_horizon, risk_tolerance,
  answers, score, outcome, reviewed_by, reviewed_at, notes, created_at
)
values
  (gen_random_uuid(), (select id from demo_users where email = 'investor1@cofund.test'), 'Nigeria', 'experienced', '₦20M - ₦50M', '₦50M - ₦100M', 'high', 'low', 'long_term', 'balanced', '{"sector_focus":["agritech","fintech"],"portfolio_style":"angel"}'::jsonb, 82, 'passed', (select id from demo_users where email = 'admin@cofund.test'), now() - interval '3 days', 'Seasoned angel investor.', now() - interval '3 days'),
  (gen_random_uuid(), (select id from demo_users where email = 'investor2@cofund.test'), 'Nigeria', 'experienced', '₦10M - ₦20M', '₦20M - ₦50M', 'medium', 'medium', 'long_term', 'moderate', '{"sector_focus":["healthtech","commerce"],"portfolio_style":"growth"}'::jsonb, 76, 'passed', (select id from demo_users where email = 'admin@cofund.test'), now() - interval '4 days', 'Experienced investor with multiple active commitments.', now() - interval '4 days'),
  (gen_random_uuid(), (select id from demo_users where email = 'investor3@cofund.test'), 'United Kingdom', 'advanced', '£50k - £100k', '£100k+', 'high', 'low', 'long_term', 'moderate', '{"sector_focus":["logistics","climate"],"portfolio_style":"diaspora"}'::jsonb, 79, 'passed', (select id from demo_users where email = 'admin@cofund.test'), now() - interval '5 days', 'Diaspora investor with strong private market exposure.', now() - interval '5 days');

insert into public.investment_commitments (
  id, user_id, business_id, opportunity_id, business_entity_id, investing_as,
  amount, currency, rail, status, instrument_label, escrow_reference,
  disclosures_accepted, risk_acknowledged, metadata
)
select
  gen_random_uuid(),
  du.id,
  b.id,
  o.id,
  be.id,
  'individual',
  case du.email
    when 'investor1@cofund.test' then 250000
    when 'investor2@cofund.test' then 500000
    else 1000000
  end,
  'NGN',
  case du.email
    when 'investor1@cofund.test' then 'bank_transfer'::public.funding_rail
    when 'investor2@cofund.test' then 'wallet_balance'::public.funding_rail
    else 'wire'::public.funding_rail
  end,
  case du.email
    when 'investor1@cofund.test' then 'pending_payment'::public.commitment_status
    when 'investor2@cofund.test' then 'in_escrow'::public.commitment_status
    else 'pending_payment'::public.commitment_status
  end,
  'Ordinary shares',
  case du.email
    when 'investor1@cofund.test' then 'CFD-AGF-0001'
    when 'investor2@cofund.test' then 'CFD-MED-0002'
    else 'CFD-RL-0003'
  end,
  true,
  true,
  jsonb_build_object('source', 'seed_script')
from demo_users du
join demo_businesses b on (
  (du.email = 'investor1@cofund.test' and b.slug = 'agroflow') or
  (du.email = 'investor2@cofund.test' and b.slug = 'medease') or
  (du.email = 'investor3@cofund.test' and b.slug = 'routeloop')
)
join demo_opportunities o on o.business_id = b.id
left join demo_business_entities be on be.business_id = b.id
where du.email in ('investor1@cofund.test','investor2@cofund.test','investor3@cofund.test')
on conflict do nothing;

drop table if exists demo_commitments;
create table demo_commitments as
select id, user_id, opportunity_id, rail, status, escrow_reference, amount
from public.investment_commitments
where escrow_reference in ('CFD-AGF-0001','CFD-MED-0002','CFD-RL-0003');

insert into public.funding_instructions (
  commitment_id, rail, status, reference_code, account_name, bank_name,
  account_number, bank_country, beneficiary_name, beneficiary_address,
  swift_code, iban, wallet_hold_amount, expires_at, metadata
)
select
  dc.id,
  dc.rail,
  case dc.rail when 'wallet_balance' then 'settled' when 'wire' then 'awaiting_wire' else 'awaiting_transfer' end,
  dc.escrow_reference,
  'CoFund Escrow Collections',
  case dc.rail when 'wire' then 'Global Settlement Bank' else 'Settlement Partner Bank' end,
  case dc.rail when 'wire' then 'GB29NWBK60161331926819' else '1029384756' end,
  case when dc.rail = 'wire' then 'United Kingdom' else 'Nigeria' end,
  case when dc.rail = 'wire' then 'CoFund Escrow SPV' else null end,
  case when dc.rail = 'wire' then '27 Marina, Lagos, Nigeria' else null end,
  case when dc.rail = 'wire' then 'GSBKGB2L' else null end,
  case when dc.rail = 'wire' then 'GB29NWBK60161331926819' else null end,
  case when dc.rail = 'wallet_balance' then dc.amount else null end,
  now() + interval '72 hours',
  jsonb_build_object('headline', 'Demo funding instructions')
from demo_commitments dc
on conflict do nothing;

insert into public.wallet_transactions (
  wallet_id, user_id, commitment_id, transaction_type, amount, status, reference_code, metadata
)
select
  w.id,
  w.user_id,
  dc.id,
  case when dc.rail = 'wallet_balance' then 'hold'::public.wallet_transaction_type else 'deposit'::public.wallet_transaction_type end,
  dc.amount,
  'posted',
  dc.escrow_reference,
  jsonb_build_object('action', 'demo_seed')
from public.investor_wallets w
join demo_commitments dc on dc.user_id = w.user_id
on conflict do nothing;

insert into public.escrow_events (commitment_id, event_type, amount, note, metadata)
select
  dc.id,
  case when dc.status = 'in_escrow' then 'held_in_escrow'::public.escrow_event_type else 'funding_requested'::public.escrow_event_type end,
  dc.amount,
  'Seeded demo commitment',
  jsonb_build_object('reference_code', dc.escrow_reference)
from demo_commitments dc
on conflict do nothing;

insert into public.payment_reconciliation_events (
  id, commitment_id, funding_instruction_id, actor_user_id, status, amount,
  external_reference, note, metadata
)
select
  gen_random_uuid(),
  dc.id,
  fi.id,
  (select id from demo_users where email = 'admin@cofund.test'),
  case dc.rail when 'wallet_balance' then 'matched'::public.reconciliation_status else 'received'::public.reconciliation_status end,
  dc.amount,
  dc.escrow_reference,
  'Demo payment matched against commitment.',
  jsonb_build_object('source', 'seed_script')
from demo_commitments dc
left join public.funding_instructions fi on fi.commitment_id = dc.id
on conflict do nothing;

insert into public.opportunity_round_events (
  id, opportunity_id, actor_user_id, round_state, note, metadata, created_at
)
select
  gen_random_uuid(),
  o.id,
  (select id from demo_users where email = 'admin@cofund.test'),
  case b.slug when 'agroflow' then 'live'::public.round_state when 'medease' then 'soft_committed'::public.round_state else 'funded'::public.round_state end,
  case b.slug when 'agroflow' then 'Round opened for funding.' when 'medease' then 'Soft commitments collected.' else 'Round fully funded.' end,
  jsonb_build_object('source', 'seed_script'),
  now() - interval '14 days'
from demo_opportunities o
join demo_businesses b on b.id = o.business_id
on conflict do nothing;

insert into public.opportunity_updates (
  id, opportunity_id, author_user_id, title, body, visibility, status, created_at
)
select
  gen_random_uuid(),
  o.id,
  b.owner_id,
  case b.slug when 'agroflow' then 'Monthly progress update' when 'medease' then 'Clinic rollout update' else 'Corridor expansion update' end,
  case b.slug when 'agroflow' then 'We signed new enterprise buyers and expanded collection regions.' when 'medease' then 'We onboarded more clinics and improved patient follow-up.' else 'We launched new delivery corridors and merchant tools.' end,
  'investors',
  'published',
  now() - interval '1 day'
from demo_opportunities o
join demo_businesses b on b.id = o.business_id
on conflict do nothing;

insert into public.offering_documents (
  id, scope, opportunity_id, business_entity_id, commitment_id, uploader_user_id,
  title, document_type, file_url, description, visibility, status,
  version_label, metadata, created_at
)
select
  gen_random_uuid(),
  'opportunity',
  o.id,
  null,
  null,
  b.owner_id,
  case b.slug when 'agroflow' then 'AgroFlow Term Sheet' when 'medease' then 'MedEase Investor Deck' else 'RouteLoop Data Room Index' end,
  'term_sheet',
  '/demo/offering/' || b.slug || '/term-sheet.pdf',
  'Demo offering document',
  'investors',
  'approved',
  'v1',
  jsonb_build_object('source', 'seed_script'),
  now() - interval '2 days'
from demo_opportunities o
join demo_businesses b on b.id = o.business_id
on conflict do nothing;

insert into public.business_entity_documents (
  id, business_entity_id, uploader_user_id, title, document_type,
  file_url, status, description, metadata, created_at
)
select
  gen_random_uuid(),
  be.id,
  be.owner_user_id,
  case b.slug when 'agroflow' then 'Certificate of Incorporation' when 'medease' then 'Tax Registration' else 'Board Resolution' end,
  case b.slug when 'agroflow' then 'incorporation_certificate' when 'medease' then 'tax_certificate' else 'board_resolution' end,
  '/demo/entity/' || b.slug || '/document.pdf',
  'approved',
  'Demo business document',
  jsonb_build_object('source', 'seed_script'),
  now() - interval '5 days'
from demo_business_entities be
join public.businesses b on b.id = be.business_id
on conflict do nothing;

insert into public.investor_statements (
  id, user_id, commitment_id, statement_type, title, file_url, metadata, created_at
)
select
  gen_random_uuid(),
  dc.user_id,
  dc.id,
  'investment_certificate',
  'Investment Statement',
  '/demo/statements/' || dc.user_id::text || '.pdf',
  jsonb_build_object('source', 'seed_script'),
  now() - interval '1 day'
from demo_commitments dc
on conflict do nothing;

insert into public.mentor_applications (
  id, user_id, applicant_name, applicant_email, mentor_focus, status,
  platform_joined_at, last_active_at, investment_count, total_invested_amount,
  experience_summary, qualification_summary, application_note,
  proof_storage_bucket, proof_storage_path, proof_original_filename,
  proof_mime_type, proof_file_size, reviewer_note, reviewed_by,
  reviewed_at, created_at, updated_at
)
values (
  gen_random_uuid(),
  (select id from demo_users where email = 'mentor1@cofund.test'),
  'Ngozi Eze',
  'mentor1@cofund.test',
  'Fintech, fundraising, and SME growth',
  'approved',
  now() - interval '210 days',
  now() - interval '2 days',
  8,
  4250000,
  'Built and scaled products in payments and SME finance for over a decade.',
  'MBA, CPA, former fintech operator, and active angel investor.',
  'Happy to support founders building in regulated markets.',
  'mentor-application-documents',
  (select id from demo_users where email = 'mentor1@cofund.test')::text || '/proof.pdf',
  'proof.pdf',
  'application/pdf',
  120000,
  'Strong mentor profile approved.',
  (select id from demo_users where email = 'admin@cofund.test'),
  now() - interval '1 day',
  now() - interval '2 days',
  now() - interval '1 day'
)
on conflict (user_id) do update
set mentor_focus = excluded.mentor_focus,
    status = excluded.status,
    platform_joined_at = excluded.platform_joined_at,
    last_active_at = excluded.last_active_at,
    investment_count = excluded.investment_count,
    total_invested_amount = excluded.total_invested_amount,
    experience_summary = excluded.experience_summary,
    qualification_summary = excluded.qualification_summary,
    application_note = excluded.application_note,
    proof_storage_bucket = excluded.proof_storage_bucket,
    proof_storage_path = excluded.proof_storage_path,
    proof_original_filename = excluded.proof_original_filename,
    proof_mime_type = excluded.proof_mime_type,
    proof_file_size = excluded.proof_file_size,
    reviewer_note = excluded.reviewer_note,
    reviewed_by = excluded.reviewed_by,
    reviewed_at = excluded.reviewed_at;

insert into public.wallet_deposit_requests (
  id, wallet_id, user_id, amount, rail, status, reference_code, note, metadata, created_at
)
values
  (
    gen_random_uuid(),
    (select id from public.investor_wallets where user_id = (select id from demo_users where email = 'investor1@cofund.test') limit 1),
    (select id from demo_users where email = 'investor1@cofund.test'),
    500000,
    'bank_transfer',
    'completed',
    'DEP-DEMO-0001',
    'Demo bank deposit completed',
    '{"source":"seed_script"}'::jsonb,
    now() - interval '4 days'
  ),
  (
    gen_random_uuid(),
    (select id from public.investor_wallets where user_id = (select id from demo_users where email = 'investor2@cofund.test') limit 1),
    (select id from demo_users where email = 'investor2@cofund.test'),
    750000,
    'bank_transfer',
    'completed',
    'DEP-DEMO-0002',
    'Demo bank deposit completed',
    '{"source":"seed_script"}'::jsonb,
    now() - interval '4 days'
  );

insert into public.wallet_withdrawal_requests (
  id, wallet_id, user_id, amount, destination_label, destination_details,
  status, note, metadata, created_at
)
values
  (
    gen_random_uuid(),
    (select id from public.investor_wallets where user_id = (select id from demo_users where email = 'investor1@cofund.test') limit 1),
    (select id from demo_users where email = 'investor1@cofund.test'),
    100000,
    'Bank account',
    '{"bank":"Demo Bank","account_last4":"1234"}'::jsonb,
    'pending',
    'Demo withdrawal request',
    '{"source":"seed_script"}'::jsonb,
    now() - interval '2 days'
  );

insert into public.payout_events (
  id, commitment_id, user_id, amount, event_type, status, note, metadata, created_at
)
select
  gen_random_uuid(),
  dc.id,
  dc.user_id,
  18000,
  'distribution',
  'completed',
  'Demo payout completed.',
  '{"source":"seed_script"}'::jsonb,
  now() - interval '7 days'
from demo_commitments dc
where dc.user_id = (select id from demo_users where email = 'investor1@cofund.test')
on conflict do nothing;

insert into public.refund_events (
  id, commitment_id, user_id, amount, status, note, metadata, created_at
)
select
  gen_random_uuid(),
  dc.id,
  dc.user_id,
  5000,
  'completed',
  'Demo refund record.',
  '{"source":"seed_script"}'::jsonb,
  now() - interval '9 days'
from demo_commitments dc
where dc.user_id = (select id from demo_users where email = 'investor2@cofund.test')
on conflict do nothing;

insert into public.admin_audit_events (
  id, actor_user_id, target_table, target_id, action, severity, note,
  suspicious, metadata, created_at
)
values
  (
    gen_random_uuid(),
    (select id from demo_users where email = 'admin@cofund.test'),
    'business_entities',
    (select id from public.business_entities limit 1),
    'verified_business_entity',
    'info',
    'Approved business entity and UBO record.',
    false,
    '{"source":"seed_script"}'::jsonb,
    now() - interval '5 days'
  ),
  (
    gen_random_uuid(),
    (select id from demo_users where email = 'admin@cofund.test'),
    'mentor_applications',
    (select id from public.mentor_applications limit 1),
    'approved_mentor_application',
    'info',
    'Approved mentor application after review.',
    false,
    '{"source":"seed_script"}'::jsonb,
    now() - interval '1 day'
  );

insert into public.security_events (
  id, user_id, event_type, status, note, metadata, created_at
)
values
  (
    gen_random_uuid(),
    (select id from demo_users where email = 'investor1@cofund.test'),
    'mfa_enrollment_requested',
    'completed',
    'User opened MFA enrollment flow from the security center.',
    '{"source":"seed_script"}'::jsonb,
    now() - interval '6 days'
  ),
  (
    gen_random_uuid(),
    (select id from demo_users where email = 'investor1@cofund.test'),
    'step_up_requested',
    'completed',
    'User requested a step-up challenge before a sensitive action.',
    '{"source":"seed_script"}'::jsonb,
    now() - interval '3 days'
  );

insert into public.user_notifications (
  id, user_id, category, title, body, action_label, action_href, metadata, read_at, created_at
)
values
  (
    gen_random_uuid(),
    (select id from demo_users where email = 'founder1@cofund.test'),
    'document_review',
    'Your incorporation document was approved',
    'The CoFund operations team reviewed and approved your uploaded document.',
    'View business room',
    '/my-business',
    '{"source":"seed_script"}'::jsonb,
    null,
    now() - interval '2 days'
  ),
  (
    gen_random_uuid(),
    (select id from demo_users where email = 'investor1@cofund.test'),
    'investment_statement',
    'Your investment statement is ready',
    'You can download your certificate and statement from your portfolio.',
    'Open portfolio',
    '/portfolio',
    '{"source":"seed_script"}'::jsonb,
    null,
    now() - interval '1 day'
  );

drop table if exists demo_commitments, demo_ubo_records, demo_business_entities, demo_opportunities, demo_businesses, demo_users cascade;

end $$;

commit;
