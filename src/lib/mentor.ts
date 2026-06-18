import type { AppRole, Profile } from "@/hooks/use-auth";

export const MENTOR_REQUIREMENTS = {
  minimumTenureDays: 180,
  maximumDormantDays: 90,
  minimumInvestmentCount: 3,
  minimumTotalInvestedAmount: 500000,
} as const;

export type MentorEligibilityCheck = {
  label: string;
  done: boolean;
  detail: string;
};

export type MentorEligibilitySnapshot = {
  canApply: boolean;
  isAlreadyApplied: boolean;
  isApproved: boolean;
  memberSince: string | null;
  lastActiveAt: string | null;
  dormantDays: number | null;
  investmentCount: number;
  totalInvestedAmount: number;
  checklist: MentorEligibilityCheck[];
};

export function buildMentorEligibility(input: {
  profile: Profile | null;
  roles: AppRole[];
  userCreatedAt?: string | null;
  lastActiveAt?: string | null;
  investmentCount?: number;
  totalInvestedAmount?: number;
  applicationStatus?: string | null;
}) {
  const memberSince = parseDate(input.profile?.created_at ?? input.userCreatedAt ?? null);
  const now = new Date();
  const lastActiveAt = parseDate(input.lastActiveAt ?? null);
  const lastActiveTimestamp = lastActiveAt?.getTime() ?? 0;
  const memberSinceTimestamp = memberSince?.getTime() ?? 0;
  const tenureDays = memberSinceTimestamp > 0 ? Math.floor((now.getTime() - memberSinceTimestamp) / 86_400_000) : 0;
  const dormantDays = lastActiveTimestamp > 0 ? Math.floor((now.getTime() - lastActiveTimestamp) / 86_400_000) : null;
  const investmentCount = input.investmentCount ?? 0;
  const totalInvestedAmount = input.totalInvestedAmount ?? 0;
  const isInvestor = input.roles.includes("investor");
  const status = String(input.applicationStatus ?? "");
  const isAlreadyApplied = ["draft", "pending_review", "needs_action"].includes(status);
  const isApproved = status === "approved" || input.roles.includes("mentor");

  const checklist: MentorEligibilityCheck[] = [
    {
      label: "Investor role active",
      done: isInvestor,
      detail: isInvestor ? "Investor role detected on your account." : "You need to be an investor on CoFund before applying.",
    },
    {
      label: "Member for 6+ months",
      done: tenureDays >= MENTOR_REQUIREMENTS.minimumTenureDays,
      detail:
        memberSinceTimestamp > 0
          ? `Joined ${tenureDays} days ago.`
          : "We could not read your join date yet.",
    },
    {
      label: "Recently active",
      done: dormantDays !== null && dormantDays <= MENTOR_REQUIREMENTS.maximumDormantDays,
      detail:
        dormantDays !== null
          ? `Last active ${dormantDays} days ago.`
          : "We need a recent activity signal before you can apply.",
    },
    {
      label: "Meaningful investing history",
      done:
        investmentCount >= MENTOR_REQUIREMENTS.minimumInvestmentCount &&
        totalInvestedAmount >= MENTOR_REQUIREMENTS.minimumTotalInvestedAmount,
      detail: `You currently have ${investmentCount} investments totaling ${formatCurrency(totalInvestedAmount)}.`,
    },
    {
      label: "Proof of expertise ready",
      done: true,
      detail: "You will upload qualification and experience proof in the application form.",
    },
  ];

  return {
    canApply: checklist.slice(0, 4).every((item) => item.done) && !isAlreadyApplied && !isApproved,
    isAlreadyApplied,
    isApproved,
    memberSince: memberSince?.toISOString() ?? null,
    lastActiveAt: lastActiveAt?.toISOString() ?? null,
    dormantDays,
    investmentCount,
    totalInvestedAmount,
    checklist,
  } satisfies MentorEligibilitySnapshot;
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function parseDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
