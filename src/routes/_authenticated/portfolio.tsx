import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, EmptyState } from "@/components/page-shell";
import { Wallet, TrendingUp, PiggyBank, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/portfolio")({
  head: () => ({ meta: [{ title: "My Portfolio · CoFund" }] }),
  component: PortfolioPage,
});

function PortfolioPage() {
  const stats = [
    { icon: Wallet, label: "Total invested", value: "₦0", color: "text-primary bg-primary/10" },
    { icon: PiggyBank, label: "Returns paid", value: "₦0", color: "text-brand-green bg-brand-green/10" },
    { icon: TrendingUp, label: "Active positions", value: "0", color: "text-gold bg-gold/10" },
    { icon: ArrowUpRight, label: "Avg. target return", value: "—", color: "text-primary bg-primary/10" },
  ];
  return (
    <PageShell
      eyebrow="Investor"
      title="My Portfolio"
      description="Track your investments, escrow status, milestones and returns — all in one place."
      actions={
        <Link to="/browse" className="gradient-brand hidden rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-brand sm:inline-flex">
          Browse opportunities
        </Link>
      }
    >
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-white/[0.06] bg-card p-5">
            <div className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl ${s.color}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">{s.label}</p>
            <p className="mt-1 font-display text-2xl font-bold">{s.value}</p>
          </div>
        ))}
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl font-bold">Your investments</h2>
        <div className="mt-4">
          <EmptyState
            title="No investments yet"
            hint="Browse verified opportunities and back the businesses building Africa's future."
          />
        </div>
      </section>
    </PageShell>
  );
}
