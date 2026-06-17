import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell, EmptyState } from "@/components/page-shell";
import { Wallet, TrendingUp, PiggyBank, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/_authenticated/portfolio")({
  head: () => ({ meta: [{ title: "My Portfolio · CoFund" }] }),
  component: PortfolioPage,
});

function PortfolioPage() {
  const stats = [
    { icon: Wallet, label: "Total invested", value: "₦0" },
    { icon: PiggyBank, label: "Returns paid", value: "₦0" },
    { icon: TrendingUp, label: "Active positions", value: "0" },
    { icon: ArrowUpRight, label: "Avg. target return", value: "—" },
  ];
  return (
    <PageShell
      eyebrow="Investor"
      title="My Portfolio"
      description="Track your investments, escrow status, milestones and returns — all in one place."
      actions={
        <Link to="/browse" className="gradient-brand hidden rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-soft sm:inline-flex">
          Browse opportunities
        </Link>
      }
    >
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <s.icon className="h-4 w-4" />
            </div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
            <p className="mt-1 font-display text-2xl font-extrabold">{s.value}</p>
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