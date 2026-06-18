import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PlatformStats = {
  investorCount: number | null;
  verifiedBusinessCount: number | null;
  avgTargetReturn: number | null;
  capitalDeployed: number | null;
};

async function fetchPlatformStats(): Promise<PlatformStats> {
  const db = supabase as any;

  const [investors, businesses, opportunities] = await Promise.allSettled([
    db
      .from("user_roles")
      .select("user_id", { count: "exact", head: true })
      .eq("role", "investor"),
    db
      .from("businesses")
      .select("id", { count: "exact", head: true })
      .eq("verified", true),
    db
      .from("opportunities")
      .select("target_return_pct, raised_amount")
      .in("status", ["open", "active", "funded", "closed"]),
  ]);

  const investorCount =
    investors.status === "fulfilled" && investors.value.error === null
      ? (investors.value.count as number)
      : null;

  const verifiedBusinessCount =
    businesses.status === "fulfilled" && businesses.value.error === null
      ? (businesses.value.count as number)
      : null;

  let avgTargetReturn: number | null = null;
  let capitalDeployed: number | null = null;

  if (opportunities.status === "fulfilled" && !opportunities.value.error) {
    const rows: { target_return_pct: number | null; raised_amount: number | null }[] =
      opportunities.value.data ?? [];

    const returns = rows.map((r) => r.target_return_pct).filter((v): v is number => v != null);
    if (returns.length > 0) {
      avgTargetReturn = Math.round(returns.reduce((a, b) => a + b, 0) / returns.length);
    }

    const raised = rows.map((r) => r.raised_amount).filter((v): v is number => v != null);
    capitalDeployed = raised.reduce((a, b) => a + b, 0);
  }

  return { investorCount, verifiedBusinessCount, avgTargetReturn, capitalDeployed };
}

export function usePlatformStats() {
  return useQuery<PlatformStats>({
    queryKey: ["platform-stats"],
    queryFn: fetchPlatformStats,
    staleTime: 1000 * 60 * 10,
  });
}

export function fmtInvestors(n: number | null): string {
  if (n === null) return "—";
  if (n >= 10_000) return `${Math.floor(n / 1_000)}K+`;
  if (n >= 1_000) return `${Math.floor(n / 100) * 100}+`;
  return `${n}`;
}

export function fmtBusinesses(n: number | null): string {
  if (n === null) return "—";
  if (n >= 1_000) return `${Math.floor(n / 100) * 100}+`;
  if (n >= 10) return `${Math.floor(n / 10) * 10}+`;
  return `${n}`;
}

export function fmtReturn(n: number | null): string {
  if (n === null) return "—";
  return `${n}% p.a.`;
}

export function fmtCapital(n: number | null): string {
  if (n === null) return "—";
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B+`;
  if (n >= 1_000_000) return `₦${Math.floor(n / 1_000_000)}M+`;
  if (n >= 1_000) return `₦${Math.floor(n / 1_000)}K+`;
  return `₦${n}`;
}
