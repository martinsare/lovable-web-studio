import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowUpRight,
  CreditCard,
  ExternalLink,
  Landmark,
  PiggyBank,
  RadioTower,
  ShieldCheck,
  TrendingUp,
  Wallet,
  BarChart3,
  CheckCircle2,
  Circle,
  ChevronRight,
  FileText,
  ArrowDownLeft,
  RotateCcw,
} from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { EmptyPortfolioIllustration } from "@/components/animated-illustration";
import { useAuth } from "@/hooks/use-auth";
import { useSecurity } from "@/hooks/use-security";
import { buildInvestmentReadiness } from "@/lib/investment-readiness";
import { getInvestmentWorkflow } from "@/lib/investment-workflow";
import { supabase } from "@/integrations/supabase/client";
import { getDocumentSignedUrl } from "@/lib/document-storage";
import { formatMoney, getRailLabel } from "@/lib/investment-checkout";

export const Route = createFileRoute("/_authenticated/portfolio")({
  head: () => ({ meta: [{ title: "Portfolio · CoFund" }] }),
  component: PortfolioPage,
});

const railIcons = {
  bank_transfer: Landmark,
  card: CreditCard,
  wallet_balance: Wallet,
  wire: RadioTower,
} as const;

type DocTab = "statements" | "payouts" | "refunds";

function PortfolioPage() {
  const { user, profile, roles } = useAuth();
  const { security } = useSecurity();
  const readiness = buildInvestmentReadiness({ profile, roles, security });
  const workflow = getInvestmentWorkflow();
  const [docTab, setDocTab] = useState<DocTab>("statements");
  const [notice, setNotice] = useState<{ tone: "success" | "error"; title: string; message: string } | null>(null);

  const { data: commitments = [] } = useQuery({
    enabled: !!user?.id,
    queryKey: ["portfolio", "commitments", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("investment_commitments")
        .select("id,amount,currency,rail,status,escrow_reference,created_at")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const { data: statements = [] } = useQuery({
    enabled: !!user?.id,
    queryKey: ["portfolio", "statements", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("investor_statements")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const { data: payouts = [] } = useQuery({
    enabled: !!user?.id,
    queryKey: ["portfolio", "payouts", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("payout_events")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const { data: refunds = [] } = useQuery({
    enabled: !!user?.id,
    queryKey: ["portfolio", "refunds", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("refund_events")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  async function openStatement(statement: any) {
    try {
      const directUrl =
        typeof statement.file_url === "string" && /^https?:\/\//.test(statement.file_url)
          ? statement.file_url
          : null;
      const signedUrl =
        statement.storage_bucket && statement.storage_path
          ? await getDocumentSignedUrl(
              statement.storage_bucket,
              statement.storage_path,
              statement.original_filename ?? statement.title,
            )
          : directUrl;
      if (!signedUrl) throw new Error("Statement file not available yet.");
      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } catch (error: any) {
      setNotice({ tone: "error", title: "Open failed", message: error?.message ?? "Unable to open that statement." });
    }
  }

  const totalInvested = commitments
    .filter((c) => ["funded", "in_escrow", "released", "active"].includes(c.status))
    .reduce((sum: number, c: any) => sum + Number(c.amount ?? 0), 0);
  const totalReturns = payouts.reduce((sum: number, p: any) => sum + Number(p.amount ?? 0), 0);
  const activePositions = commitments.filter((c) => c.status === "active").length;

  const docCounts = {
    statements: statements.length,
    payouts: payouts.length,
    refunds: refunds.length,
  };

  return (
    <AppLayout>
      <div className="min-h-full bg-background pb-16">
        {notice && (
          <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 lg:px-8">
            <Alert variant={notice.tone === "error" ? "destructive" : "default"}>
              <AlertTitle>{notice.title}</AlertTitle>
              <AlertDescription>{notice.message}</AlertDescription>
            </Alert>
          </div>
        )}
        <div className="relative overflow-hidden border-b border-border/40">
          <div className="absolute inset-0 gradient-hero opacity-70" />
          <div className="relative mx-auto max-w-6xl px-4 pt-8 pb-0 sm:px-6 lg:px-8">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                  Total deployed
                </p>
                <p className="mt-2 font-display text-5xl font-bold tracking-tight sm:text-6xl">
                  {totalInvested > 0 ? formatMoney(totalInvested) : "₦0"}
                </p>
                {totalInvested === 0 && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Start investing to see your portfolio grow here.
                  </p>
                )}
              </div>
              <Link
                to="/browse"
                className="hidden sm:inline-flex shrink-0 items-center gap-1.5 rounded-xl gradient-brand px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-brand transition hover:opacity-90 mt-1"
              >
                Find deals <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-10 grid grid-cols-3 border-t border-border divide-x divide-border">
              {[
                {
                  label: "Returns paid",
                  value: totalReturns > 0 ? formatMoney(totalReturns) : "₦0",
                  icon: PiggyBank,
                  color: "text-brand-green",
                },
                {
                  label: "Active positions",
                  value: String(activePositions),
                  icon: TrendingUp,
                  color: "text-primary",
                },
                {
                  label: "Avg. target return",
                  value: "—",
                  icon: BarChart3,
                  color: "text-gold",
                },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="flex items-center gap-3 px-5 py-4 first:pl-0">
                  <Icon className={`h-4 w-4 shrink-0 ${color} opacity-70`} />
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {label}
                    </p>
                    <p className="mt-0.5 font-display text-xl font-bold">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-12">
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-lg font-bold">Your positions</h2>
              <Link
                to="/browse"
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-foreground transition"
              >
                Browse opportunities <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {!commitments.length ? (
              <div className="rounded-2xl border border-border/40 py-14 text-center">
                <EmptyPortfolioIllustration />
                <p className="mt-5 font-display text-base font-semibold">No investments yet</p>
                <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                  Browse verified opportunities and back the businesses building Africa's future.
                </p>
                <Link
                  to="/browse"
                  className="mt-5 inline-flex items-center gap-1.5 rounded-xl gradient-brand px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-brand"
                >
                  Explore deals <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border/60 rounded-2xl border border-border overflow-hidden">
                {commitments.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-wrap items-center gap-4 bg-card px-5 py-4 hover:bg-card/80 transition-colors"
                  >
                    <div
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        c.status === "active"
                          ? "bg-brand-green"
                          : c.status === "pending"
                            ? "bg-gold"
                            : "bg-muted-foreground/40"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-lg font-bold">
                        {formatMoney(Number(c.amount ?? 0))}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {getRailLabel(c.rail)} ·{" "}
                        {c.escrow_reference
                          ? `Ref: ${c.escrow_reference}`
                          : "Reference pending"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${
                          c.status === "active"
                            ? "bg-brand-green/10 text-brand-green"
                            : c.status === "pending"
                              ? "bg-gold/10 text-gold"
                              : "bg-secondary text-muted-foreground"
                        }`}
                      >
                        {String(c.status).replaceAll("_", " ")}
                      </span>
                      <p className="mt-1.5 text-[11px] text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="grid gap-8 lg:grid-cols-2">
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <h2 className="font-display text-base font-bold">Funding readiness</h2>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                Complete these steps to unlock live investment access.
              </p>
              <div className="space-y-2.5">
                {readiness.checklist.map((item) => (
                  <div
                    key={item.label}
                    className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm border ${
                      item.done
                        ? "border-brand-green/15 bg-brand-green/5"
                        : "border-border bg-secondary/20"
                    }`}
                  >
                    {item.done ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-green" />
                    ) : (
                      <Circle className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                    )}
                    <span className={item.done ? "text-foreground" : "text-muted-foreground flex-1"}>
                      {item.label}
                    </span>
                    <span
                      className={`ml-auto text-xs font-semibold ${
                        item.done ? "text-brand-green" : "text-muted-foreground"
                      }`}
                    >
                      {item.done ? "Done" : "Pending"}
                    </span>
                  </div>
                ))}
              </div>
              <div
                className={`mt-4 rounded-xl border px-4 py-3 text-xs leading-relaxed ${
                  readiness.canInvestNow
                    ? "border-brand-green/20 bg-brand-green/5 text-brand-green"
                    : "border-border bg-secondary/20 text-muted-foreground"
                }`}
              >
                {readiness.canInvestNow
                  ? "✓ Ready for escrow-backed investments."
                  : "Complete the checks above to enable investment checkout."}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  { to: "/suitability", label: "Suitability test" },
                  { to: "/security", label: "Security center" },
                  { to: "/wallet", label: "Wallet" },
                ].map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to as never}
                    className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:border-primary/30 hover:text-foreground transition"
                  >
                    {label} <ChevronRight className="h-3 w-3" />
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-5">
                <h2 className="font-display text-base font-bold">Funding methods</h2>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  Bank transfer, card, wallet, or wire — all escrow-backed.
                </p>
              </div>
              <div className="divide-y divide-border/60 rounded-2xl border border-border overflow-hidden">
                {readiness.fundingRails.map((rail) => {
                  const Icon = railIcons[rail.id as keyof typeof railIcons] ?? Wallet;
                  const statusText =
                    rail.status === "available"
                      ? "Ready"
                      : rail.status === "setup_required"
                        ? "Setup required"
                        : "Pending";
                  const statusColor =
                    rail.status === "available"
                      ? "text-brand-green"
                      : rail.status === "setup_required"
                        ? "text-gold"
                        : "text-muted-foreground";
                  return (
                    <div key={rail.id} className="flex items-center gap-4 bg-card px-5 py-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{rail.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{rail.note}</p>
                      </div>
                      <span className={`shrink-0 text-xs font-bold ${statusColor}`}>
                        {statusText}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section>
            <h2 className="font-display text-base font-bold mb-2">How money moves</h2>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Every investment follows a structured, escrow-backed flow from commitment to return.
            </p>
            <ol className="relative border-l border-border/60 space-y-0">
              {workflow.map((step, index) => (
                <li key={step.id} className="relative pl-8 pb-8 last:pb-0">
                  <div className="absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-background">
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {index + 1}
                    </span>
                  </div>
                  <p className="text-sm font-bold">{step.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground max-w-lg">
                    {step.detail}
                  </p>
                  {step.gate && (
                    <p className="mt-1 text-[11px] italic text-muted-foreground/60">{step.gate}</p>
                  )}
                </li>
              ))}
            </ol>
          </section>

          <section>
            <h2 className="font-display text-base font-bold mb-5">Documents & history</h2>
            <div className="flex gap-0 border-b border-border mb-6">
              {(
                [
                  { key: "statements", label: "Statements", icon: FileText },
                  { key: "payouts", label: "Payouts", icon: ArrowDownLeft },
                  { key: "refunds", label: "Refunds", icon: RotateCcw },
                ] as const
              ).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setDocTab(key)}
                  className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                    docTab === key
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                  {docCounts[key] > 0 && (
                    <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                      {docCounts[key]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {docTab === "statements" && (
              <DocList
                items={statements}
                empty="Statements, certificates, and investor notices will appear here once uploaded by operations."
                renderItem={(s) => (
                  <div className="flex items-center gap-4 py-4 first:pt-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{s.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {s.statement_type} ·{" "}
                        {new Date(s.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void openStatement(s)}
                      className="shrink-0 flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-foreground transition"
                    >
                      <ExternalLink className="h-3.5 w-3.5" /> Open
                    </button>
                  </div>
                )}
              />
            )}

            {docTab === "payouts" && (
              <DocList
                items={payouts}
                empty="Distributions, coupon payments, and profit-share remittances will be tracked here."
                renderItem={(p) => (
                  <div className="flex items-center gap-4 py-4 first:pt-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-green/10 text-brand-green">
                      <ArrowDownLeft className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-base font-bold text-brand-green">
                        {formatMoney(Number(p.amount ?? 0))}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                        {p.event_type} · {String(p.status).replaceAll("_", " ")}
                      </p>
                    </div>
                  </div>
                )}
              />
            )}

            {docTab === "refunds" && (
              <DocList
                items={refunds}
                empty="Cancelled or resolved rounds will leave a visible refund trail here for full transparency."
                renderItem={(r) => (
                  <div className="flex items-center gap-4 py-4 first:pt-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-destructive/10 text-destructive">
                      <RotateCcw className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-base font-bold">
                        {formatMoney(Number(r.amount ?? 0))}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                        {r.note ?? "Refund event"} ·{" "}
                        {String(r.status).replaceAll("_", " ")}
                      </p>
                    </div>
                  </div>
                )}
              />
            )}
          </section>
        </div>
      </div>
    </AppLayout>
  );
}

function DocList({
  items,
  empty,
  renderItem,
}: {
  items: any[];
  empty: string;
  renderItem: (item: any) => React.ReactNode;
}) {
  if (!items.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
        {empty}
      </p>
    );
  }
  return (
    <div className="divide-y divide-border/60">
      {items.map((item, i) => (
        <div key={item.id ?? i}>{renderItem(item)}</div>
      ))}
    </div>
  );
}
