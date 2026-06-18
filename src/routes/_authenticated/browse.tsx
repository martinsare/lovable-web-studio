import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, EmptyState, SkeletonCards } from "@/components/page-shell";
import { Search, BadgeCheck, Building2, TrendingUp, ArrowRight, Filter, SlidersHorizontal } from "lucide-react";

export const Route = createFileRoute("/_authenticated/browse")({
  head: () => ({ meta: [{ title: "Browse · CoFund" }] }),
  component: BrowsePage,
});

type Tab = "opportunities" | "businesses";

function BrowsePage() {
  const [tab, setTab] = useState<Tab>("opportunities");
  const [q, setQ] = useState("");

  return (
    <PageShell
      eyebrow="Discover"
      title="Browse"
      description="Verified opportunities and businesses across Africa — invest, follow, or get inspired."
      actions={
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border border-border bg-secondary/40 p-1">
            {(["opportunities", "businesses"] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition-all duration-150 ${
                  tab === t
                    ? "gradient-brand text-primary-foreground shadow-soft"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      }
    >
      <div className="mb-6">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${tab}…`}
            className="w-full max-w-md rounded-xl border border-border bg-card px-10 py-3 text-sm outline-none transition placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/15"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              ×
            </button>
          )}
        </label>
      </div>
      {tab === "opportunities" ? <Opportunities q={q} /> : <Businesses q={q} />}
    </PageShell>
  );
}

function fmtNGN(n: number) {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n}`;
}

function getRiskColor(pct: number | null) {
  if (!pct) return "bg-secondary text-muted-foreground";
  if (pct >= 20) return "bg-gold/10 text-gold";
  if (pct >= 15) return "bg-primary/10 text-primary";
  return "bg-brand-green/10 text-brand-green";
}

function Opportunities({ q }: { q: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["browse", "opps", q],
    queryFn: async () => {
      let qb = supabase
        .from("opportunities")
        .select("id,title,summary,goal_amount,raised_amount,target_return_pct,status,businesses(name,industry,logo_url)")
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(24);
      if (q) qb = qb.ilike("title", `%${q}%`);
      const { data, error } = await qb;
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <SkeletonCards />;
  if (!data || data.length === 0)
    return (
      <EmptyState
        title="No opportunities yet"
        hint="As businesses list funding rounds, they'll appear here."
        icon={<TrendingUp className="h-10 w-10" />}
      />
    );

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((o: any) => {
        const pct = o.goal_amount
          ? Math.min(100, Math.round((Number(o.raised_amount) / Number(o.goal_amount)) * 100))
          : 0;
        return (
          <article
            key={o.id}
            className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-brand"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {o.businesses?.logo_url ? (
                  <img src={o.businesses.logo_url} alt="" className="h-10 w-10 shrink-0 rounded-xl object-cover" />
                ) : (
                  <div className="h-10 w-10 shrink-0 rounded-xl gradient-brand" />
                )}
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-medium text-muted-foreground">
                    {o.businesses?.industry ?? "Business"}
                  </p>
                  <p className="truncate text-sm font-semibold">{o.businesses?.name}</p>
                </div>
              </div>
              {o.target_return_pct && (
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${getRiskColor(o.target_return_pct)}`}>
                  {o.target_return_pct}%
                </span>
              )}
            </div>

            <h3 className="mt-4 font-display text-base font-bold leading-snug group-hover:text-primary transition-colors">
              {o.title}
            </h3>
            {o.summary && (
              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{o.summary}</p>
            )}

            <div className="mt-auto pt-5">
              <div className="mb-1.5 flex justify-between text-xs">
                <span className="text-muted-foreground">{pct}% funded</span>
                <span className="font-semibold text-foreground">{fmtNGN(Number(o.goal_amount))}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                <div
                  className="h-full rounded-full gradient-brand transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="mt-4 flex items-center justify-between gap-2">
                <div className="text-xs text-muted-foreground">
                  {o.target_return_pct && (
                    <span>Target: <span className="font-semibold text-brand-green">{o.target_return_pct}% p.a.</span></span>
                  )}
                </div>
                <Link
                  to="/invest/$opportunityId"
                  params={{ opportunityId: o.id }}
                  className="inline-flex items-center gap-1.5 rounded-xl gradient-brand px-4 py-2 text-sm font-semibold text-primary-foreground shadow-brand transition hover:opacity-90"
                >
                  Invest <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function Businesses({ q }: { q: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["browse", "biz", q],
    queryFn: async () => {
      let qb = supabase
        .from("businesses")
        .select("id,slug,name,industry,tagline,logo_url,cover_url,verified,followers_count")
        .order("followers_count", { ascending: false })
        .limit(24);
      if (q) qb = qb.ilike("name", `%${q}%`);
      const { data, error } = await qb;
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <SkeletonCards />;
  if (!data || data.length === 0)
    return (
      <EmptyState
        title="No businesses yet"
        hint="Verified businesses will appear here as they join CoFund."
        icon={<Building2 className="h-10 w-10" />}
      />
    );

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((b: any) => (
        <Link
          key={b.id}
          to="/business/$slug"
          params={{ slug: b.slug }}
          className="group block overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-brand"
        >
          <div className="relative">
            {b.cover_url ? (
              <img src={b.cover_url} alt="" className="aspect-[16/7] w-full object-cover" />
            ) : (
              <div className="aspect-[16/7] w-full gradient-mesh" />
            )}
          </div>
          <div className="p-5">
            <div className="flex items-start gap-3">
              {b.logo_url ? (
                <img
                  src={b.logo_url}
                  alt=""
                  className="-mt-9 h-12 w-12 shrink-0 rounded-xl border-2 border-card object-cover shadow-card"
                />
              ) : (
                <div className="-mt-9 flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-card gradient-brand text-primary-foreground shadow-card">
                  <Building2 className="h-5 w-5" />
                </div>
              )}
              <div className="min-w-0 flex-1 pt-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="truncate font-display text-base font-bold group-hover:text-primary transition-colors">
                    {b.name}
                  </h3>
                  {b.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-brand-green" />}
                </div>
                <p className="truncate text-xs text-muted-foreground">{b.industry}</p>
              </div>
            </div>
            {b.tagline && (
              <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{b.tagline}</p>
            )}
            <p className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
              <Filter className="h-3.5 w-3.5" />
              {b.followers_count ?? 0} followers
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
