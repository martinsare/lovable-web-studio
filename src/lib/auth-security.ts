import type { User } from "@supabase/supabase-js";
import type { AppRole, Profile } from "@/hooks/use-auth";

export type AssuranceLevel = "aal1" | "aal2" | "unknown";

export type SecuritySnapshot = {
  emailVerified: boolean;
  assuranceLevel: AssuranceLevel;
  nextAssuranceLevel: AssuranceLevel;
  verifiedFactors: number;
  recommendedActions: string[];
  canAccessFundingActions: boolean;
};

function normalizeAal(value: string | null | undefined): AssuranceLevel {
  if (value === "aal1" || value === "aal2") return value;
  return "unknown";
}

export function buildSecuritySnapshot(input: {
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
  currentLevel?: string | null;
  nextLevel?: string | null;
  verifiedFactors?: number;
}) {
  const emailVerified = Boolean(input.user?.email_confirmed_at);
  const assuranceLevel = normalizeAal(input.currentLevel);
  const nextAssuranceLevel = normalizeAal(input.nextLevel);
  const verifiedFactors = input.verifiedFactors ?? 0;
  const wantsFundingAccess =
    input.roles.includes("investor") || input.roles.includes("business_owner");
  const complianceStatus = readComplianceStatus(input.profile);

  const recommendedActions: string[] = [];
  if (!emailVerified) recommendedActions.push("Verify your email address");
  if (verifiedFactors === 0) recommendedActions.push("Enroll a second factor for MFA");
  if (wantsFundingAccess && complianceStatus !== "approved") {
    recommendedActions.push("Complete KYC/KYB review before moving funds");
  }

  return {
    emailVerified,
    assuranceLevel,
    nextAssuranceLevel,
    verifiedFactors,
    recommendedActions,
    canAccessFundingActions:
      emailVerified &&
      assuranceLevel === "aal2" &&
      (!wantsFundingAccess || complianceStatus === "approved"),
  } satisfies SecuritySnapshot;
}

export function readComplianceStatus(profile: Profile | null) {
  const metadata = profile?.metadata;
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return "not_started";
  const compliance = (metadata as Record<string, unknown>).compliance;
  if (!compliance || typeof compliance !== "object" || Array.isArray(compliance)) return "not_started";
  const status = (compliance as Record<string, unknown>).status;
  return typeof status === "string" ? status : "not_started";
}
