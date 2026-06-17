import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, EmptyState, SkeletonCards } from "@/components/page-shell";
import { Search, BadgeCheck, Building2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/browse")({
  head: () => ({ meta: [{ title: "Browse · CoFund" }] }),
  component: BrowsePage,
});

type Tab = "opportunities" | "businesses";

function BrowsePage() {
  const [tab, setTab] = useState<Tab>("opportunities");
  const [q, setQ] = useState("");

  return (
    <PageShell eyebrow="Discover" title="Browse" description="Verified opportunities and businesses across Africa — invest, follow, or get inspired.">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-xl border border-white/[0.06] bg-card p-1">
          {(["opportunities", "businesses"] as Tab[]).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold capitalize transition ${
                tab === t ? "gradient-brand text-white shadow-soft" : "text-muted-foreground hover:text-foreground"
              }`}>
              {t}
            </button>
          ))}
        </div>
        <label className="relative block w-full sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`Search ${tab}…`}
            className="w-full rounded-xl border border-white/10 bg-card px-9 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>
      </div>
      {tab === "opportunities" ? <Opportunities q={q} /> : <Businesses q={q} />}
    </PageShell>
  );
}

function fmtNGN(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n}`;
}

function Opportunities({ q }: { q: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["browse", "opps", q],
    queryFn: async () => {
      let qb = supabase.from("opportunities")
        .select("id,title,summary,goal_amount,raised_amount,target_return_pct,status,businesses(name,industry,logo_url)")
        .eq("status", "open").order("created_at", { ascending: false }).limit(24);
      if (q) qb = qb.ilike("title", `%${q}%`);
      const { data, error } = await qb;
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <SkeletonCards />;
  if (!data || data.length === 0)
    return <EmptyState title="No opportunities yet" hint="As businesses list funding rounds, they'll appear here." />;

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((o: any) => {
        const pct = o.goal_amount ? Math.min(100, Math.round((Number(o.raised_amount) / Number(o.goal_amount)) * 100)) : 0;
        return (
          <article key={o.id} className="flex flex-col rounded-2xl border border-white/[0.06] bg-card p-5 transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-brand">
            <div className="flex items-center gap-3">
              {o.businesses?.logo_url
                ? <img src={o.businesses.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                : <div className="gradient-brand h-10 w-10 shrink-0 rounded-lg" />
              }
              <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground">{o.businesses?.industry ?? "Business"}</p>
                <p className="truncate text-sm font-semibold">{o.businesses?.name}</p>
              </div>
            </div>
            <h3 className="mt-4 font-display text-lg font-bold leading-tight">{o.title}</h3>
            {o.summary && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{o.summary}</p>}
            <div className="mt-auto pt-5">
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>{pct}% funded</span>
                <span>{fmtNGN(Number(o.goal_amount))}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="gradient-brand h-full rounded-full" style={{ width: `${pct}%` }} />
              </div>
              {o.target_return_pct && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Target return <span className="font-semibold text-brand-green">{o.target_return_pct}%</span>
                </p>
              )}
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
      let qb = supabase.from("businesses")
        .select("id,slug,name,industry,tagline,logo_url,cover_url,verified,followers_count")
        .order("followers_count", { ascending: false }).limit(24);
      if (q) qb = qb.ilike("name", `%${q}%`);
      const { data, error } = await qb;
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <SkeletonCards />;
  if (!data || data.length === 0)
    return <EmptyState title="No businesses yet" hint="Verified businesses will appear here as they join CoFund." />;

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {data.map((b: any) => (
        <Link key={b.id} to="/business/$slug" params={{ slug: b.slug }}
          className="group block overflow-hidden rounded-2xl border border-white/[0.06] bg-card transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-brand">
          {b.cover_url
            ? <img src={b.cover_url} alt="" className="aspect-[16/8] w-full object-cover" />
            : <div className="gradient-mesh aspect-[16/8] w-full" />
          }
          <div className="p-5">
            <div className="flex items-start gap-3">
              {b.logo_url
                ? <img src={b.logo_url} alt="" className="-mt-10 h-12 w-12 rounded-xl border-2 border-card object-cover" />
                : <div className="gradient-brand -mt-10 flex h-12 w-12 items-center justify-center rounded-xl border-2 border-card text-white">
                    <Building2 className="h-5 w-5" />
                  </div>
              }
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="truncate font-display text-base font-bold group-hover:text-primary transition-colors">{b.name}</h3>
                  {b.verified && <BadgeCheck className="h-4 w-4 shrink-0 text-brand-green" />}
                </div>
                <p className="truncate text-xs text-muted-foreground">{b.industry}</p>
              </div>
            </div>
            {b.tagline && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{b.tagline}</p>}
            <p className="mt-3 text-xs text-muted-foreground">{b.followers_count ?? 0} followers</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
