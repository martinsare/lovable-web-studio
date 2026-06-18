import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowUpRight, CreditCard, ExternalLink, Landmark, PiggyBank, RadioTower, ShieldCheck, TrendingUp, Wallet } from "lucide-react";
import { PageShell, EmptyState } from "@/components/page-shell";
import { useAuth } from "@/hooks/use-auth";
import { useSecurity } from "@/hooks/use-security";
import { buildInvestmentReadiness } from "@/lib/investment-readiness";
import { getInvestmentWorkflow } from "@/lib/investment-workflow";
import { supabase } from "@/integrations/supabase/client";
import { getDocumentSignedUrl } from "@/lib/document-storage";
import { formatMoney, getRailLabel } from "@/lib/investment-checkout";

export const Route = createFileRoute("/_authenticated/portfolio")({
  head: () => ({ meta: [{ title: "My Portfolio - CoFund" }] }),
  component: PortfolioPage,
});

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

  const stats = [
    { icon: Wallet, label: "Total invested", value: "NGN 0", color: "text-primary bg-primary/10" },
    { icon: PiggyBank, label: "Returns paid", value: "NGN 0", color: "text-brand-green bg-brand-green/10" },
    { icon: TrendingUp, label: "Active positions", value: "0", color: "text-gold bg-gold/10" },
    { icon: ArrowUpRight, label: "Avg. target return", value: "-", color: "text-primary bg-primary/10" },
  ];

  const railIcons = {
    bank_transfer: Landmark,
    card: CreditCard,
    wallet_balance: Wallet,
    wire: RadioTower,
  } as const;

  async function openStatement(statement: any) {
    try {
      const directUrl = typeof statement.file_url === "string" && /^https?:\/\//.test(statement.file_url) ? statement.file_url : null;
      const signedUrl =
        statement.storage_bucket && statement.storage_path
          ? await getDocumentSignedUrl(statement.storage_bucket, statement.storage_path, statement.original_filename ?? statement.title)
          : directUrl;

      if (!signedUrl) throw new Error("This statement file is not available yet.");
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
        <div className="hidden gap-2 sm:flex">
          <Link to="/wallet" className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground">
            Wallet
          </Link>
          <Link to="/security" className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground">
            Security
          </Link>
          <Link to="/browse" className="gradient-brand rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-brand">
            Browse opportunities
          </Link>
        </div>
      }
    >
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-white/[0.06] bg-card p-5">
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${stat.color}`}>
              <stat.icon className="h-5 w-5" />
            </div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{stat.label}</p>
            <p className="mt-1 font-display text-2xl font-bold">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-bold">Funding readiness</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Serious platforms separate browsing access from money movement. This checklist shows what still needs to be completed before live investing.
          </p>
          <div className="mt-5 grid gap-3">
            {readiness.checklist.map((item) => (
              <div key={item.label} className={`rounded-xl border px-4 py-3 text-sm ${item.done ? "border-brand-green/20 bg-brand-green/5" : "border-border bg-secondary/30"}`}>
                <span className={item.done ? "text-brand-green" : "text-muted-foreground"}>
                  {item.done ? "Ready" : "Pending"}:
                </span>{" "}
                {item.label}
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-xl border border-primary/15 bg-primary/5 p-4 text-sm text-muted-foreground">
            {readiness.canInvestNow
              ? "This account is ready for escrow-backed investment actions once payment rails are connected."
              : "This account is not ready to move funds yet. Complete the pending checks before enabling investment checkout."}
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link to="/suitability" className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground">
              Suitability test
            </Link>
            <Link to="/security" className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground">
              Security center
            </Link>
            <Link to="/wallet" className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground">
              Wallet
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-xl font-bold">Funding methods</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            These are the production rails the app is now shaped for: transfer-led investing, processor-backed card payments, wallet balances, and entity wires.
          </p>
          <div className="mt-5 grid gap-3">
            {readiness.fundingRails.map((rail) => {
              const Icon = railIcons[rail.id as keyof typeof railIcons] ?? Wallet;
              return (
                <div key={rail.id} className="rounded-xl border border-border bg-secondary/20 p-4">
                  <div className="flex items-center gap-3">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{rail.label}</p>
                      <p className="text-xs text-muted-foreground">{rail.note}</p>
                    </div>
                  </div>
                  <p className="mt-3 text-xs uppercase tracking-widest text-muted-foreground">
                    {rail.status === "available" ? "Available once connected" : rail.status === "setup_required" ? "Needs setup" : "Disabled until compliance clears"}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-6 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-xl font-bold">How money moves on CoFund</h2>
          <div className="mt-4 grid gap-3">
            {workflow.map((step, index) => (
              <div key={step.id} className="rounded-xl border border-border bg-secondary/20 p-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary">Step {index + 1}</p>
                <p className="mt-1 text-sm font-semibold">{step.title}</p>
                <p className="mt-1 text-sm text-muted-foreground">{step.detail}</p>
                {step.gate && <p className="mt-2 text-xs text-muted-foreground">{step.gate}</p>}
              </div>
            ))}
          </div>
        </div>
        <h2 className="font-display text-xl font-bold">Your investments</h2>
        <div className="mt-4">
          {!commitments.length ? (
            <EmptyState title="No investments yet" hint="Browse verified opportunities and back the businesses building Africa's future." />
          ) : (
            <div className="grid gap-3">
              {commitments.map((commitment) => (
                <div key={commitment.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-xl font-bold">{formatMoney(Number(commitment.amount ?? 0))}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {getRailLabel(commitment.rail)} · {commitment.escrow_reference ?? "Reference pending"}
                      </p>
                    </div>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {String(commitment.status).replaceAll("_", " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-xl font-bold">Statements</h2>
          <div className="mt-4 grid gap-3">
            {!statements.length ? (
              <p className="text-sm text-muted-foreground">Statements, certificates, and formal investor notices will appear here once uploaded by operations.</p>
            ) : (
              statements.map((statement) => (
                <div key={statement.id} className="rounded-xl border border-border bg-secondary/20 p-4">
                  <p className="font-semibold">{statement.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{statement.statement_type}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{new Date(statement.created_at).toLocaleString()}</p>
                  <button
                    type="button"
                    onClick={() => void openStatement(statement)}
                    className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Download secure copy
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-xl font-bold">Payout history</h2>
          <div className="mt-4 grid gap-3">
            {!payouts.length ? (
              <p className="text-sm text-muted-foreground">Distributions, coupon payments, and profit-share remittances will be tracked here.</p>
            ) : (
              payouts.map((payout) => (
                <div key={payout.id} className="rounded-xl border border-border bg-secondary/20 p-4">
                  <p className="font-semibold">{formatMoney(Number(payout.amount ?? 0))}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{payout.event_type}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{String(payout.status).replaceAll("_", " ")}</p>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-xl font-bold">Refund history</h2>
          <div className="mt-4 grid gap-3">
            {!refunds.length ? (
              <p className="text-sm text-muted-foreground">Cancelled or unresolved rounds should leave a visible refund trail here.</p>
            ) : (
              refunds.map((refund) => (
                <div key={refund.id} className="rounded-xl border border-border bg-secondary/20 p-4">
                  <p className="font-semibold">{formatMoney(Number(refund.amount ?? 0))}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{refund.note ?? "Refund event"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{String(refund.status).replaceAll("_", " ")}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </PageShell>
  );
}
