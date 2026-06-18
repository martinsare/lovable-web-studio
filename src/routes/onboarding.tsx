import { createFileRoute, redirect, useNavigate, Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { toast } from "sonner";
import logo from "@/assets/icon.png";
import {
  TrendingUp, Briefcase, Rocket, GraduationCap, Wrench, Users, Check,
  ChevronRight, ChevronLeft, Building2, Globe, Phone, Link2,
  MapPin, User, FileText, AlertCircle,
} from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  ssr: false,
  head: () => ({ meta: [{ title: "Get started · CoFund" }] }),
  component: Onboarding,
});

// ─── Constants ───────────────────────────────────────────────────────────────

const AFRICAN_COUNTRIES = [
  "Nigeria", "South Africa", "Kenya", "Ghana", "Ethiopia", "Tanzania",
  "Uganda", "Rwanda", "Senegal", "Ivory Coast", "Cameroon", "Angola",
  "Mozambique", "Zambia", "Zimbabwe", "Botswana", "Namibia", "Mauritius",
  "Morocco", "Egypt", "Tunisia", "Algeria", "Libya", "Sudan", "Somalia",
  "DRC", "Gabon", "Congo", "Mali", "Burkina Faso", "Niger", "Chad",
  "Sierra Leone", "Liberia", "Guinea", "Benin", "Togo", "Malawi",
  "Lesotho", "Eswatini", "Eritrea", "Djibouti", "Comoros", "Cape Verde",
  "São Tomé and Príncipe", "Equatorial Guinea", "South Sudan", "Madagascar",
  "Seychelles", "Gambia", "Guinea-Bissau",
];

const DIASPORA_COUNTRIES = [
  "United Kingdom", "United States", "Canada", "United Arab Emirates",
  "France", "Germany", "Netherlands", "Belgium", "Portugal", "Italy",
  "Saudi Arabia", "Qatar", "Australia", "Other",
];

const ALL_COUNTRIES = [...AFRICAN_COUNTRIES, ...DIASPORA_COUNTRIES];

const SECTORS = [
  "Fintech & Payments", "Agritech & Food Systems", "Healthtech & Biotech",
  "Edtech & Skills", "Clean Energy & Climate", "Logistics & Transport",
  "E-commerce & Retail", "Real Estate & Construction", "Media & Entertainment",
  "Manufacturing & Industry", "Mining & Resources", "Fashion & Beauty",
  "Travel & Hospitality", "SaaS & Enterprise Tech", "Telecom",
  "Government & Civic Tech", "Security & Defence", "Other",
];

const INVESTOR_TYPES = [
  { id: "individual", label: "Individual investor", desc: "Investing personal funds" },
  { id: "family_office", label: "Family office", desc: "Managing family wealth" },
  { id: "fund", label: "Fund / VC", desc: "Investment fund or VC firm" },
  { id: "corporate", label: "Corporate investor", desc: "Company strategic investment" },
];

const CAPITAL_RANGES = [
  "Under $10,000", "$10,000 – $50,000", "$50,000 – $250,000",
  "$250,000 – $1M", "$1M – $5M", "Over $5M",
];

const TICKET_SIZES = [
  "Under $1,000", "$1,000 – $5,000", "$5,000 – $25,000",
  "$25,000 – $100,000", "$100,000 – $500,000", "Over $500,000",
];

const BUSINESS_STAGES = [
  { id: "idea", label: "Idea stage", desc: "Still validating the concept" },
  { id: "pre_revenue", label: "Pre-revenue", desc: "Building product / MVP" },
  { id: "revenue", label: "Revenue-generating", desc: "Early sales and customers" },
  { id: "profitable", label: "Profitable", desc: "Sustainable positive cash flow" },
  { id: "scaling", label: "Scaling", desc: "Growing rapidly, seeking capital" },
];

const REVENUE_RANGES = [
  "Pre-revenue", "Under $10,000 / yr", "$10,000 – $100,000 / yr",
  "$100,000 – $500,000 / yr", "$500,000 – $2M / yr",
  "$2M – $10M / yr", "Over $10M / yr",
];

const TEAM_SIZES = ["Just me", "2–5 people", "6–20 people", "21–50 people", "50+ people"];

const SEEKING_OPTIONS = [
  "Funding / Investment", "Mentorship & Advisory", "Strategic Partnerships",
  "Customers & Distribution", "Team Members", "Technical Co-founder",
];

const BUSINESS_CAPITAL = [
  "Under $50,000", "$50,000 – $250,000", "$250,000 – $1M",
  "$1M – $5M", "$5M – $20M", "Over $20M",
];

const STARTUP_STAGES = [
  { id: "idea", label: "Idea / Concept" },
  { id: "prototype", label: "Prototype / MVP built" },
  { id: "beta", label: "Beta / Early users" },
  { id: "launched", label: "Launched / Live product" },
];

const COFOUND_STATUS = [
  { id: "have_team", label: "I have a team", desc: "Co-founders already onboard" },
  { id: "looking", label: "Looking for co-founders", desc: "Need technical or business partners" },
  { id: "solo", label: "Going solo for now", desc: "Working alone, open to partners later" },
];

const EXPERTISE_AREAS = [
  "Strategy & Leadership", "Finance & Fundraising", "Sales & Marketing",
  "Product & Tech", "Operations & Logistics", "Legal & Compliance",
  "HR & Talent", "Agritech", "Fintech", "Healthtech", "Edtech",
  "Manufacturing", "Real Estate", "Media & Comms", "Import / Export",
];

const EXPERIENCE_YEARS = [
  "Less than 2 years", "2–5 years", "5–10 years", "10–20 years", "20+ years",
];

const PROFESSIONAL_SERVICES = [
  "Legal & Compliance", "Accounting & Finance", "Software Development",
  "Product Design & UX", "Marketing & Growth", "Business Development",
  "HR & Recruitment", "Project Management", "Data & Analytics",
  "Cybersecurity", "Investor Relations", "Other",
];

const ENGAGEMENT_TYPES = [
  "Project-based", "Monthly retainer", "Full-time contract", "Advisory / Board role", "Any",
];

const COMMUNITY_INTERESTS = [
  "Investing", "Startup Building", "Business Growth", "Fintech",
  "Agritech", "Real Estate", "Healthtech", "Clean Energy",
  "African Markets", "Diaspora Investment", "Mentorship", "Networking",
];

const REFERRAL_SOURCES = [
  "Friend or colleague", "LinkedIn", "Twitter / X", "Instagram",
  "Google search", "News article", "Podcast / YouTube", "Event or conference", "Other",
];

const ROLES: { id: AppRole; title: string; desc: string; icon: any }[] = [
  { id: "investor", title: "Investor", desc: "Discover and back verified African businesses.", icon: TrendingUp },
  { id: "business_owner", title: "Business Owner", desc: "List your business, raise capital, and grow.", icon: Briefcase },
  { id: "startup_builder", title: "Startup Builder", desc: "Share your idea and find co-founders & mentors.", icon: Rocket },
  { id: "mentor", title: "Mentor / Advisor", desc: "Guide founders with your expertise and experience.", icon: GraduationCap },
  { id: "professional", title: "Service Professional", desc: "Offer legal, accounting, design or tech services.", icon: Wrench },
  { id: "community_member", title: "Community Member", desc: "Learn, follow African businesses, and network.", icon: Users },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface OBData {
  fullName: string; phone: string; country: string; city: string;
  bio: string; occupation: string; linkedinUrl: string; websiteUrl: string;
  roles: AppRole[];
  investorType: string; investorExperience: string; investorCapitalRange: string;
  investorMinTicket: string; investorMaxTicket: string; investorSectors: string[];
  investorAccredited: string;
  businessName: string; businessIndustry: string; businessCountry: string;
  businessStage: string; businessRevenueRange: string; businessTeamSize: string;
  businessSeeking: string[]; businessCapitalNeeded: string;
  startupName: string; startupIndustry: string; startupStage: string;
  startupCofounderStatus: string; startupSeeking: string[];
  mentorExpertise: string[]; mentorExperience: string; mentorIndustry: string;
  mentorAvailability: string; mentorHours: string;
  professionalService: string; professionalExperience: string;
  professionalOpenToStartups: boolean; professionalEngagement: string;
  communityInterests: string[]; communityReferral: string;
  agreedAge: boolean; agreedTerms: boolean; agreedRisk: boolean;
}

const INITIAL: OBData = {
  fullName: "", phone: "", country: "", city: "", bio: "", occupation: "",
  linkedinUrl: "", websiteUrl: "", roles: [],
  investorType: "", investorExperience: "", investorCapitalRange: "",
  investorMinTicket: "", investorMaxTicket: "", investorSectors: [],
  investorAccredited: "",
  businessName: "", businessIndustry: "", businessCountry: "", businessStage: "",
  businessRevenueRange: "", businessTeamSize: "", businessSeeking: [],
  businessCapitalNeeded: "",
  startupName: "", startupIndustry: "", startupStage: "",
  startupCofounderStatus: "", startupSeeking: [],
  mentorExpertise: [], mentorExperience: "", mentorIndustry: "",
  mentorAvailability: "", mentorHours: "",
  professionalService: "", professionalExperience: "",
  professionalOpenToStartups: true, professionalEngagement: "",
  communityInterests: [], communityReferral: "",
  agreedAge: false, agreedTerms: false, agreedRisk: false,
};

// ─── Main Component ───────────────────────────────────────────────────────────

function Onboarding() {
  const navigate = useNavigate();
  const { user, loading, profile, refresh } = useAuth();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OBData>(() => ({
    ...INITIAL,
    fullName: typeof window !== "undefined"
      ? (user?.user_metadata?.full_name ?? "")
      : "",
  }));
  const [busy, setBusy] = useState(false);

  if (!loading && !user) throw redirect({ to: "/auth", search: { mode: "signin" } });
  if (!loading && profile?.onboarded) throw redirect({ to: "/home" });

  function set<K extends keyof OBData>(key: K, val: OBData[K]) {
    setData((d) => ({ ...d, [key]: val }));
  }

  function toggleChip<K extends keyof OBData>(key: K, val: string) {
    setData((d) => {
      const arr = d[key] as string[];
      return { ...d, [key]: arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val] };
    });
  }

  function toggleRole(r: AppRole) {
    setData((d) => {
      const next = d.roles.includes(r) ? d.roles.filter((x) => x !== r) : [...d.roles, r];
      return { ...d, roles: next };
    });
  }

  // Step validation
  const step1Valid = data.fullName.trim().length >= 2 && data.phone.trim().length >= 7 && data.country !== "";
  const step2Valid = data.roles.length > 0;
  const step3Valid = true; // role details are encouraged but not all mandatory
  const step4Valid = data.agreedAge && data.agreedTerms;

  async function finish() {
    if (!user) return;
    setBusy(true);
    try {
      const roles = data.roles.length > 0 ? data.roles : (["community_member"] as AppRole[]);

      // Build metadata object for role-specific data
      const metadata: Record<string, any> = {};
      if (roles.includes("investor")) {
        metadata.investor = {
          type: data.investorType, experience: data.investorExperience,
          capitalRange: data.investorCapitalRange, minTicket: data.investorMinTicket,
          maxTicket: data.investorMaxTicket, sectors: data.investorSectors,
          accredited: data.investorAccredited,
        };
      }
      if (roles.includes("business_owner")) {
        metadata.business = {
          name: data.businessName, industry: data.businessIndustry,
          country: data.businessCountry, stage: data.businessStage,
          revenueRange: data.businessRevenueRange, teamSize: data.businessTeamSize,
          seeking: data.businessSeeking, capitalNeeded: data.businessCapitalNeeded,
        };
      }
      if (roles.includes("startup_builder")) {
        metadata.startup = {
          name: data.startupName, industry: data.startupIndustry,
          stage: data.startupStage, cofounderStatus: data.startupCofounderStatus,
          seeking: data.startupSeeking,
        };
      }
      if (roles.includes("mentor")) {
        metadata.mentor = {
          expertise: data.mentorExpertise, experience: data.mentorExperience,
          industry: data.mentorIndustry, availability: data.mentorAvailability,
          hoursPerMonth: data.mentorHours,
        };
      }
      if (roles.includes("professional")) {
        metadata.professional = {
          service: data.professionalService, experience: data.professionalExperience,
          openToStartups: data.professionalOpenToStartups, engagement: data.professionalEngagement,
        };
      }
      if (roles.includes("community_member")) {
        metadata.community = {
          interests: data.communityInterests, referral: data.communityReferral,
        };
      }

      // Derive occupation headline
      const primaryRole = roles[0];
      const headlineMap: Record<string, string> = {
        investor: data.investorType ? `${INVESTOR_TYPES.find(t => t.id === data.investorType)?.label ?? "Investor"}` : "Investor",
        business_owner: data.businessName ? `Founder, ${data.businessName}` : "Business Owner",
        startup_builder: data.startupName ? `Startup Builder · ${data.startupName}` : "Startup Builder",
        mentor: "Mentor & Advisor",
        professional: data.professionalService || "Service Professional",
        community_member: "Community Member",
      };
      const occupation = data.occupation.trim() || headlineMap[primaryRole] || "CoFund Member";

      // Save profile — try new columns, gracefully fall back
      const profilePayload: any = {
        full_name: data.fullName,
        bio: data.bio,
        location: [data.city, data.country].filter(Boolean).join(", "),
        occupation,
        onboarded: true,
        // New columns (require migration to be applied)
        phone: data.phone,
        country: data.country,
        city: data.city,
        website_url: data.websiteUrl,
        linkedin_url: data.linkedinUrl,
        metadata,
        agreed_terms: data.agreedTerms,
        onboarding_step: 4,
      };

      const { error: pErr } = await supabase
        .from("profiles")
        .update(profilePayload)
        .eq("id", user.id);

      if (pErr) {
        // If new columns don't exist yet, retry with only base columns
        const { error: pErr2 } = await supabase
          .from("profiles")
          .update({
            full_name: profilePayload.full_name,
            bio: profilePayload.bio,
            location: profilePayload.location,
            occupation: profilePayload.occupation,
            onboarded: true,
          })
          .eq("id", user.id);
        if (pErr2) throw pErr2;
      }

      // Save roles
      const roleRows = roles.map((role) => ({ user_id: user.id, role }));
      const { error: rErr } = await supabase
        .from("user_roles")
        .upsert(roleRows, { onConflict: "user_id,role" });
      if (rErr) throw rErr;

      await refresh();
      toast.success("Welcome to CoFund! 🎉");
      navigate({ to: "/home" });
    } catch (e: any) {
      toast.error(e.message ?? "Could not save profile");
    } finally {
      setBusy(false);
    }
  }

  const TOTAL_STEPS = 4;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border/40 px-6 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={logo} alt="CoFund" className="h-8 w-8 object-contain" />
            <span className="font-display text-lg font-bold">CoFund</span>
          </Link>
          <span className="text-sm text-muted-foreground">
            Step {step} of {TOTAL_STEPS}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-border/40">
        <div
          className="h-1 gradient-brand transition-all duration-500"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        {step === 1 && <Step1 data={data} set={set} />}
        {step === 2 && <Step2 data={data} toggleRole={toggleRole} />}
        {step === 3 && <Step3 data={data} set={set} toggleChip={toggleChip} />}
        {step === 4 && <Step4 data={data} set={set} />}

        {/* Navigation */}
        <div className="mt-10 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < TOTAL_STEPS ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={
                (step === 1 && !step1Valid) ||
                (step === 2 && !step2Valid) ||
                (step === 3 && !step3Valid)
              }
              className="gradient-brand flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-brand transition hover:opacity-90 disabled:opacity-40"
            >
              Continue <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={finish}
              disabled={!step4Valid || busy}
              className="gradient-brand flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-semibold text-white shadow-brand transition hover:opacity-90 disabled:opacity-40"
            >
              {busy ? "Setting up…" : "Complete my profile"}
              {!busy && <Check className="h-4 w-4" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Step 1: Basic Profile ────────────────────────────────────────────────────

function Step1({ data, set }: { data: OBData; set: any }) {
  return (
    <div>
      <div className="mb-8">
        <p className="mb-1.5 text-sm font-semibold uppercase tracking-wider text-primary">Step 1 of 4</p>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Tell us about yourself</h1>
        <p className="mt-2 text-muted-foreground">This creates your public CoFund profile. You can edit it anytime.</p>
      </div>

      <div className="space-y-6">
        {/* Name + phone row */}
        <div className="grid gap-4 sm:grid-cols-2">
          <OBField label="Full name *" icon={<User className="h-4 w-4" />}>
            <input
              type="text"
              value={data.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              placeholder="e.g. Amara Okonkwo"
              className={inputCls}
              required
            />
          </OBField>
          <OBField label="Phone number *" icon={<Phone className="h-4 w-4" />}>
            <input
              type="tel"
              value={data.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+234 800 000 0000"
              className={inputCls}
              required
            />
          </OBField>
        </div>

        {/* Country + city */}
        <div className="grid gap-4 sm:grid-cols-2">
          <OBField label="Country *" icon={<Globe className="h-4 w-4" />}>
            <select
              value={data.country}
              onChange={(e) => set("country", e.target.value)}
              className={inputCls}
              required
            >
              <option value="">Select country…</option>
              <optgroup label="African Countries">
                {AFRICAN_COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </optgroup>
              <optgroup label="Diaspora / Global">
                {DIASPORA_COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </optgroup>
            </select>
          </OBField>
          <OBField label="City / State" icon={<MapPin className="h-4 w-4" />}>
            <input
              type="text"
              value={data.city}
              onChange={(e) => set("city", e.target.value)}
              placeholder="e.g. Lagos, Abuja, Nairobi…"
              className={inputCls}
            />
          </OBField>
        </div>

        {/* Professional headline */}
        <OBField label="Professional headline" icon={<Briefcase className="h-4 w-4" />}>
          <input
            type="text"
            value={data.occupation}
            onChange={(e) => set("occupation", e.target.value)}
            placeholder="e.g. Angel Investor · Lagos | Startup Founder | CFO at Acme Ltd"
            className={inputCls}
            maxLength={100}
          />
        </OBField>

        {/* Bio */}
        <OBField label="About you (optional)" icon={<FileText className="h-4 w-4" />}>
          <textarea
            value={data.bio}
            onChange={(e) => set("bio", e.target.value)}
            placeholder="Brief introduction — your background, interests, and what excites you about African business…"
            className={`${inputCls} min-h-[96px] resize-none`}
            maxLength={500}
          />
          <p className="mt-1.5 text-right text-xs text-muted-foreground">{data.bio.length}/500</p>
        </OBField>

        {/* LinkedIn + Website */}
        <div className="grid gap-4 sm:grid-cols-2">
          <OBField label="LinkedIn URL (optional)" icon={<Link2 className="h-4 w-4" />}>
            <input
              type="url"
              value={data.linkedinUrl}
              onChange={(e) => set("linkedinUrl", e.target.value)}
              placeholder="https://linkedin.com/in/yourname"
              className={inputCls}
            />
          </OBField>
          <OBField label="Website / Portfolio (optional)" icon={<Globe className="h-4 w-4" />}>
            <input
              type="url"
              value={data.websiteUrl}
              onChange={(e) => set("websiteUrl", e.target.value)}
              placeholder="https://yourwebsite.com"
              className={inputCls}
            />
          </OBField>
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Role Selection ───────────────────────────────────────────────────

function Step2({ data, toggleRole }: { data: OBData; toggleRole: (r: AppRole) => void }) {
  return (
    <div>
      <div className="mb-8">
        <p className="mb-1.5 text-sm font-semibold uppercase tracking-wider text-primary">Step 2 of 4</p>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">What brings you to CoFund?</h1>
        <p className="mt-2 text-muted-foreground">Pick one or more roles — you can always add more later in settings.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {ROLES.map((r) => {
          const active = data.roles.includes(r.id);
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => toggleRole(r.id)}
              className={`relative rounded-2xl border p-5 text-left transition ${
                active
                  ? "border-primary bg-primary/5 shadow-soft"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                  active ? "gradient-brand text-white" : "bg-muted text-muted-foreground"
                }`}>
                  <r.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-base font-bold">{r.title}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{r.desc}</p>
                </div>
                <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${
                  active ? "border-primary bg-primary" : "border-border"
                }`}>
                  {active && <Check className="h-3 w-3 text-white" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {data.roles.length === 0 && (
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Select at least one role to continue.
        </p>
      )}
    </div>
  );
}

// ─── Step 3: Role-Specific Details ───────────────────────────────────────────

function Step3({ data, set, toggleChip }: { data: OBData; set: any; toggleChip: any }) {
  const hasInvestor = data.roles.includes("investor");
  const hasBusiness = data.roles.includes("business_owner");
  const hasStartup = data.roles.includes("startup_builder");
  const hasMentor = data.roles.includes("mentor");
  const hasProfessional = data.roles.includes("professional");
  const hasCommunity = data.roles.includes("community_member");

  return (
    <div>
      <div className="mb-8">
        <p className="mb-1.5 text-sm font-semibold uppercase tracking-wider text-primary">Step 3 of 4</p>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Your details</h1>
        <p className="mt-2 text-muted-foreground">
          Help us personalise your experience. The more you share, the better your matches.
        </p>
      </div>

      <div className="space-y-10">
        {hasInvestor && (
          <RoleSection icon={<TrendingUp className="h-5 w-5" />} title="As an Investor">
            <div className="space-y-5">
              <div>
                <label className={labelCls}>Investor type *</label>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {INVESTOR_TYPES.map((t) => (
                    <RadioCard
                      key={t.id}
                      active={data.investorType === t.id}
                      onClick={() => set("investorType", t.id)}
                      label={t.label}
                      desc={t.desc}
                    />
                  ))}
                </div>
              </div>

              <OBSelect label="Investment experience" value={data.investorExperience}
                onChange={(v) => set("investorExperience", v)}
                options={["Less than 1 year", "1–3 years", "3–5 years", "5–10 years", "10+ years"]} />

              <OBSelect label="Total investable capital (approx.)" value={data.investorCapitalRange}
                onChange={(v) => set("investorCapitalRange", v)} options={CAPITAL_RANGES} />

              <div className="grid gap-4 sm:grid-cols-2">
                <OBSelect label="Minimum ticket size" value={data.investorMinTicket}
                  onChange={(v) => set("investorMinTicket", v)} options={TICKET_SIZES} />
                <OBSelect label="Maximum ticket size" value={data.investorMaxTicket}
                  onChange={(v) => set("investorMaxTicket", v)} options={TICKET_SIZES} />
              </div>

              <div>
                <label className={labelCls}>Sectors of interest (select all that apply)</label>
                <ChipSelector
                  options={SECTORS}
                  selected={data.investorSectors}
                  toggle={(v) => toggleChip("investorSectors", v)}
                />
              </div>

              <div>
                <label className={labelCls}>Are you a professional / sophisticated investor?</label>
                <div className="mt-2 flex gap-3">
                  {["Yes", "No", "Not sure"].map((v) => (
                    <button key={v} type="button"
                      onClick={() => set("investorAccredited", v.toLowerCase().replace(" ", "_"))}
                      className={pillCls(data.investorAccredited === v.toLowerCase().replace(" ", "_"))}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </RoleSection>
        )}

        {hasBusiness && (
          <RoleSection icon={<Building2 className="h-5 w-5" />} title="About your Business">
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <OBField label="Business name *">
                  <input type="text" value={data.businessName}
                    onChange={(e) => set("businessName", e.target.value)}
                    placeholder="e.g. Agroflow Ltd" className={inputCls} />
                </OBField>
                <OBSelect label="Industry / Sector *" value={data.businessIndustry}
                  onChange={(v) => set("businessIndustry", v)} options={SECTORS} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <OBSelect label="Country of operation" value={data.businessCountry}
                  onChange={(v) => set("businessCountry", v)} options={ALL_COUNTRIES} />
                <OBSelect label="Annual revenue" value={data.businessRevenueRange}
                  onChange={(v) => set("businessRevenueRange", v)} options={REVENUE_RANGES} />
              </div>

              <div>
                <label className={labelCls}>Business stage *</label>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {BUSINESS_STAGES.map((s) => (
                    <RadioCard key={s.id} active={data.businessStage === s.id}
                      onClick={() => set("businessStage", s.id)}
                      label={s.label} desc={s.desc} />
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <OBSelect label="Team size" value={data.businessTeamSize}
                  onChange={(v) => set("businessTeamSize", v)} options={TEAM_SIZES} />
                <OBSelect label="Capital you're seeking" value={data.businessCapitalNeeded}
                  onChange={(v) => set("businessCapitalNeeded", v)} options={BUSINESS_CAPITAL} />
              </div>

              <div>
                <label className={labelCls}>What are you looking for? (select all that apply)</label>
                <ChipSelector options={SEEKING_OPTIONS} selected={data.businessSeeking}
                  toggle={(v) => toggleChip("businessSeeking", v)} />
              </div>
            </div>
          </RoleSection>
        )}

        {hasStartup && (
          <RoleSection icon={<Rocket className="h-5 w-5" />} title="Your Startup">
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <OBField label="Startup / idea name (optional)">
                  <input type="text" value={data.startupName}
                    onChange={(e) => set("startupName", e.target.value)}
                    placeholder="Leave blank if not named yet" className={inputCls} />
                </OBField>
                <OBSelect label="Industry / Domain" value={data.startupIndustry}
                  onChange={(v) => set("startupIndustry", v)} options={SECTORS} />
              </div>

              <div>
                <label className={labelCls}>Current stage</label>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {STARTUP_STAGES.map((s) => (
                    <RadioCard key={s.id} active={data.startupStage === s.id}
                      onClick={() => set("startupStage", s.id)} label={s.label} />
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>Co-founder status</label>
                <div className="mt-2 grid gap-2 sm:grid-cols-3">
                  {COFOUND_STATUS.map((s) => (
                    <RadioCard key={s.id} active={data.startupCofounderStatus === s.id}
                      onClick={() => set("startupCofounderStatus", s.id)}
                      label={s.label} desc={s.desc} />
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls}>What do you need from CoFund? (select all that apply)</label>
                <ChipSelector options={SEEKING_OPTIONS} selected={data.startupSeeking}
                  toggle={(v) => toggleChip("startupSeeking", v)} />
              </div>
            </div>
          </RoleSection>
        )}

        {hasMentor && (
          <RoleSection icon={<GraduationCap className="h-5 w-5" />} title="As a Mentor / Advisor">
            <div className="space-y-5">
              <div>
                <label className={labelCls}>Areas of expertise (select all that apply)</label>
                <ChipSelector options={EXPERTISE_AREAS} selected={data.mentorExpertise}
                  toggle={(v) => toggleChip("mentorExpertise", v)} />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <OBSelect label="Years of professional experience" value={data.mentorExperience}
                  onChange={(v) => set("mentorExperience", v)} options={EXPERIENCE_YEARS} />
                <OBSelect label="Primary industry" value={data.mentorIndustry}
                  onChange={(v) => set("mentorIndustry", v)} options={SECTORS} />
              </div>

              <div>
                <label className={labelCls}>Mentoring availability</label>
                <div className="mt-2 flex flex-wrap gap-3">
                  {[
                    { id: "paid", label: "Paid engagements only" },
                    { id: "volunteer", label: "Volunteer / pro-bono" },
                    { id: "both", label: "Open to both" },
                  ].map((opt) => (
                    <button key={opt.id} type="button"
                      onClick={() => set("mentorAvailability", opt.id)}
                      className={pillCls(data.mentorAvailability === opt.id)}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <OBSelect label="Hours available per month" value={data.mentorHours}
                onChange={(v) => set("mentorHours", v)}
                options={["1–2 hours", "2–5 hours", "5–10 hours", "10+ hours"]} />
            </div>
          </RoleSection>
        )}

        {hasProfessional && (
          <RoleSection icon={<Wrench className="h-5 w-5" />} title="Your Professional Services">
            <div className="space-y-5">
              <OBSelect label="Primary service type *" value={data.professionalService}
                onChange={(v) => set("professionalService", v)} options={PROFESSIONAL_SERVICES} />

              <div className="grid gap-4 sm:grid-cols-2">
                <OBSelect label="Years of experience" value={data.professionalExperience}
                  onChange={(v) => set("professionalExperience", v)} options={EXPERIENCE_YEARS} />
                <OBSelect label="Preferred engagement type" value={data.professionalEngagement}
                  onChange={(v) => set("professionalEngagement", v)} options={ENGAGEMENT_TYPES} />
              </div>

              <div>
                <label className={labelCls}>Are you open to working with early-stage startups?</label>
                <div className="mt-2 flex gap-3">
                  {["Yes", "No", "Case by case"].map((v) => (
                    <button key={v} type="button"
                      onClick={() => set("professionalOpenToStartups", v === "Yes")}
                      className={pillCls(
                        v === "Yes" ? data.professionalOpenToStartups === true :
                        v === "No" ? data.professionalOpenToStartups === false : false
                      )}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </RoleSection>
        )}

        {hasCommunity && !hasInvestor && !hasBusiness && !hasStartup && !hasMentor && !hasProfessional && (
          <RoleSection icon={<Users className="h-5 w-5" />} title="Community Interests">
            <div className="space-y-5">
              <div>
                <label className={labelCls}>Topics you're interested in (select all that apply)</label>
                <ChipSelector options={COMMUNITY_INTERESTS} selected={data.communityInterests}
                  toggle={(v) => toggleChip("communityInterests", v)} />
              </div>

              <OBSelect label="How did you hear about CoFund?" value={data.communityReferral}
                onChange={(v) => set("communityReferral", v)} options={REFERRAL_SOURCES} />
            </div>
          </RoleSection>
        )}
      </div>
    </div>
  );
}

// ─── Step 4: Verify & Commit ──────────────────────────────────────────────────

function Step4({ data, set }: { data: OBData; set: any }) {
  const hasInvestorRole = data.roles.includes("investor") || data.roles.includes("business_owner");
  const primaryRoleLabel = ROLES.find((r) => r.id === data.roles[0])?.title ?? "Member";

  return (
    <div>
      <div className="mb-8">
        <p className="mb-1.5 text-sm font-semibold uppercase tracking-wider text-primary">Step 4 of 4</p>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Almost there!</h1>
        <p className="mt-2 text-muted-foreground">Review your profile and agree to our terms to complete setup.</p>
      </div>

      {/* Profile summary card */}
      <div className="mb-8 rounded-2xl border border-border bg-card p-6">
        <h3 className="mb-4 font-display text-base font-bold text-muted-foreground uppercase tracking-wider text-xs">
          Your profile summary
        </h3>
        <div className="space-y-3">
          <SummaryRow label="Name" value={data.fullName} />
          <SummaryRow label="Location" value={[data.city, data.country].filter(Boolean).join(", ")} />
          <SummaryRow label="Phone" value={data.phone} />
          {data.occupation && <SummaryRow label="Headline" value={data.occupation} />}
          <SummaryRow
            label="Role(s)"
            value={data.roles.map((r) => ROLES.find((x) => x.id === r)?.title).filter(Boolean).join(", ")}
          />
          {data.linkedinUrl && <SummaryRow label="LinkedIn" value={data.linkedinUrl} />}
        </div>
      </div>

      {/* Agreements */}
      <div className="space-y-4">
        <h3 className="font-display text-base font-bold">Before you continue</h3>

        <AgreementBox
          checked={data.agreedAge}
          onChange={(v) => set("agreedAge", v)}
          label="I confirm I am 18 years of age or older."
          required
        />

        <AgreementBox
          checked={data.agreedTerms}
          onChange={(v) => set("agreedTerms", v)}
          required
          label={
            <>
              I have read and agree to the{" "}
              <a href="/terms" target="_blank" className="text-primary underline underline-offset-2">Terms of Use</a>
              {" "}and{" "}
              <a href="/privacy" target="_blank" className="text-primary underline underline-offset-2">Privacy Policy</a>.
            </>
          }
        />

        {hasInvestorRole && (
          <>
            <AgreementBox
              checked={data.agreedRisk}
              onChange={(v) => set("agreedRisk", v)}
              label="I understand that investing in private businesses involves significant risk, including the potential loss of all invested capital."
            />
            <AgreementBox
              checked={true}
              onChange={() => {}}
              readOnly
              label="I understand CoFund does not guarantee investment returns or the performance of any listed business."
            />
          </>
        )}

        <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            CoFund is a private investment platform. All businesses are independently verified, but
            investments are not insured. Only invest what you can afford to lose.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Shared UI Helpers ────────────────────────────────────────────────────────

const inputCls = "w-full rounded-xl border border-border bg-card/60 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20";
const labelCls = "block text-sm font-medium text-foreground mb-1.5";

function OBField({ label, icon, children }: { label: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className={labelCls}>
        {icon && <span className="mr-1.5 inline-block align-text-bottom text-muted-foreground">{icon}</span>}
        {label}
      </span>
      {children}
    </label>
  );
}

function OBSelect({ label, value, onChange, options }: {
  label: string; value: string; onChange: (v: string) => void; options: string[];
}) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
        <option value="">Select…</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

function RoleSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-6">
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-brand text-white">
          {icon}
        </div>
        <h2 className="font-display text-lg font-bold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function ChipSelector({ options, selected, toggle }: {
  options: string[]; selected: string[]; toggle: (v: string) => void;
}) {
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button key={opt} type="button" onClick={() => toggle(opt)}
            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
              active
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
            }`}>
            {active && <span className="mr-1">✓</span>}{opt}
          </button>
        );
      })}
    </div>
  );
}

function RadioCard({ active, onClick, label, desc }: {
  active: boolean; onClick: () => void; label: string; desc?: string;
}) {
  return (
    <button type="button" onClick={onClick}
      className={`rounded-xl border p-3.5 text-left text-sm transition ${
        active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
      }`}>
      <div className="flex items-start gap-2.5">
        <div className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
          active ? "border-primary bg-primary" : "border-border"
        }`}>
          {active && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
        </div>
        <div>
          <p className="font-medium text-foreground">{label}</p>
          {desc && <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>}
        </div>
      </div>
    </button>
  );
}

function pillCls(active: boolean) {
  return `rounded-full border px-4 py-1.5 text-sm font-medium transition ${
    active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
  }`;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 text-sm">
      <span className="w-20 shrink-0 text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function AgreementBox({ checked, onChange, label, required, readOnly }: {
  checked: boolean; onChange: (v: boolean) => void;
  label: ReactNode; required?: boolean; readOnly?: boolean;
}) {
  return (
    <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
      checked ? "border-primary/40 bg-primary/5" : "border-border"
    } ${readOnly ? "cursor-default opacity-70" : ""}`}>
      <div
        onClick={() => !readOnly && onChange(!checked)}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${
          checked ? "border-primary bg-primary" : "border-border"
        }`}
      >
        {checked && <Check className="h-3 w-3 text-white" />}
      </div>
      <span className="text-sm text-muted-foreground leading-relaxed">
        {label}
        {required && <span className="ml-1 text-primary">*</span>}
      </span>
    </label>
  );
}
