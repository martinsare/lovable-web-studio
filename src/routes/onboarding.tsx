import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Briefcase,
  Building2,
  FileText,
  Link2,
  MapPin,
  Phone,
  Rocket,
  ShieldCheck,
  TrendingUp,
  User,
  Users,
  Wrench,
} from "lucide-react";
import {
  ACCREDITATION_BASIS_OPTIONS,
  ACCREDITATION_STATUS_OPTIONS,
  ANNUAL_INCOME_OPTIONS,
  buildComplianceMetadata,
  ID_DOCUMENT_OPTIONS,
  NET_WORTH_OPTIONS,
} from "@/lib/compliance";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { toast } from "sonner";
import logo from "@/assets/icon.png";

export const Route = createFileRoute("/onboarding")({ ssr: false, head: () => ({ meta: [{ title: "Get started Ãƒâ€šÃ‚Â· CoFund" }] }), component: Onboarding });

const ONBOARDING_STORAGE_KEY = "cofund:onboarding-draft";

const AFRICAN_COUNTRIES = ["Nigeria","South Africa","Kenya","Ghana","Ethiopia","Tanzania","Uganda","Rwanda","Senegal","Ivory Coast","Cameroon","Angola","Mozambique","Zambia","Zimbabwe","Botswana","Namibia","Mauritius","Morocco","Egypt","Tunisia","Algeria","Libya","Sudan","Somalia","DRC","Gabon","Congo","Mali","Burkina Faso","Niger","Chad","Sierra Leone","Liberia","Guinea","Benin","Togo","Malawi","Lesotho","Eswatini","Eritrea","Djibouti","Comoros","Cape Verde","SÃƒÆ’Ã‚Â£o TomÃƒÆ’Ã‚Â© and PrÃƒÆ’Ã‚Â­ncipe","Equatorial Guinea","South Sudan","Madagascar","Seychelles","Gambia","Guinea-Bissau"];
const DIASPORA_COUNTRIES = ["United Kingdom","United States","Canada","United Arab Emirates","France","Germany","Netherlands","Belgium","Portugal","Italy","Saudi Arabia","Qatar","Australia","Other"];
const ALL_COUNTRIES = [...AFRICAN_COUNTRIES, ...DIASPORA_COUNTRIES];
const SECTORS = ["Fintech & Payments","Agritech & Food Systems","Healthtech & Biotech","Edtech & Skills","Clean Energy & Climate","Logistics & Transport","E-commerce & Retail","Real Estate & Construction","Media & Entertainment","Manufacturing & Industry","Mining & Resources","Fashion & Beauty","Travel & Hospitality","SaaS & Enterprise Tech","Telecom","Government & Civic Tech","Security & Defence","Other"];
const CAPITAL_RANGES = ["Under $10,000","$10,000 - $50,000","$50,000 - $250,000","$250,000 - $1M","$1M - $5M","Over $5M"];
const TICKET_SIZES = ["Under $1,000","$1,000 - $5,000","$5,000 - $25,000","$25,000 - $100,000","$100,000 - $500,000","Over $500,000"];
const BUSINESS_STAGES = ["Idea stage","Pre-revenue","Revenue-generating","Profitable","Scaling"];
const REVENUE_RANGES = ["Pre-revenue","Under $10,000 / yr","$10,000 - $100,000 / yr","$100,000 - $500,000 / yr","$500,000 - $2M / yr","$2M - $10M / yr","Over $10M / yr"];
const TEAM_SIZES = ["Just me","2-5 people","6-20 people","21-50 people","50+ people"];
const SEEKING_OPTIONS = ["Funding / Investment","Mentorship & Advisory","Strategic Partnerships","Customers & Distribution","Team Members","Technical Co-founder"];
const BUSINESS_CAPITAL = ["Under $50,000","$50,000 - $250,000","$250,000 - $1M","$1M - $5M","$5M - $20M","Over $20M"];
const STARTUP_STAGES = ["Idea / Concept","Prototype / MVP built","Beta / Early users","Launched / Live product"];
const COFOUND_STATUS = ["I have a team","Looking for co-founders","Going solo for now"];
const EXPERTISE_AREAS = ["Strategy & Leadership","Finance & Fundraising","Sales & Marketing","Product & Tech","Operations & Logistics","Legal & Compliance","HR & Talent","Agritech","Fintech","Healthtech","Edtech","Manufacturing","Real Estate","Media & Comms","Import / Export"];
const EXPERIENCE_YEARS = ["Less than 2 years","2-5 years","5-10 years","10-20 years","20+ years"];
const PROFESSIONAL_SERVICES = ["Legal & Compliance","Accounting & Finance","Software Development","Product Design & UX","Marketing & Growth","Business Development","HR & Recruitment","Project Management","Data & Analytics","Cybersecurity","Investor Relations","Other"];
const ENGAGEMENT_TYPES = ["Project-based","Monthly retainer","Full-time contract","Advisory / Board role","Any"];
const COMMUNITY_INTERESTS = ["Investing","Startup Building","Business Growth","Fintech","Agritech","Real Estate","Healthtech","Clean Energy","African Markets","Diaspora Investment","Mentorship","Networking"];
const REFERRAL_SOURCES = ["Friend or colleague","LinkedIn","Twitter / X","Instagram","Google search","News article","Podcast / YouTube","Event or conference","Other"];
const INTENTS = [
  { id: "invest", label: "I want to invest", desc: "Browse verified opportunities and build a portfolio.", roles: ["investor"], icon: TrendingUp },
  { id: "business", label: "I own a business", desc: "Raise capital, track milestones, and grow.", roles: ["business_owner"], icon: Building2 },
  { id: "idea", label: "I'm building an idea", desc: "Find co-founders, mentors, and strategic help.", roles: ["startup_builder", "community_member"], icon: Rocket },
  { id: "community", label: "I'm joining the community", desc: "Follow businesses, discuss, and network.", roles: ["community_member"], icon: Users },
] as const;

const ROLES: { id: AppRole; title: string; desc: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "investor", title: "Investor", desc: "Discover and back verified African businesses.", icon: TrendingUp },
  { id: "business_owner", title: "Business Owner", desc: "List your business, raise capital, and grow.", icon: Briefcase },
  { id: "startup_builder", title: "Startup Builder", desc: "Share your idea and find co-founders & mentors.", icon: Rocket },
  { id: "professional", title: "Service Professional", desc: "Offer legal, accounting, design or tech services.", icon: Wrench },
  { id: "community_member", title: "Community Member", desc: "Learn, follow African businesses, and network.", icon: Users },
];

type OBData = {
  intent: string[];
  fullName: string;
  phone: string;
  country: string;
  city: string;
  bio: string;
  occupation: string;
  linkedinUrl: string;
  websiteUrl: string;
  roles: AppRole[];
  investorType: string;
  investorExperience: string;
  investorCapitalRange: string;
  investorMinTicket: string;
  investorMaxTicket: string;
  investorSectors: string[];
  investorAccredited: string;
  businessName: string;
  businessIndustry: string;
  businessCountry: string;
  businessStage: string;
  businessRevenueRange: string;
  businessTeamSize: string;
  businessSeeking: string[];
  businessCapitalNeeded: string;
  startupName: string;
  startupIndustry: string;
  startupStage: string;
  startupCofounderStatus: string;
  startupSeeking: string[];
  mentorExpertise: string[];
  mentorExperience: string;
  mentorIndustry: string;
  mentorAvailability: string;
  mentorHours: string;
  professionalService: string;
  professionalExperience: string;
  professionalOpenToStartups: boolean;
  professionalEngagement: string;
  communityInterests: string[];
  communityReferral: string;
  dateOfBirth: string;
  nationality: string;
  residentialAddress: string;
  kycIdType: string;
  kycIdNumber: string;
  nin: string;
  bvn: string;
  pepConsent: boolean;
  sanctionsConsent: boolean;
  investorAccreditationStatus: string;
  investorAccreditationBasis: string;
  investorAnnualIncomeRange: string;
  investorNetWorthRange: string;
  businessRegistrationNumber: string;
  businessTaxId: string;
  businessAddress: string;
  representativeName: string;
  representativeRole: string;
  representativeEmail: string;
  directorsCount: string;
  beneficialOwnersCount: string;
  agreedAge: boolean;
  agreedTerms: boolean;
  agreedRisk: boolean;
};

type OnboardingTrack = "investor" | "founder" | "community";

type PersistedOnboardingDraft = Pick<
  OBData,
  | "fullName"
  | "phone"
  | "country"
  | "city"
  | "bio"
  | "occupation"
  | "linkedinUrl"
  | "websiteUrl"
  | "investorType"
  | "investorExperience"
  | "investorCapitalRange"
  | "investorMinTicket"
  | "investorMaxTicket"
  | "investorAccredited"
  | "businessName"
  | "businessIndustry"
  | "businessCountry"
  | "businessStage"
  | "businessRevenueRange"
  | "businessTeamSize"
  | "businessCapitalNeeded"
  | "startupName"
  | "startupIndustry"
  | "startupStage"
  | "startupCofounderStatus"
  | "mentorExperience"
  | "mentorIndustry"
  | "mentorAvailability"
  | "mentorHours"
  | "professionalService"
  | "professionalExperience"
  | "professionalOpenToStartups"
  | "professionalEngagement"
  | "communityReferral"
  | "dateOfBirth"
  | "nationality"
  | "residentialAddress"
  | "kycIdType"
  | "kycIdNumber"
  | "nin"
  | "bvn"
  | "pepConsent"
  | "sanctionsConsent"
  | "investorAccreditationStatus"
  | "investorAccreditationBasis"
  | "investorAnnualIncomeRange"
  | "investorNetWorthRange"
  | "businessRegistrationNumber"
  | "businessTaxId"
  | "businessAddress"
  | "representativeName"
  | "representativeRole"
  | "representativeEmail"
  | "directorsCount"
  | "beneficialOwnersCount"
  | "agreedAge"
  | "agreedTerms"
  | "agreedRisk"
>;

function buildOnboardingDraft(data: OBData): Partial<PersistedOnboardingDraft> {
  return {
    fullName: data.fullName,
    phone: data.phone,
    country: data.country,
    city: data.city,
    bio: data.bio,
    occupation: data.occupation,
    linkedinUrl: data.linkedinUrl,
    websiteUrl: data.websiteUrl,
    investorType: data.investorType,
    investorExperience: data.investorExperience,
    investorCapitalRange: data.investorCapitalRange,
    investorMinTicket: data.investorMinTicket,
    investorMaxTicket: data.investorMaxTicket,
    investorAccredited: data.investorAccredited,
    businessName: data.businessName,
    businessIndustry: data.businessIndustry,
    businessCountry: data.businessCountry,
    businessStage: data.businessStage,
    businessRevenueRange: data.businessRevenueRange,
    businessTeamSize: data.businessTeamSize,
    businessCapitalNeeded: data.businessCapitalNeeded,
    startupName: data.startupName,
    startupIndustry: data.startupIndustry,
    startupStage: data.startupStage,
    startupCofounderStatus: data.startupCofounderStatus,
    mentorExperience: data.mentorExperience,
    mentorIndustry: data.mentorIndustry,
    mentorAvailability: data.mentorAvailability,
    mentorHours: data.mentorHours,
    professionalService: data.professionalService,
    professionalExperience: data.professionalExperience,
    professionalOpenToStartups: data.professionalOpenToStartups,
    professionalEngagement: data.professionalEngagement,
    communityReferral: data.communityReferral,
    dateOfBirth: data.dateOfBirth,
    nationality: data.nationality,
    residentialAddress: data.residentialAddress,
    kycIdType: data.kycIdType,
    kycIdNumber: data.kycIdNumber,
    nin: data.nin,
    bvn: data.bvn,
    pepConsent: data.pepConsent,
    sanctionsConsent: data.sanctionsConsent,
    investorAccreditationStatus: data.investorAccreditationStatus,
    investorAccreditationBasis: data.investorAccreditationBasis,
    investorAnnualIncomeRange: data.investorAnnualIncomeRange,
    investorNetWorthRange: data.investorNetWorthRange,
    businessRegistrationNumber: data.businessRegistrationNumber,
    businessTaxId: data.businessTaxId,
    businessAddress: data.businessAddress,
    representativeName: data.representativeName,
    representativeRole: data.representativeRole,
    representativeEmail: data.representativeEmail,
    directorsCount: data.directorsCount,
    beneficialOwnersCount: data.beneficialOwnersCount,
    agreedAge: data.agreedAge,
    agreedTerms: data.agreedTerms,
    agreedRisk: data.agreedRisk,
  };
}

const INITIAL: OBData = {
  intent: [], fullName: "", phone: "", country: "", city: "", bio: "", occupation: "", linkedinUrl: "", websiteUrl: "", roles: [],
  investorType: "", investorExperience: "", investorCapitalRange: "", investorMinTicket: "", investorMaxTicket: "", investorSectors: [], investorAccredited: "",
  businessName: "", businessIndustry: "", businessCountry: "", businessStage: "", businessRevenueRange: "", businessTeamSize: "", businessSeeking: [], businessCapitalNeeded: "",
  startupName: "", startupIndustry: "", startupStage: "", startupCofounderStatus: "", startupSeeking: [], mentorExpertise: [], mentorExperience: "", mentorIndustry: "", mentorAvailability: "", mentorHours: "",
  professionalService: "", professionalExperience: "", professionalOpenToStartups: true, professionalEngagement: "",
  communityInterests: [], communityReferral: "",
  dateOfBirth: "", nationality: "", residentialAddress: "", kycIdType: "", kycIdNumber: "", nin: "", bvn: "", pepConsent: false, sanctionsConsent: false,
  investorAccreditationStatus: "", investorAccreditationBasis: "", investorAnnualIncomeRange: "", investorNetWorthRange: "",
  businessRegistrationNumber: "", businessTaxId: "", businessAddress: "", representativeName: "", representativeRole: "", representativeEmail: "", directorsCount: "", beneficialOwnersCount: "",
  agreedAge: false, agreedTerms: false, agreedRisk: false,
};

function getTrackFromIntent(intents: string[]): OnboardingTrack {
  if (intents.includes("invest")) return "investor";
  if (intents.includes("business") || intents.includes("idea")) return "founder";
  return "community";
}

function getPrimaryIntent(intents: string[]) {
  return intents[0] ?? "community";
}

function getTrackRoleOptions(track: OnboardingTrack) {
  if (track === "investor") return ["investor", "professional", "community_member"] as AppRole[];
  if (track === "founder") return ["business_owner", "startup_builder", "professional", "community_member"] as AppRole[];
  return ["community_member", "startup_builder", "professional"] as AppRole[];
}

function getRoleTitle(role: AppRole) {
  return ROLES.find((item) => item.id === role)?.title ?? role;
}

function getPrimaryRole(roles: AppRole[], intents: string[]) {
  if (roles.length > 0) return roles[0];
  if (intents.includes("invest")) return "investor";
  if (intents.includes("business")) return "business_owner";
  if (intents.includes("idea")) return "startup_builder";
  return "community_member";
}

function Onboarding() {
  const navigate = useNavigate();
  const { user, loading, profile, refresh } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<OBData>(() => ({ ...INITIAL, fullName: typeof window !== "undefined" ? (user?.user_metadata?.full_name ?? "") : "" }));

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { data?: Partial<PersistedOnboardingDraft> };
      if (parsed?.data) setData((current) => ({ ...current, ...parsed.data }));
    } catch {
      window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    const nextFullName = user?.user_metadata?.full_name;
    if (typeof nextFullName === "string" && nextFullName.trim() && !data.fullName.trim()) {
      setData((current) => ({ ...current, fullName: nextFullName }));
    }
  }, [data.fullName, user?.user_metadata?.full_name]);

  useEffect(() => {
    try {
      window.localStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify({ data: buildOnboardingDraft(data) }));
    } catch {
      // Ignore storage write failures and keep the form working.
    }
  }, [data]);

  if (!loading && !user) throw redirect({ to: "/auth", search: { mode: "signin" } });
  if (!loading && profile?.onboarded) throw redirect({ to: "/home" });

  const set = <K extends keyof OBData>(key: K, value: OBData[K]) => setData((current) => ({ ...current, [key]: value }));
  const toggleChip = <K extends keyof OBData>(key: K, value: string) => setData((current) => ({ ...current, [key]: ((current[key] as string[]).includes(value) ? (current[key] as string[]).filter((item) => item !== value) : [...(current[key] as string[]), value]) }));
  const chooseIntent = (intent: string) => {
    setData((current) => ({
      ...current,
      intent: [intent],
    }));
  };
  const toggleRole = (role: AppRole) => setData((current) => ({ ...current, roles: current.roles.includes(role) ? current.roles.filter((item) => item !== role) : [...current.roles, role] }));

  const step1Valid = data.intent.length > 0;
  const primaryTrack = getTrackFromIntent(data.intent);
  const step2Valid = data.fullName.trim().length >= 2 && data.phone.trim().length >= 7 && data.country !== "";
  const requiresIndividualKyc = data.roles.includes("investor") || data.roles.includes("business_owner") || data.roles.includes("professional");
  const requiresBusinessKyb = data.roles.includes("business_owner");
  const requiresNigeriaIdentifier = data.country === "Nigeria" || data.nationality === "Nigeria";
  const hasNigeriaIdentifier = data.nin.trim().length > 0 || data.bvn.trim().length > 0;
  const individualKycValid = !requiresIndividualKyc || (
    data.dateOfBirth !== "" &&
    data.nationality !== "" &&
    data.residentialAddress.trim().length >= 10 &&
    data.kycIdType !== "" &&
    data.kycIdNumber.trim().length >= 5 &&
    data.pepConsent &&
    data.sanctionsConsent &&
    (!requiresNigeriaIdentifier || hasNigeriaIdentifier)
  );
  const investorSuitabilityValid = !data.roles.includes("investor") || (
    data.investorAccreditationStatus !== "" &&
    data.investorAccreditationBasis !== ""
  );
  const businessKybValid = !requiresBusinessKyb || (
    data.businessName.trim().length >= 2 &&
    data.businessCountry !== "" &&
    data.businessRegistrationNumber.trim().length >= 4 &&
    data.businessAddress.trim().length >= 10 &&
    data.representativeName.trim().length >= 2 &&
    data.representativeRole.trim().length >= 2 &&
    data.representativeEmail.trim().length >= 5
  );
  const step3Valid = data.roles.length > 0 && individualKycValid && investorSuitabilityValid && businessKybValid;
  const requiresRiskAgreement = data.roles.includes("investor") || data.roles.includes("business_owner");
  const step4Valid = data.agreedAge && data.agreedTerms && (!requiresRiskAgreement || data.agreedRisk);
  async function finish() {
    if (!user) return;
    setBusy(true);
    try {
            const roles =
        data.roles.length > 0
          ? data.roles
          : data.intent.includes("invest")
            ? (["investor"] as AppRole[])
            : data.intent.includes("business") || data.intent.includes("idea")
              ? (["business_owner"] as AppRole[])
              : (["community_member"] as AppRole[]);
      const metadata: Record<string, unknown> = {};
      if (roles.includes("investor")) metadata.investor = { type: data.investorType, experience: data.investorExperience, capitalRange: data.investorCapitalRange, minTicket: data.investorMinTicket, maxTicket: data.investorMaxTicket, sectors: data.investorSectors, accredited: data.investorAccredited };
      if (roles.includes("business_owner")) metadata.business = { name: data.businessName, industry: data.businessIndustry, country: data.businessCountry, stage: data.businessStage, revenueRange: data.businessRevenueRange, teamSize: data.businessTeamSize, seeking: data.businessSeeking, capitalNeeded: data.businessCapitalNeeded };
      if (roles.includes("startup_builder")) metadata.startup = { name: data.startupName, industry: data.startupIndustry, stage: data.startupStage, cofounderStatus: data.startupCofounderStatus, seeking: data.startupSeeking };
      if (roles.includes("professional")) metadata.professional = { service: data.professionalService, experience: data.professionalExperience, openToStartups: data.professionalOpenToStartups, engagement: data.professionalEngagement };
      if (roles.includes("community_member")) metadata.community = { interests: data.communityInterests, referral: data.communityReferral };
      metadata.compliance = buildComplianceMetadata(roles, {
        dateOfBirth: data.dateOfBirth,
        nationality: data.nationality,
        residentialAddress: data.residentialAddress,
        kycIdType: data.kycIdType,
        kycIdNumber: data.kycIdNumber,
        nin: data.nin,
        bvn: data.bvn,
        pepConsent: data.pepConsent,
        sanctionsConsent: data.sanctionsConsent,
        investorAccreditationStatus: data.investorAccreditationStatus,
        investorAccreditationBasis: data.investorAccreditationBasis,
        investorAnnualIncomeRange: data.investorAnnualIncomeRange,
        investorNetWorthRange: data.investorNetWorthRange,
        businessRegistrationNumber: data.businessRegistrationNumber,
        businessTaxId: data.businessTaxId,
        businessAddress: data.businessAddress,
        representativeName: data.representativeName,
        representativeRole: data.representativeRole,
        representativeEmail: data.representativeEmail,
        directorsCount: data.directorsCount,
        beneficialOwnersCount: data.beneficialOwnersCount,
      });

      const headlineMap: Record<string, string> = {
        investor: data.investorType ? data.investorType : "Investor",
        business_owner: data.businessName ? `Founder, ${data.businessName}` : "Business Owner",
        startup_builder: data.startupName ? `Startup Builder - ${data.startupName}` : "Startup Builder",
        mentor: "Mentor & Advisor",
        professional: data.professionalService || "Service Professional",
        community_member: "Community Member",
      };

      const payload = {
        full_name: data.fullName,
        bio: data.bio,
        location: [data.city, data.country].filter(Boolean).join(", "),
        occupation: data.occupation.trim() || headlineMap[roles[0]] || "CoFund Member",
        onboarded: true,
        phone: data.phone,
        country: data.country,
        city: data.city,
        website_url: data.websiteUrl,
        linkedin_url: data.linkedinUrl,
        metadata,
        agreed_terms: data.agreedTerms,
        onboarding_step: 4,
      };

      const { error: profileErr } = await supabase.from("profiles").update(payload).eq("id", user.id);
      if (profileErr) {
        const { error: fallbackErr } = await supabase.from("profiles").update({ full_name: payload.full_name, bio: payload.bio, location: payload.location, occupation: payload.occupation, onboarded: true }).eq("id", user.id);
        if (fallbackErr) throw fallbackErr;
      }

      const { error: rolesErr } = await supabase.from("user_roles").upsert(roles.map((role) => ({ user_id: user.id, role })), { onConflict: "user_id,role" });
      if (rolesErr) throw rolesErr;

      window.localStorage.removeItem(ONBOARDING_STORAGE_KEY);
      await refresh();
      toast.success("Welcome to CoFund!");
      navigate({ to: "/home" });
    } catch (error: any) {
      toast.error(error?.message ?? "Could not save profile");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/40 px-6 py-4"><div className="mx-auto flex max-w-4xl items-center justify-between"><Link to="/" className="flex items-center gap-2.5"><img src={logo} alt="CoFund" className="h-8 w-8 object-contain" /><span className="font-display text-lg font-bold">CoFund</span></Link><span className="text-sm text-muted-foreground">Step {step} of 4</span></div></div>
      <div className="h-1 bg-border/40"><div className="h-1 gradient-brand transition-all duration-500" style={{ width: `${(step / 4) * 100}%` }} /></div>
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
        {step === 1 && <StepIntent data={data} chooseIntent={chooseIntent} />}
        {step === 2 && <StepProfile data={data} set={set} track={primaryTrack} />}
        {step === 3 && <StepRoles data={data} track={primaryTrack} toggleRole={toggleRole} set={set} toggleChip={toggleChip} />}
        {step === 4 && <StepReview data={data} set={set} track={primaryTrack} />}
        <div className="mt-10 flex items-center justify-between">
          {step > 1 ? <button type="button" onClick={() => setStep((current) => (current - 1) as 1 | 2 | 3 | 4)} className="flex items-center gap-2 rounded-xl border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground"><ChevronLeft className="h-4 w-4" /> Back</button> : <div />}
          {step < 4 ? <button type="button" onClick={() => setStep((current) => (current + 1) as 1 | 2 | 3 | 4)} disabled={(step === 1 && !step1Valid) || (step === 2 && !step2Valid) || (step === 3 && !step3Valid)} className="gradient-brand flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-brand transition hover:opacity-90 disabled:opacity-40">Continue <ChevronRight className="h-4 w-4" /></button> : <button type="button" onClick={finish} disabled={!step4Valid || busy} className="gradient-brand flex items-center gap-2 rounded-xl px-8 py-3 text-sm font-semibold text-white shadow-brand transition hover:opacity-90 disabled:opacity-40">{busy ? "Setting up..." : "Complete my profile"}{!busy && <Check className="h-4 w-4" />}</button>}
        </div>
      </div>
    </div>
  );
}
function StepIntent({ data, chooseIntent }: { data: OBData; chooseIntent: (intent: string) => void }) {
  return <div><div className="mb-8"><p className="mb-1.5 text-sm font-semibold uppercase tracking-wider text-primary">Step 1 of 4</p><h1 className="font-display text-3xl font-extrabold sm:text-4xl">What is your primary path on CoFund?</h1><p className="mt-2 text-muted-foreground">Choose the main reason you are joining. You can add secondary roles in the next step.</p></div><div className="grid gap-3 sm:grid-cols-2">{INTENTS.map((intent) => { const active = data.intent.includes(intent.id); const Icon = intent.icon; return <button key={intent.id} type="button" onClick={() => chooseIntent(intent.id)} className={`rounded-2xl border p-5 text-left transition ${active ? "border-primary bg-primary/5 shadow-soft" : "border-border bg-card hover:border-primary/40"}`}><div className="flex items-start gap-3"><div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition ${active ? "gradient-brand text-white" : "bg-muted text-muted-foreground"}`}><Icon className="h-5 w-5" /></div><div className="min-w-0 flex-1"><p className="font-display text-lg font-bold">{intent.label}</p><p className="mt-2 text-sm text-muted-foreground">{intent.desc}</p></div></div></button>; })}</div></div>;
}

function StepProfile({ data, set, track }: { data: OBData; set: <K extends keyof OBData>(key: K, value: OBData[K]) => void; track: OnboardingTrack }) {
  const intro = track === "investor"
    ? "This is the profile behind your investor identity and future portfolio activity."
    : track === "founder"
      ? "This becomes the identity layer behind your founder, business, and funding journey."
      : "This creates your CoFund profile so you can browse, follow, contribute, and grow into other roles later. You can still add investor or business roles afterward.";
  return <div><div className="mb-8"><p className="mb-1.5 text-sm font-semibold uppercase tracking-wider text-primary">Step 2 of 4</p><h1 className="font-display text-3xl font-extrabold sm:text-4xl">Tell us about yourself</h1><p className="mt-2 text-muted-foreground">{intro}</p></div><div className="space-y-6"><div className="grid gap-4 sm:grid-cols-2"><Field label="Full name *" icon={<User className="h-4 w-4" />}><input type="text" value={data.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="e.g. Amara Okonkwo" className={inputCls} required /></Field><Field label="Phone number *" icon={<Phone className="h-4 w-4" />}><input type="tel" value={data.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+234 800 000 0000" className={inputCls} required /></Field></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Country *" icon={<MapPin className="h-4 w-4" />}><select value={data.country} onChange={(e) => set("country", e.target.value)} className={inputCls} required><option value="">Select country...</option><optgroup label="African Countries">{AFRICAN_COUNTRIES.map((country) => <option key={country} value={country}>{country}</option>)}</optgroup><optgroup label="Diaspora / Global">{DIASPORA_COUNTRIES.map((country) => <option key={country} value={country}>{country}</option>)}</optgroup></select></Field><Field label="City / State" icon={<MapPin className="h-4 w-4" />}><input type="text" value={data.city} onChange={(e) => set("city", e.target.value)} placeholder="e.g. Lagos, Abuja, Nairobi..." className={inputCls} /></Field></div><Field label="Professional headline" icon={<Briefcase className="h-4 w-4" />}><input type="text" value={data.occupation} onChange={(e) => set("occupation", e.target.value)} placeholder="e.g. Angel Investor | Founder | CFO" className={inputCls} maxLength={100} /></Field><Field label="About you (optional)" icon={<FileText className="h-4 w-4" />}><textarea value={data.bio} onChange={(e) => set("bio", e.target.value)} placeholder="Brief introduction - your background, interests, and what excites you about African business..." className={`${inputCls} min-h-[96px] resize-none`} maxLength={500} /><p className="mt-1.5 text-right text-xs text-muted-foreground">{data.bio.length}/500</p></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="LinkedIn URL (optional)" icon={<Link2 className="h-4 w-4" />}><input type="url" value={data.linkedinUrl} onChange={(e) => set("linkedinUrl", e.target.value)} placeholder="https://linkedin.com/in/yourname" className={inputCls} /></Field><Field label="Website / Portfolio (optional)" icon={<Link2 className="h-4 w-4" />}><input type="url" value={data.websiteUrl} onChange={(e) => set("websiteUrl", e.target.value)} placeholder="https://yourwebsite.com" className={inputCls} /></Field></div></div></div>;
}
function StepRoles({ data, track, toggleRole, set, toggleChip }: { data: OBData; track: OnboardingTrack; toggleRole: (role: AppRole) => void; set: <K extends keyof OBData>(key: K, value: OBData[K]) => void; toggleChip: <K extends keyof OBData>(key: K, value: string) => void }) {
  const needsCompliance = data.roles.includes("investor") || data.roles.includes("business_owner") || data.roles.includes("professional");
  const needsInvestorChecks = data.roles.includes("investor");
  const needsBusinessChecks = data.roles.includes("business_owner");
  const trackRoles = getTrackRoleOptions(track);
  const primaryIntent = getPrimaryIntent(data.intent);
  const trackTitle = track === "investor" ? "Investor verification track" : track === "founder" ? "Founder and business track" : "Community and growth track";
  const trackDescription =
    track === "investor"
      ? "This path focuses on investor identity, suitability, and readiness to fund opportunities."
      : track === "founder"
        ? "This path focuses on founder identity, business verification, and the information needed before funding applications."
        : "This path keeps things lighter: community access first, with optional upgrades into startup, professional, or investor roles later.";

  const introCopy =
    track === "investor"
      ? "This step adds the roles tied to your investor journey. You can still add professional or community roles later, but investing stays behind verification and suitability checks."
      : track === "founder"
        ? primaryIntent === "business"
          ? "This step starts with your business owner profile. You still have one CoFund account; the flow just prioritizes business and funding data first."
          : "This step starts with your startup builder profile. You still have one CoFund account; the flow just prioritizes startup and funding data first."
        : "This step adds the roles tied to your community journey. You can browse, follow, save, and contribute first, then expand into investing or business roles later without creating a new account.";

  return (
    <div>
      <div className="mb-8">
        <p className="mb-1.5 text-sm font-semibold uppercase tracking-wider text-primary">Step 3 of 4</p>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Add your roles</h1>
        <p className="mt-2 text-muted-foreground">{trackDescription}</p>
      </div>
      <div className="mb-6 space-y-4">
        <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 text-sm text-muted-foreground">{introCopy}</div>
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm text-muted-foreground">
          Mentorship on CoFund is application-based. Once you have been active on the platform for 6+ months, completed meaningful investments, and can show proof of expertise, you can apply from your profile and wait for admin approval.
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {ROLES.filter((role) => trackRoles.includes(role.id))
          .sort((a, b) => {
            if (track !== "founder") return 0;
            if (primaryIntent === "business") {
              if (a.id === "business_owner") return -1;
              if (b.id === "business_owner") return 1;
              if (a.id === "startup_builder") return 1;
              if (b.id === "startup_builder") return -1;
            }
            if (primaryIntent === "idea") {
              if (a.id === "startup_builder") return -1;
              if (b.id === "startup_builder") return 1;
              if (a.id === "business_owner") return 1;
              if (b.id === "business_owner") return -1;
            }
            return 0;
          })
          .map((role) => {
          const active = data.roles.includes(role.id);
          const Icon = role.icon;
          return (
            <button
              key={role.id}
              type="button"
              onClick={() => toggleRole(role.id)}
              className={`rounded-2xl border p-5 text-left transition ${active ? "border-primary bg-primary/5 shadow-soft" : "border-border bg-card hover:border-primary/40"}`}
            >
              <div className="flex items-start gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${active ? "gradient-brand text-white" : "bg-muted text-muted-foreground"}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-base font-bold">{role.title}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{role.desc}</p>
                </div>
                <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition ${active ? "border-primary bg-primary" : "border-border"}`}>
                  {active && <Check className="h-3 w-3 text-white" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-8 space-y-8">
        {needsCompliance && (
          <Panel icon={<ShieldCheck className="h-5 w-5" />} title="Identity verification readiness">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">Verification is handled internally by CoFund operations.</div>
                <Field label="Date of birth">
                  <input type="date" value={data.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} className={inputCls} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField label="Nationality" value={data.nationality} onChange={(value) => set("nationality", value)} options={ALL_COUNTRIES} />
                <Field label="Residential address">
                  <input type="text" value={data.residentialAddress} onChange={(e) => set("residentialAddress", e.target.value)} placeholder="Full residential address" className={inputCls} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField label="Primary ID document" value={data.kycIdType} onChange={(value) => set("kycIdType", value)} options={[...ID_DOCUMENT_OPTIONS]} />
                <Field label="ID number">
                  <input type="text" value={data.kycIdNumber} onChange={(e) => set("kycIdNumber", e.target.value)} placeholder="Document or national ID number" className={inputCls} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="NIN (Nigeria, if available)">
                  <input type="text" value={data.nin} onChange={(e) => set("nin", e.target.value)} placeholder="National Identification Number" className={inputCls} />
                </Field>
                <Field label="BVN (Nigeria, if available)">
                  <input type="text" value={data.bvn} onChange={(e) => set("bvn", e.target.value)} placeholder="Bank Verification Number" className={inputCls} />
                </Field>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <AgreementBox checked={data.pepConsent} onChange={(value) => set("pepConsent", value)} label="I consent to PEP and politically exposed person screening as part of onboarding." required />
                <AgreementBox checked={data.sanctionsConsent} onChange={(value) => set("sanctionsConsent", value)} label="I consent to sanctions, watchlist, and AML screening checks." required />
              </div>
            </div>
          </Panel>
        )}
        {needsInvestorChecks && (
          <Panel icon={<TrendingUp className="h-5 w-5" />} title="Investor details">
            <div className="space-y-4">
              <SelectField label="Investor type" value={data.investorType} onChange={(value) => set("investorType", value)} options={["Individual investor", "Family office", "Fund / VC", "Corporate investor"]} />
              <SelectField label="Investment experience" value={data.investorExperience} onChange={(value) => set("investorExperience", value)} options={["Less than 1 year", "1-3 years", "3-5 years", "5-10 years", "10+ years"]} />
              <SelectField label="Accreditation status" value={data.investorAccreditationStatus} onChange={(value) => set("investorAccreditationStatus", value)} options={[...ACCREDITATION_STATUS_OPTIONS]} />
              <SelectField label="Accreditation basis" value={data.investorAccreditationBasis} onChange={(value) => set("investorAccreditationBasis", value)} options={[...ACCREDITATION_BASIS_OPTIONS]} />
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField label="Annual income range" value={data.investorAnnualIncomeRange} onChange={(value) => set("investorAnnualIncomeRange", value)} options={[...ANNUAL_INCOME_OPTIONS]} />
                <SelectField label="Net worth range" value={data.investorNetWorthRange} onChange={(value) => set("investorNetWorthRange", value)} options={[...NET_WORTH_OPTIONS]} />
              </div>
              <SelectField label="Total investable capital" value={data.investorCapitalRange} onChange={(value) => set("investorCapitalRange", value)} options={CAPITAL_RANGES} />
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField label="Minimum ticket" value={data.investorMinTicket} onChange={(value) => set("investorMinTicket", value)} options={TICKET_SIZES} />
                <SelectField label="Maximum ticket" value={data.investorMaxTicket} onChange={(value) => set("investorMaxTicket", value)} options={TICKET_SIZES} />
              </div>
              <ChipField label="Sectors of interest" options={SECTORS} selected={data.investorSectors} toggle={(value) => toggleChip("investorSectors", value)} />
            </div>
          </Panel>
        )}
        {needsBusinessChecks && (
          <Panel icon={<Building2 className="h-5 w-5" />} title="Business verification details">
            <div className="space-y-4">
              <Field label="Business name">
                <input type="text" value={data.businessName} onChange={(e) => set("businessName", e.target.value)} placeholder="e.g. Agroflow Ltd" className={inputCls} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField label="Industry / Sector" value={data.businessIndustry} onChange={(value) => set("businessIndustry", value)} options={SECTORS} />
                <SelectField label="Country of operation" value={data.businessCountry} onChange={(value) => set("businessCountry", value)} options={ALL_COUNTRIES} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Registration number">
                  <input type="text" value={data.businessRegistrationNumber} onChange={(e) => set("businessRegistrationNumber", e.target.value)} placeholder="CAC / company registration number" className={inputCls} />
                </Field>
                <Field label="Tax ID / TIN">
                  <input type="text" value={data.businessTaxId} onChange={(e) => set("businessTaxId", e.target.value)} placeholder="Business tax number" className={inputCls} />
                </Field>
              </div>
              <Field label="Registered business address">
                <input type="text" value={data.businessAddress} onChange={(e) => set("businessAddress", e.target.value)} placeholder="Registered operating address" className={inputCls} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Authorized representative">
                  <input type="text" value={data.representativeName} onChange={(e) => set("representativeName", e.target.value)} placeholder="Founder or compliance contact" className={inputCls} />
                </Field>
                <Field label="Representative role">
                  <input type="text" value={data.representativeRole} onChange={(e) => set("representativeRole", e.target.value)} placeholder="CEO, Founder, Compliance Officer..." className={inputCls} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Representative email">
                  <input type="email" value={data.representativeEmail} onChange={(e) => set("representativeEmail", e.target.value)} placeholder="compliance@business.com" className={inputCls} />
                </Field>
                <Field label="Directors count">
                  <input type="text" value={data.directorsCount} onChange={(e) => set("directorsCount", e.target.value)} placeholder="e.g. 2" className={inputCls} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Beneficial owners count">
                  <input type="text" value={data.beneficialOwnersCount} onChange={(e) => set("beneficialOwnersCount", e.target.value)} placeholder="e.g. 3" className={inputCls} />
                </Field>
                <SelectField label="Business stage" value={data.businessStage} onChange={(value) => set("businessStage", value)} options={BUSINESS_STAGES} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField label="Annual revenue" value={data.businessRevenueRange} onChange={(value) => set("businessRevenueRange", value)} options={REVENUE_RANGES} />
                <SelectField label="Team size" value={data.businessTeamSize} onChange={(value) => set("businessTeamSize", value)} options={TEAM_SIZES} />
              </div>
              <SelectField label="Capital you're seeking (optional)" value={data.businessCapitalNeeded} onChange={(value) => set("businessCapitalNeeded", value)} options={BUSINESS_CAPITAL} />
              <ChipField label="What are you looking for?" options={SEEKING_OPTIONS} selected={data.businessSeeking} toggle={(value) => toggleChip("businessSeeking", value)} />
            </div>
          </Panel>
        )}
        {data.roles.includes("startup_builder") && (
          <Panel icon={<Rocket className="h-5 w-5" />} title="Startup details">
            <div className="space-y-4">
              <Field label="Startup / idea name">
                <input type="text" value={data.startupName} onChange={(e) => set("startupName", e.target.value)} placeholder="Leave blank if not named yet" className={inputCls} />
              </Field>
              <SelectField label="Industry / Domain" value={data.startupIndustry} onChange={(value) => set("startupIndustry", value)} options={SECTORS} />
              <SelectField label="Current stage" value={data.startupStage} onChange={(value) => set("startupStage", value)} options={STARTUP_STAGES} />
              <SelectField label="Co-founder status" value={data.startupCofounderStatus} onChange={(value) => set("startupCofounderStatus", value)} options={COFOUND_STATUS} />
              <ChipField label="What do you need from CoFund?" options={SEEKING_OPTIONS} selected={data.startupSeeking} toggle={(value) => toggleChip("startupSeeking", value)} />
            </div>
          </Panel>
        )}
        {data.roles.includes("professional") && (
          <Panel icon={<Wrench className="h-5 w-5" />} title="Professional services">
            <div className="space-y-4">
              <SelectField label="Primary service type" value={data.professionalService} onChange={(value) => set("professionalService", value)} options={PROFESSIONAL_SERVICES} />
              <div className="grid gap-4 sm:grid-cols-2">
                <SelectField label="Years of experience" value={data.professionalExperience} onChange={(value) => set("professionalExperience", value)} options={EXPERIENCE_YEARS} />
                <SelectField label="Preferred engagement" value={data.professionalEngagement} onChange={(value) => set("professionalEngagement", value)} options={ENGAGEMENT_TYPES} />
              </div>
            </div>
          </Panel>
        )}
        {data.roles.includes("community_member") && (
          <Panel icon={<Users className="h-5 w-5" />} title="Community interests">
            <div className="space-y-4">
              <ChipField label="Topics you're interested in" options={COMMUNITY_INTERESTS} selected={data.communityInterests} toggle={(value) => toggleChip("communityInterests", value)} />
              <SelectField label="How did you hear about CoFund?" value={data.communityReferral} onChange={(value) => set("communityReferral", value)} options={REFERRAL_SOURCES} />
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}
function StepReview({ data, set, track }: { data: OBData; set: <K extends keyof OBData>(key: K, value: OBData[K]) => void; track: OnboardingTrack }) {
  const hasInvestorRole = data.roles.includes("investor") || data.roles.includes("business_owner");
  const reviewCopy = track === "investor" ? "Review your investor profile, verification choices, and suitability details before finishing setup." : track === "founder" ? "Review your founder profile and business verification details before finishing setup." : "Review your community profile now. You can still unlock investor or business features later after verification.";
  return <div><div className="mb-8"><p className="mb-1.5 text-sm font-semibold uppercase tracking-wider text-primary">Step 4 of 4</p><h1 className="font-display text-3xl font-extrabold sm:text-4xl">Almost there</h1><p className="mt-2 text-muted-foreground">{reviewCopy}</p></div><div className="mb-8 rounded-2xl border border-border bg-card p-6"><h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your profile summary</h3><div className="space-y-3"><SummaryRow label="Name" value={data.fullName} /><SummaryRow label="Location" value={[data.city, data.country].filter(Boolean).join(", ")} /><SummaryRow label="Phone" value={data.phone} /><SummaryRow label="Headline" value={data.occupation} /><div className="flex items-start gap-3 text-sm"><span className="w-20 shrink-0 text-muted-foreground">Roles</span><div className="space-y-2"><div className="flex flex-wrap gap-2">{(() => { const primaryRole = getPrimaryRole(data.roles, data.intent); const secondaryRoles = data.roles.filter((role) => role !== primaryRole); return <><span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">Primary role: {getRoleTitle(primaryRole)}</span>{secondaryRoles.length > 0 && <span className="ml-1 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">Secondary roles</span>}</>; })()}</div>{data.roles.length > 0 && <div className="flex flex-wrap gap-2">{data.roles.filter((role, index, array) => role !== getPrimaryRole(data.roles, data.intent)).map((role) => <span key={role} className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground">{getRoleTitle(role)}</span>)}</div>}</div></div><SummaryRow label="LinkedIn" value={data.linkedinUrl} /><SummaryRow label="Verification" value="Managed by CoFund operations" />{data.dateOfBirth && <SummaryRow label="KYC" value={`${data.kycIdType || "ID"} ready for review`} />}{data.businessRegistrationNumber && <SummaryRow label="KYB" value={`Registration ${data.businessRegistrationNumber}`} />}</div></div><div className="space-y-4"><h3 className="font-display text-base font-bold">Before you continue</h3><AgreementBox checked={data.agreedAge} onChange={(value) => set("agreedAge", value)} label="I confirm I am 18 years of age or older." required /><AgreementBox checked={data.agreedTerms} onChange={(value) => set("agreedTerms", value)} label={<><a href="/terms" target="_blank" className="text-primary underline underline-offset-2">Terms of Use</a> and <a href="/privacy" target="_blank" className="text-primary underline underline-offset-2">Privacy Policy</a>.</>} required />{hasInvestorRole && <AgreementBox checked={data.agreedRisk} onChange={(value) => set("agreedRisk", value)} label="I understand that investing in private businesses involves significant risk, including the potential loss of all invested capital." />}<div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" /><p className="text-sm text-muted-foreground">CoFund is a private investment platform. All businesses are independently verified, but investments are not insured. Only invest what you can afford to lose.</p></div></div></div>;
}

function Field({ label, icon, children }: { label: string; icon?: ReactNode; children: ReactNode }) { return <label className="block"><span className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground">{icon ? <span className="text-muted-foreground">{icon}</span> : null}{label}</span>{children}</label>; }
function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: string[] }) { return <label className="block"><span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span><select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}><option value="">Select...</option>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>; }
function OptionSelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (value: string) => void; options: { value: string; label: string }[] }) { return <label className="block"><span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span><select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}><option value="">Select...</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>; }
function ChipField({ label, options, selected, toggle }: { label: string; options: string[]; selected: string[]; toggle: (value: string) => void }) { return <div><label className="mb-1.5 block text-sm font-medium text-foreground">{label}</label><div className="mt-2 flex flex-wrap gap-2">{options.map((option) => { const active = selected.includes(option); return <button key={option} type="button" onClick={() => toggle(option)} className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}>{option}</button>; })}</div></div>; }
function Panel({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) { return <div className="rounded-2xl border border-border bg-card/40 p-6"><div className="mb-5 flex items-center gap-2.5"><div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-brand text-white">{icon}</div><h2 className="font-display text-lg font-bold">{title}</h2></div>{children}</div>; }
function SummaryRow({ label, value }: { label: string; value: string }) { if (!value) return null; return <div className="flex items-start gap-3 text-sm"><span className="w-20 shrink-0 text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>; }
function AgreementBox({ checked, onChange, label, required }: { checked: boolean; onChange: (value: boolean) => void; label: ReactNode; required?: boolean }) { return <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${checked ? "border-primary/40 bg-primary/5" : "border-border"}`}><button type="button" onClick={() => onChange(!checked)} className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition ${checked ? "border-primary bg-primary" : "border-border"}`}>{checked && <Check className="h-3 w-3 text-white" />}</button><span className="text-sm leading-relaxed text-muted-foreground">{label}{required && <span className="ml-1 text-primary">*</span>}</span></label>; }

const inputCls = "w-full rounded-xl border border-border bg-card/60 px-3.5 py-2.5 text-sm outline-none transition placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/20";


