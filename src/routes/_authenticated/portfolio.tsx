import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
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
} from "lucide-react";
import { PageShell, EmptyState, StatCard } from "@/components/page-shell";
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

function PortfolioPage() {
  const { user, profile, roles } = useAuth();
  const { security } = useSecurity();
  const readiness = buildInvestmentReadiness({ profile, roles, security });
  const workflow = getInvestmentWorkflow();

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
              statement.original_filename ?? statement.title
            )
          : directUrl;
      if (!signedUrl) throw new Error("Statement file not available yet.");
      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } catch (error: any) {
      toast.error(error?.message ?? "Unable to open that statement.");
    }
  }

  return (
    <PageShell
      eyebrow="Investor"
      title="My Portfolio"
      description="Track investments, funding readiness, escrow status, milestones, and returns in one place."
      actions={
        <div className="flex items-center gap-2">
          <Link
            to="/browse"
            className="inline-flex items-center gap-1.5 rounded-xl gradient-brand px-4 py-2 text-sm font-semibold text-primary-foreground shadow-brand transition hover:opacity-90"
          >
            Browse opportunities <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      }
    >
      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total invested"
          value="₦0"
          icon={<Wallet className="h-5 w-5" />}
          color="primary"
        />
        <StatCard
          label="Returns paid"
          value="₦0"
          icon={<PiggyBank className="h-5 w-5" />}
          color="green"
        />
        <StatCard
          label="Active positions"
          value={String(commitments.filter((c) => c.status === "active").length)}
          icon={<TrendingUp className="h-5 w-5" />}
          color="gold"
        />
        <StatCard
          label="Avg. target return"
          value="—"
          icon={<BarChart3 className="h-5 w-5" />}
          color="primary"
        />
      </div>

      {/* Readiness + Funding methods */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold">Funding readiness</h2>
            </div>
          </div>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Complete these steps to unlock live investment access. Each check protects both you and the platform.
          </p>

          <div className="mt-5 space-y-2.5">
            {readiness.checklist.map((item) => (
              <div
                key={item.label}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-sm ${
                  item.done
                    ? "border-brand-green/20 bg-brand-green/5"
                    : "border-border bg-secondary/30"
                }`}
              >
                {item.done ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-green" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                )}
                <span className={item.done ? "text-foreground" : "text-muted-foreground"}>
                  {item.label}
                </span>
                {item.done ? (
                  <span className="ml-auto text-xs font-semibold text-brand-green">Done</span>
                ) : (
                  <span className="ml-auto text-xs text-muted-foreground">Pending</span>
                )}
              </div>
            ))}
          </div>

          <div
            className={`mt-5 rounded-xl border p-4 text-sm leading-relaxed ${
              readiness.canInvestNow
                ? "border-brand-green/20 bg-brand-green/5 text-brand-green"
                : "border-border bg-secondary/30 text-muted-foreground"
            }`}
          >
            {readiness.canInvestNow
              ? "✓ This account is ready for escrow-backed investment actions."
              : "Complete the pending checks above to enable investment checkout."}
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {[
              { to: "/suitability", label: "Suitability test" },
              { to: "/security", label: "Security center" },
              { to: "/wallet", label: "Wallet" },
            ].map(({ to, label }) => (
              <Link
                key={to}
                to={to as never}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3.5 py-2 text-xs font-semibold text-muted-foreground transition hover:border-primary/30 hover:text-foreground"
              >
                {label} <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-bold">Funding methods</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Production rails available for live investing: bank transfer, card, wallet balance, and entity wires.
          </p>
          <div className="mt-5 space-y-3">
            {readiness.fundingRails.map((rail) => {
              const Icon = railIcons[rail.id as keyof typeof railIcons] ?? Wallet;
              const statusText =
                rail.status === "available"
                  ? "Ready once connected"
                  : rail.status === "setup_required"
                  ? "Setup required"
                  : "Pending compliance";
              const statusColor =
                rail.status === "available"
                  ? "text-brand-green"
                  : rail.status === "setup_required"
                  ? "text-gold"
                  : "text-muted-foreground";
              return (
                <div
                  key={rail.id}
                  className="flex items-center gap-4 rounded-xl border border-border bg-secondary/20 p-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{rail.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{rail.note}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-semibold ${statusColor}`}>{statusText}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Money workflow */}
      <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-card">
        <h2 className="font-display text-lg font-bold mb-1">How money moves on CoFund</h2>
        <p className="text-sm text-muted-foreground mb-5">
          Each investment follows a structured, escrow-backed flow from commitment to return.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {workflow.map((step, index) => (
            <div key={step.id} className="rounded-xl border border-border bg-secondary/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-display text-2xl font-bold text-primary/20">
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <p className="text-sm font-semibold">{step.title}</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{step.detail}</p>
              {step.gate && (
                <p className="mt-2 text-[11px] italic text-muted-foreground/70">{step.gate}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Your investments */}
      <div className="mt-8">
        <h2 className="font-display text-xl font-bold mb-4">Your investments</h2>
        {!commitments.length ? (
          <EmptyState
            title="No investments yet"
            hint="Browse verified opportunities and back the businesses building Africa's future."
            icon={<TrendingUp className="h-10 w-10" />}
          />
        ) : (
          <div className="space-y-3">
            {commitments.map((c) => (
              <div key={c.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-display text-2xl font-bold">{formatMoney(Number(c.amount ?? 0))}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {getRailLabel(c.rail)} · {c.escrow_reference ?? "Reference pending"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                      c.status === "active"
                        ? "bg-brand-green/10 text-brand-green"
                        : c.status === "pending"
                        ? "bg-gold/10 text-gold"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {String(c.status).replaceAll("_", " ")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Documents: statements, payouts, refunds */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Statements */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-bold mb-4">Statements</h2>
          {!statements.length ? (
            <p className="text-sm text-muted-foreground leading-relaxed">
              Statements, certificates, and formal investor notices will appear here once uploaded by operations.
            </p>
          ) : (
            <div className="space-y-3">
              {statements.map((s: any) => (
                <div key={s.id} className="rounded-xl border border-border bg-secondary/20 p-4">
                  <p className="font-semibold text-sm">{s.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{s.statement_type}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {new Date(s.created_at).toLocaleDateString()}
                  </p>
                  <button
                    type="button"
                    onClick={() => void openStatement(s)}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition hover:text-foreground"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Download
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payouts */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-bold mb-4">Payout history</h2>
          {!payouts.length ? (
            <p className="text-sm text-muted-foreground leading-relaxed">
              Distributions, coupon payments, and profit-share remittances will be tracked here.
            </p>
          ) : (
            <div className="space-y-3">
              {payouts.map((p: any) => (
                <div key={p.id} className="rounded-xl border border-border bg-secondary/20 p-4">
                  <p className="font-semibold text-brand-green">
                    {formatMoney(Number(p.amount ?? 0))}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{p.event_type}</p>
                  <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                    {String(p.status).replaceAll("_", " ")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Refunds */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h2 className="font-display text-lg font-bold mb-4">Refund history</h2>
          {!refunds.length ? (
            <p className="text-sm text-muted-foreground leading-relaxed">
              Cancelled or unresolved rounds leave a visible refund trail here for complete transparency.
            </p>
          ) : (
            <div className="space-y-3">
              {refunds.map((r: any) => (
                <div key={r.id} className="rounded-xl border border-border bg-secondary/20 p-4">
                  <p className="font-semibold">{formatMoney(Number(r.amount ?? 0))}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{r.note ?? "Refund event"}</p>
                  <p className="mt-0.5 text-xs capitalize text-muted-foreground">
                    {String(r.status).replaceAll("_", " ")}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
