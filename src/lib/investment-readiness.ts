import type { AppRole, Profile } from "@/hooks/use-auth";
import type { SecuritySnapshot } from "@/lib/auth-security";

export type FundingRail = {
  id: string;
  label: string;
  status: "available" | "setup_required" | "disabled";
  note: string;
};

export type InvestmentReadiness = {
  canInvestNow: boolean;
  checklist: { label: string; done: boolean }[];
  fundingRails: FundingRail[];
};

export function buildInvestmentReadiness(input: {
  profile: Profile | null;
  roles: AppRole[];
  security: SecuritySnapshot | null;
}) {
  const metadata = input.profile?.metadata;
  const compliance = readCompliance(metadata);
  const isInvestor = input.roles.includes("investor");
  const isBusinessOwner = input.roles.includes("business_owner");
  const security = input.security;
  const suitabilityOutcome = String(compliance.suitability?.outcome ?? "");

  const checklist = [
    { label: "Profile onboarding completed", done: Boolean(input.profile?.onboarded) },
    { label: "Email verified", done: Boolean(security?.emailVerified) },
    { label: "MFA enabled", done: (security?.verifiedFactors ?? 0) > 0 && security?.assuranceLevel === "aal2" },
    {
      label: "Identity verification approved",
      done: !isInvestor && !isBusinessOwner ? true : compliance.status === "approved",
    },
    {
      label: "Accreditation or suitability reviewed",
      done:
        !isInvestor ||
        suitabilityOutcome === "passed" ||
        suitabilityOutcome === "needs_review" ||
        Boolean(compliance.investorSuitability?.accreditationStatus),
    },
    {
      label: "Business verification approved",
      done: !isBusinessOwner || Boolean(compliance.businessKyb?.registrationNumber),
    },
  ];

  const fundingRails: FundingRail[] = [
    {
      id: "bank_transfer",
      label: "Bank transfer",
      status: security?.canAccessFundingActions ? "available" : "setup_required",
      note: "Best default for larger tickets and escrow funding.",
    },
    {
      id: "card",
      label: "Debit card",
      status: security?.emailVerified ? "setup_required" : "disabled",
      note: "Useful for smaller commitments once processor and 3DS are connected.",
    },
    {
      id: "wallet_balance",
      label: "Wallet / cash balance",
      status: compliance.status === "approved" ? "setup_required" : "disabled",
      note: "Allows deposits, refunds, and escrow releases after compliance approval.",
    },
    {
      id: "wire",
      label: "Domestic or international wire",
      status: security?.canAccessFundingActions ? "available" : "setup_required",
      note: "Good for entity investors and higher-value placements.",
    },
  ];

  return {
    canInvestNow: checklist.every((item) => item.done) && Boolean(security?.canAccessFundingActions),
    checklist,
    fundingRails,
  } satisfies InvestmentReadiness;
}

function readCompliance(metadata: Profile["metadata"]) {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return { status: "not_started" } as Record<string, any>;
  }
  const compliance = (metadata as Record<string, unknown>).compliance;
  if (!compliance || typeof compliance !== "object" || Array.isArray(compliance)) {
    return { status: "not_started" } as Record<string, any>;
  }
  return compliance as Record<string, any>;
}
