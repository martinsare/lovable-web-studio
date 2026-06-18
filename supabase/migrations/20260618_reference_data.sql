-- ─────────────────────────────────────────────────────────────────────────────
-- CoFund  |  reference_data — single table for all lookup / dropdown lists
-- Apply in Supabase → SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.reference_data (
  id          uuid    primary key default gen_random_uuid(),
  category    text    not null,
  value       text    not null,
  label       text    not null,
  metadata    jsonb   null,          -- e.g. {"emoji":"🌾","desc":"Low risk"}
  sort_order  int     not null default 0,
  is_active   boolean not null default true
);

create index if not exists reference_data_category_idx
  on public.reference_data (category, sort_order)
  where is_active = true;

create unique index if not exists reference_data_unique_idx
  on public.reference_data (category, value);

-- Publicly readable (it's just lookup data); only service-role can write
alter table public.reference_data enable row level security;

create policy "reference_data: anyone can read"
  on public.reference_data for select
  using (true);


-- ─────────────────────────────────────────────────────────────────────────────
-- SEED DATA
-- ─────────────────────────────────────────────────────────────────────────────

-- Helper: upsert so re-running the script is safe
create or replace function seed_ref(
  p_category text, p_value text, p_label text,
  p_sort int default 0, p_meta jsonb default null
) returns void language plpgsql as $$
begin
  insert into public.reference_data (category, value, label, sort_order, metadata)
  values (p_category, p_value, p_label, p_sort, p_meta)
  on conflict (category, value) do update
    set label = excluded.label,
        sort_order = excluded.sort_order,
        metadata = excluded.metadata;
end;
$$;


-- ── industries ────────────────────────────────────────────────────────────────
select seed_ref('industry', 'All',             'All',             0);
select seed_ref('industry', 'Agriculture',     'Agriculture',     1);
select seed_ref('industry', 'Technology',      'Technology',      2);
select seed_ref('industry', 'Hospitality',     'Hospitality',     3);
select seed_ref('industry', 'Healthcare',      'Healthcare',      4);
select seed_ref('industry', 'Manufacturing',   'Manufacturing',   5);
select seed_ref('industry', 'Retail',          'Retail',          6);
select seed_ref('industry', 'Energy',          'Energy',          7);
select seed_ref('industry', 'Real Estate',     'Real Estate',     8);
select seed_ref('industry', 'Fintech',         'Fintech',         9);
select seed_ref('industry', 'Education',       'Education',       10);
select seed_ref('industry', 'Logistics',       'Logistics',       11);
select seed_ref('industry', 'Media',           'Media',           12);
select seed_ref('industry', 'Mining',          'Mining',          13);


-- ── risk_level ───────────────────────────────────────────────────────────────
select seed_ref('risk_level', 'conservative', 'Conservative', 0, '{"desc":"Low risk, stable returns"}');
select seed_ref('risk_level', 'moderate',     'Moderate',     1, '{"desc":"Balanced risk and growth"}');
select seed_ref('risk_level', 'aggressive',   'Aggressive',   2, '{"desc":"High risk, high potential"}');


-- ── min_ticket ───────────────────────────────────────────────────────────────
select seed_ref('min_ticket', '₦25,000',      '₦25,000',      0);
select seed_ref('min_ticket', '₦50,000',      '₦50,000',      1);
select seed_ref('min_ticket', '₦100,000',     '₦100,000',     2);
select seed_ref('min_ticket', '₦250,000',     '₦250,000',     3);
select seed_ref('min_ticket', '₦500,000',     '₦500,000',     4);
select seed_ref('min_ticket', '₦1,000,000+',  '₦1,000,000+',  5);


-- ── community_category ───────────────────────────────────────────────────────
select seed_ref('community_category', 'discussion',   'Discussion',   0);
select seed_ref('community_category', 'startup',      'Startup',      1);
select seed_ref('community_category', 'agriculture',  'Agriculture',  2);
select seed_ref('community_category', 'technology',   'Technology',   3);
select seed_ref('community_category', 'healthcare',   'Healthcare',   4);
select seed_ref('community_category', 'fintech',      'Fintech',      5);
select seed_ref('community_category', 'real estate',  'Real Estate',  6);
select seed_ref('community_category', 'energy',       'Energy',       7);
select seed_ref('community_category', 'hospitality',  'Hospitality',  8);
select seed_ref('community_category', 'manufacturing','Manufacturing',9);
select seed_ref('community_category', 'retail',       'Retail',       10);
select seed_ref('community_category', 'education',    'Education',    11);
select seed_ref('community_category', 'logistics',    'Logistics',    12);


-- ── community_circle ─────────────────────────────────────────────────────────
select seed_ref('community_circle', 'agriculture',  'Agriculture',  0,  '{"emoji":"🌾","cat":"agriculture"}');
select seed_ref('community_circle', 'technology',   'Technology',   1,  '{"emoji":"💻","cat":"technology"}');
select seed_ref('community_circle', 'healthcare',   'Healthcare',   2,  '{"emoji":"🏥","cat":"healthcare"}');
select seed_ref('community_circle', 'fintech',      'Fintech',      3,  '{"emoji":"💳","cat":"fintech"}');
select seed_ref('community_circle', 'real_estate',  'Real Estate',  4,  '{"emoji":"🏘️","cat":"real estate"}');
select seed_ref('community_circle', 'energy',       'Energy',       5,  '{"emoji":"⚡","cat":"energy"}');
select seed_ref('community_circle', 'hospitality',  'Hospitality',  6,  '{"emoji":"🏨","cat":"hospitality"}');
select seed_ref('community_circle', 'manufacturing','Manufacturing',7,  '{"emoji":"🏭","cat":"manufacturing"}');
select seed_ref('community_circle', 'retail',       'Retail',       8,  '{"emoji":"🛍️","cat":"retail"}');
select seed_ref('community_circle', 'education',    'Education',    9,  '{"emoji":"📚","cat":"education"}');
select seed_ref('community_circle', 'startup',      'Startup',      10, '{"emoji":"🚀","cat":"startup"}');
select seed_ref('community_circle', 'logistics',    'Logistics',    11, '{"emoji":"🚚","cat":"logistics"}');


-- ── nigerian_bank ─────────────────────────────────────────────────────────────
select seed_ref('nigerian_bank', 'Access Bank',         'Access Bank',         0);
select seed_ref('nigerian_bank', 'Citibank Nigeria',    'Citibank Nigeria',    1);
select seed_ref('nigerian_bank', 'Ecobank Nigeria',     'Ecobank Nigeria',     2);
select seed_ref('nigerian_bank', 'Fidelity Bank',       'Fidelity Bank',       3);
select seed_ref('nigerian_bank', 'First Bank of Nigeria','First Bank of Nigeria',4);
select seed_ref('nigerian_bank', 'FCMB',                'FCMB',                5);
select seed_ref('nigerian_bank', 'GTBank',              'GTBank',              6);
select seed_ref('nigerian_bank', 'Heritage Bank',       'Heritage Bank',       7);
select seed_ref('nigerian_bank', 'Keystone Bank',       'Keystone Bank',       8);
select seed_ref('nigerian_bank', 'Kuda Bank',           'Kuda Bank',           9);
select seed_ref('nigerian_bank', 'Moniepoint',          'Moniepoint',          10);
select seed_ref('nigerian_bank', 'OPay',                'OPay',                11);
select seed_ref('nigerian_bank', 'PalmPay',             'PalmPay',             12);
select seed_ref('nigerian_bank', 'Polaris Bank',        'Polaris Bank',        13);
select seed_ref('nigerian_bank', 'Providus Bank',       'Providus Bank',       14);
select seed_ref('nigerian_bank', 'Stanbic IBTC',        'Stanbic IBTC',        15);
select seed_ref('nigerian_bank', 'Standard Chartered',  'Standard Chartered',  16);
select seed_ref('nigerian_bank', 'Sterling Bank',       'Sterling Bank',       17);
select seed_ref('nigerian_bank', 'UBA',                 'UBA',                 18);
select seed_ref('nigerian_bank', 'Union Bank',          'Union Bank',          19);
select seed_ref('nigerian_bank', 'Unity Bank',          'Unity Bank',          20);
select seed_ref('nigerian_bank', 'VFD Microfinance',    'VFD Microfinance',    21);
select seed_ref('nigerian_bank', 'Wema Bank',           'Wema Bank',           22);
select seed_ref('nigerian_bank', 'Zenith Bank',         'Zenith Bank',         23);


-- ── wallet_quick_amount ───────────────────────────────────────────────────────
select seed_ref('wallet_quick_amount', '25000',    '₦25,000',    0);
select seed_ref('wallet_quick_amount', '50000',    '₦50,000',    1);
select seed_ref('wallet_quick_amount', '100000',   '₦100,000',   2);
select seed_ref('wallet_quick_amount', '250000',   '₦250,000',   3);
select seed_ref('wallet_quick_amount', '500000',   '₦500,000',   4);
select seed_ref('wallet_quick_amount', '1000000',  '₦1,000,000', 5);


-- ── sector (onboarding) ───────────────────────────────────────────────────────
select seed_ref('sector', 'Fintech & Payments',       'Fintech & Payments',       0);
select seed_ref('sector', 'Agritech & Food Systems',  'Agritech & Food Systems',  1);
select seed_ref('sector', 'Healthtech & Biotech',     'Healthtech & Biotech',     2);
select seed_ref('sector', 'Edtech & Skills',          'Edtech & Skills',          3);
select seed_ref('sector', 'Clean Energy & Climate',   'Clean Energy & Climate',   4);
select seed_ref('sector', 'Logistics & Transport',    'Logistics & Transport',    5);
select seed_ref('sector', 'E-commerce & Retail',      'E-commerce & Retail',      6);
select seed_ref('sector', 'Real Estate & Construction','Real Estate & Construction',7);
select seed_ref('sector', 'Media & Entertainment',    'Media & Entertainment',    8);
select seed_ref('sector', 'Manufacturing & Industry', 'Manufacturing & Industry', 9);
select seed_ref('sector', 'Mining & Resources',       'Mining & Resources',       10);
select seed_ref('sector', 'Fashion & Beauty',         'Fashion & Beauty',         11);
select seed_ref('sector', 'Travel & Hospitality',     'Travel & Hospitality',     12);
select seed_ref('sector', 'SaaS & Enterprise Tech',   'SaaS & Enterprise Tech',   13);
select seed_ref('sector', 'Telecom',                  'Telecom',                  14);
select seed_ref('sector', 'Government & Civic Tech',  'Government & Civic Tech',  15);
select seed_ref('sector', 'Security & Defence',       'Security & Defence',       16);
select seed_ref('sector', 'Other',                    'Other',                    17);


-- ── country (African) ─────────────────────────────────────────────────────────
select seed_ref('country_african', 'Nigeria','Nigeria',0);
select seed_ref('country_african', 'South Africa','South Africa',1);
select seed_ref('country_african', 'Kenya','Kenya',2);
select seed_ref('country_african', 'Ghana','Ghana',3);
select seed_ref('country_african', 'Ethiopia','Ethiopia',4);
select seed_ref('country_african', 'Tanzania','Tanzania',5);
select seed_ref('country_african', 'Uganda','Uganda',6);
select seed_ref('country_african', 'Rwanda','Rwanda',7);
select seed_ref('country_african', 'Senegal','Senegal',8);
select seed_ref('country_african', 'Ivory Coast','Ivory Coast',9);
select seed_ref('country_african', 'Cameroon','Cameroon',10);
select seed_ref('country_african', 'Angola','Angola',11);
select seed_ref('country_african', 'Mozambique','Mozambique',12);
select seed_ref('country_african', 'Zambia','Zambia',13);
select seed_ref('country_african', 'Zimbabwe','Zimbabwe',14);
select seed_ref('country_african', 'Botswana','Botswana',15);
select seed_ref('country_african', 'Namibia','Namibia',16);
select seed_ref('country_african', 'Mauritius','Mauritius',17);
select seed_ref('country_african', 'Morocco','Morocco',18);
select seed_ref('country_african', 'Egypt','Egypt',19);
select seed_ref('country_african', 'Tunisia','Tunisia',20);
select seed_ref('country_african', 'Algeria','Algeria',21);
select seed_ref('country_african', 'Libya','Libya',22);
select seed_ref('country_african', 'Sudan','Sudan',23);
select seed_ref('country_african', 'Somalia','Somalia',24);
select seed_ref('country_african', 'DRC','DRC',25);
select seed_ref('country_african', 'Gabon','Gabon',26);
select seed_ref('country_african', 'Congo','Congo',27);
select seed_ref('country_african', 'Mali','Mali',28);
select seed_ref('country_african', 'Burkina Faso','Burkina Faso',29);
select seed_ref('country_african', 'Niger','Niger',30);
select seed_ref('country_african', 'Chad','Chad',31);
select seed_ref('country_african', 'Sierra Leone','Sierra Leone',32);
select seed_ref('country_african', 'Liberia','Liberia',33);
select seed_ref('country_african', 'Guinea','Guinea',34);
select seed_ref('country_african', 'Benin','Benin',35);
select seed_ref('country_african', 'Togo','Togo',36);
select seed_ref('country_african', 'Malawi','Malawi',37);
select seed_ref('country_african', 'Lesotho','Lesotho',38);
select seed_ref('country_african', 'Eswatini','Eswatini',39);
select seed_ref('country_african', 'Eritrea','Eritrea',40);
select seed_ref('country_african', 'Djibouti','Djibouti',41);
select seed_ref('country_african', 'Comoros','Comoros',42);
select seed_ref('country_african', 'Cape Verde','Cape Verde',43);
select seed_ref('country_african', 'São Tomé and Príncipe','São Tomé and Príncipe',44);
select seed_ref('country_african', 'Equatorial Guinea','Equatorial Guinea',45);
select seed_ref('country_african', 'South Sudan','South Sudan',46);
select seed_ref('country_african', 'Madagascar','Madagascar',47);
select seed_ref('country_african', 'Seychelles','Seychelles',48);
select seed_ref('country_african', 'Gambia','Gambia',49);
select seed_ref('country_african', 'Guinea-Bissau','Guinea-Bissau',50);


-- ── country (diaspora) ────────────────────────────────────────────────────────
select seed_ref('country_diaspora', 'United Kingdom',     'United Kingdom',     0);
select seed_ref('country_diaspora', 'United States',      'United States',      1);
select seed_ref('country_diaspora', 'Canada',             'Canada',             2);
select seed_ref('country_diaspora', 'United Arab Emirates','United Arab Emirates',3);
select seed_ref('country_diaspora', 'France',             'France',             4);
select seed_ref('country_diaspora', 'Germany',            'Germany',            5);
select seed_ref('country_diaspora', 'Netherlands',        'Netherlands',        6);
select seed_ref('country_diaspora', 'Belgium',            'Belgium',            7);
select seed_ref('country_diaspora', 'Portugal',           'Portugal',           8);
select seed_ref('country_diaspora', 'Italy',              'Italy',              9);
select seed_ref('country_diaspora', 'Saudi Arabia',       'Saudi Arabia',       10);
select seed_ref('country_diaspora', 'Qatar',              'Qatar',              11);
select seed_ref('country_diaspora', 'Australia',          'Australia',          12);
select seed_ref('country_diaspora', 'Other',              'Other',              13);


-- ── capital_range ─────────────────────────────────────────────────────────────
select seed_ref('capital_range', 'Under $10,000',      'Under $10,000',      0);
select seed_ref('capital_range', '$10,000 - $50,000',  '$10,000 - $50,000',  1);
select seed_ref('capital_range', '$50,000 - $250,000', '$50,000 - $250,000', 2);
select seed_ref('capital_range', '$250,000 - $1M',     '$250,000 - $1M',     3);
select seed_ref('capital_range', '$1M - $5M',          '$1M - $5M',          4);
select seed_ref('capital_range', 'Over $5M',           'Over $5M',           5);


-- ── ticket_size (investor) ────────────────────────────────────────────────────
select seed_ref('ticket_size', 'Under $1,000',           'Under $1,000',           0);
select seed_ref('ticket_size', '$1,000 - $5,000',        '$1,000 - $5,000',        1);
select seed_ref('ticket_size', '$5,000 - $25,000',       '$5,000 - $25,000',       2);
select seed_ref('ticket_size', '$25,000 - $100,000',     '$25,000 - $100,000',     3);
select seed_ref('ticket_size', '$100,000 - $500,000',    '$100,000 - $500,000',    4);
select seed_ref('ticket_size', 'Over $500,000',          'Over $500,000',          5);


-- ── business_stage ────────────────────────────────────────────────────────────
select seed_ref('business_stage', 'Idea stage',          'Idea stage',          0);
select seed_ref('business_stage', 'Pre-revenue',         'Pre-revenue',         1);
select seed_ref('business_stage', 'Revenue-generating',  'Revenue-generating',  2);
select seed_ref('business_stage', 'Profitable',          'Profitable',          3);
select seed_ref('business_stage', 'Scaling',             'Scaling',             4);


-- ── revenue_range ─────────────────────────────────────────────────────────────
select seed_ref('revenue_range', 'Pre-revenue',                  'Pre-revenue',                  0);
select seed_ref('revenue_range', 'Under $10,000 / yr',           'Under $10,000 / yr',           1);
select seed_ref('revenue_range', '$10,000 - $100,000 / yr',      '$10,000 - $100,000 / yr',      2);
select seed_ref('revenue_range', '$100,000 - $500,000 / yr',     '$100,000 - $500,000 / yr',     3);
select seed_ref('revenue_range', '$500,000 - $2M / yr',          '$500,000 - $2M / yr',          4);
select seed_ref('revenue_range', '$2M - $10M / yr',              '$2M - $10M / yr',              5);
select seed_ref('revenue_range', 'Over $10M / yr',               'Over $10M / yr',               6);


-- ── team_size ─────────────────────────────────────────────────────────────────
select seed_ref('team_size', 'Just me',       'Just me',       0);
select seed_ref('team_size', '2-5 people',    '2-5 people',    1);
select seed_ref('team_size', '6-20 people',   '6-20 people',   2);
select seed_ref('team_size', '21-50 people',  '21-50 people',  3);
select seed_ref('team_size', '50+ people',    '50+ people',    4);


-- ── seeking_option ────────────────────────────────────────────────────────────
select seed_ref('seeking_option', 'Funding / Investment',        'Funding / Investment',        0);
select seed_ref('seeking_option', 'Mentorship & Advisory',       'Mentorship & Advisory',       1);
select seed_ref('seeking_option', 'Strategic Partnerships',      'Strategic Partnerships',      2);
select seed_ref('seeking_option', 'Customers & Distribution',    'Customers & Distribution',    3);
select seed_ref('seeking_option', 'Team Members',                'Team Members',                4);
select seed_ref('seeking_option', 'Technical Co-founder',        'Technical Co-founder',        5);


-- ── business_capital ──────────────────────────────────────────────────────────
select seed_ref('business_capital', 'Under $50,000',      'Under $50,000',      0);
select seed_ref('business_capital', '$50,000 - $250,000', '$50,000 - $250,000', 1);
select seed_ref('business_capital', '$250,000 - $1M',     '$250,000 - $1M',     2);
select seed_ref('business_capital', '$1M - $5M',          '$1M - $5M',          3);
select seed_ref('business_capital', '$5M - $20M',         '$5M - $20M',         4);
select seed_ref('business_capital', 'Over $20M',          'Over $20M',          5);


-- ── startup_stage ─────────────────────────────────────────────────────────────
select seed_ref('startup_stage', 'Idea / Concept',          'Idea / Concept',          0);
select seed_ref('startup_stage', 'Prototype / MVP built',   'Prototype / MVP built',   1);
select seed_ref('startup_stage', 'Beta / Early users',      'Beta / Early users',      2);
select seed_ref('startup_stage', 'Launched / Live product', 'Launched / Live product', 3);


-- ── cofound_status ────────────────────────────────────────────────────────────
select seed_ref('cofound_status', 'I have a team',             'I have a team',             0);
select seed_ref('cofound_status', 'Looking for co-founders',   'Looking for co-founders',   1);
select seed_ref('cofound_status', 'Going solo for now',        'Going solo for now',         2);


-- ── expertise_area ────────────────────────────────────────────────────────────
select seed_ref('expertise_area', 'Strategy & Leadership',   'Strategy & Leadership',   0);
select seed_ref('expertise_area', 'Finance & Fundraising',   'Finance & Fundraising',   1);
select seed_ref('expertise_area', 'Sales & Marketing',       'Sales & Marketing',       2);
select seed_ref('expertise_area', 'Product & Tech',          'Product & Tech',          3);
select seed_ref('expertise_area', 'Operations & Logistics',  'Operations & Logistics',  4);
select seed_ref('expertise_area', 'Legal & Compliance',      'Legal & Compliance',      5);
select seed_ref('expertise_area', 'HR & Talent',             'HR & Talent',             6);
select seed_ref('expertise_area', 'Agritech',                'Agritech',                7);
select seed_ref('expertise_area', 'Fintech',                 'Fintech',                 8);
select seed_ref('expertise_area', 'Healthtech',              'Healthtech',              9);
select seed_ref('expertise_area', 'Edtech',                  'Edtech',                  10);
select seed_ref('expertise_area', 'Manufacturing',           'Manufacturing',           11);
select seed_ref('expertise_area', 'Real Estate',             'Real Estate',             12);
select seed_ref('expertise_area', 'Media & Comms',           'Media & Comms',           13);
select seed_ref('expertise_area', 'Import / Export',         'Import / Export',         14);


-- ── experience_years ──────────────────────────────────────────────────────────
select seed_ref('experience_years', 'Less than 2 years', 'Less than 2 years', 0);
select seed_ref('experience_years', '2-5 years',         '2-5 years',         1);
select seed_ref('experience_years', '5-10 years',        '5-10 years',        2);
select seed_ref('experience_years', '10-20 years',       '10-20 years',       3);
select seed_ref('experience_years', '20+ years',         '20+ years',         4);


-- ── professional_service ──────────────────────────────────────────────────────
select seed_ref('professional_service', 'Legal & Compliance',      'Legal & Compliance',      0);
select seed_ref('professional_service', 'Accounting & Finance',    'Accounting & Finance',    1);
select seed_ref('professional_service', 'Software Development',    'Software Development',    2);
select seed_ref('professional_service', 'Product Design & UX',     'Product Design & UX',     3);
select seed_ref('professional_service', 'Marketing & Growth',      'Marketing & Growth',      4);
select seed_ref('professional_service', 'Business Development',    'Business Development',    5);
select seed_ref('professional_service', 'HR & Recruitment',        'HR & Recruitment',        6);
select seed_ref('professional_service', 'Project Management',      'Project Management',      7);
select seed_ref('professional_service', 'Data & Analytics',        'Data & Analytics',        8);
select seed_ref('professional_service', 'Cybersecurity',           'Cybersecurity',           9);
select seed_ref('professional_service', 'Investor Relations',      'Investor Relations',      10);
select seed_ref('professional_service', 'Other',                   'Other',                   11);


-- ── engagement_type ───────────────────────────────────────────────────────────
select seed_ref('engagement_type', 'Project-based',          'Project-based',          0);
select seed_ref('engagement_type', 'Monthly retainer',       'Monthly retainer',       1);
select seed_ref('engagement_type', 'Full-time contract',     'Full-time contract',     2);
select seed_ref('engagement_type', 'Advisory / Board role',  'Advisory / Board role',  3);
select seed_ref('engagement_type', 'Any',                    'Any',                    4);


-- ── community_interest ────────────────────────────────────────────────────────
select seed_ref('community_interest', 'Investing',           'Investing',           0);
select seed_ref('community_interest', 'Startup Building',    'Startup Building',    1);
select seed_ref('community_interest', 'Business Growth',     'Business Growth',     2);
select seed_ref('community_interest', 'Fintech',             'Fintech',             3);
select seed_ref('community_interest', 'Agritech',            'Agritech',            4);
select seed_ref('community_interest', 'Real Estate',         'Real Estate',         5);
select seed_ref('community_interest', 'Healthtech',          'Healthtech',          6);
select seed_ref('community_interest', 'Clean Energy',        'Clean Energy',        7);
select seed_ref('community_interest', 'African Markets',     'African Markets',     8);
select seed_ref('community_interest', 'Diaspora Investment', 'Diaspora Investment', 9);
select seed_ref('community_interest', 'Mentorship',          'Mentorship',          10);
select seed_ref('community_interest', 'Networking',          'Networking',          11);


-- ── referral_source ───────────────────────────────────────────────────────────
select seed_ref('referral_source', 'Friend or colleague',  'Friend or colleague',  0);
select seed_ref('referral_source', 'LinkedIn',             'LinkedIn',             1);
select seed_ref('referral_source', 'Twitter / X',          'Twitter / X',          2);
select seed_ref('referral_source', 'Instagram',            'Instagram',            3);
select seed_ref('referral_source', 'Google search',        'Google search',        4);
select seed_ref('referral_source', 'News article',         'News article',         5);
select seed_ref('referral_source', 'Podcast / YouTube',    'Podcast / YouTube',    6);
select seed_ref('referral_source', 'Event or conference',  'Event or conference',  7);
select seed_ref('referral_source', 'Other',                'Other',                8);


-- Clean up the helper function (optional — keep if you want to seed later)
-- drop function if exists seed_ref(text, text, text, int, jsonb);
