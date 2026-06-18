import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/app-layout";
import { EmptySearchIllustration } from "@/components/animated-illustration";
import {
  Search,
  BadgeCheck,
  Building2,
  TrendingUp,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Clock,
  SlidersHorizontal,
  Users,
  Flame,
  Sprout,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/browse")({
  head: () => ({ meta: [{ title: "Browse · CoFund" }] }),
  component: BrowsePage,
});

type ViewTab = "opportunities" | "businesses";
type SortKey = "newest" | "funded" | "returns";

const INDUSTRIES = [
  "All",
  "Agriculture",
  "Technology",
  "Hospitality",
  "Healthcare",
  "Manufacturing",
  "Retail",
  "Energy",
  "Real Estate",
  "Fintech",
  "Education",
];

function fmtNGN(n: number) {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(0)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n}`;
}

function daysLeft(closesAt: string | null): number | null {
  if (!closesAt) return null;
  const diff = new Date(closesAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function useWatchlist(userId: string) {
  const qc = useQueryClient();
  const qk = ["watchlist", userId];

  const { data: savedArr = [] } = useQuery<string[]>({
    queryKey: qk,
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_watchlist")
        .select("item_id")
        .eq("user_id", userId)
        .eq("item_type", "opportunity");
      return (data ?? []).map((r: any) => r.item_id as string);
    },
  });

  const saved = new Set(savedArr);

  async function toggle(id: string) {
    if (!userId) return;
    const isIn = saved.has(id);
    if (isIn) {
      await supabase
        .from("user_watchlist")
        .delete()
        .eq("user_id", userId)
        .eq("item_id", id)
        .eq("item_type", "opportunity");
    } else {
      await supabase
        .from("user_watchlist")
        .insert({ user_id: userId, item_id: id, item_type: "opportunity" });
    }
    qc.invalidateQueries({ queryKey: qk });
  }

  return { saved, toggle };
}

function BrowsePage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<ViewTab>("opportunities");
  const [q, setQ] = useState("");
  const [industry, setIndustry] = useState("All");
  const [sort, setSort] = useState<SortKey>("newest");
  const [showSort, setShowSort] = useState(false);
  const { saved, toggle } = useWatchlist(user?.id ?? "");

  return (
    <AppLayout>
      <div className="min-h-full bg-background">
        {/* Sticky browse header */}
        <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-xl">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-4 py-4">
              {/* Tabs */}
              <div className="flex gap-0 shrink-0">
                {(["opportunities", "businesses"] as ViewTab[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`px-4 py-2 text-sm font-bold capitalize rounded-lg transition ${
                      tab === t
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder={`Search ${tab}…`}
                  className="w-full rounded-xl border border-border bg-card pl-11 pr-4 py-2.5 text-sm outline-none focus:border-primary/60 placeholder:text-muted-foreground/50"
                />
                {q && (
                  <button
                    onClick={() => setQ("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-lg leading-none"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Sort (opportunities only) */}
              {tab === "opportunities" && (
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowSort((v) => !v)}
                    className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                    {sort === "newest" ? "Newest" : sort === "funded" ? "Most funded" : "Top returns"}
                  </button>
                  {showSort && (
                    <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-border bg-card shadow-elevated overflow-hidden z-20">
                      {(
                        [
                          { key: "newest", label: "Newest first" },
                          { key: "funded", label: "Most funded" },
                          { key: "returns", label: "Highest returns" },
                        ] as { key: SortKey; label: string }[]
                      ).map(({ key, label }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => { setSort(key); setShowSort(false); }}
                          className={`w-full px-4 py-2.5 text-left text-sm font-semibold transition ${
                            sort === key
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Industry filter pills */}
            <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
              {INDUSTRIES.map((ind) => (
                <button
                  key={ind}
                  type="button"
                  onClick={() => setIndustry(ind)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                    industry === ind
                      ? "bg-foreground text-background"
                      : "border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                  }`}
                >
                  {ind}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {tab === "opportunities" ? (
            <Opportunities q={q} industry={industry} sort={sort} saved={saved} onToggle={toggle} />
          ) : (
            <Businesses q={q} industry={industry} />
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function Opportunities({
  q,
  industry,
  sort,
  saved,
  onToggle,
}: {
  q: string;
  industry: string;
  sort: SortKey;
  saved: Set<string>;
  onToggle: (id: string) => void;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ["browse", "opps", q],
    queryFn: async () => {
      let qb = supabase
        .from("opportunities")
        .select(
          "id,title,summary,goal_amount,raised_amount,target_return_pct,status,closes_at,minimum_investment,businesses(name,industry,logo_url,cover_url,verified)",
        )
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(40);
      if (q) qb = qb.ilike("title", `%${q}%`);
      const { data, error } = await qb;
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    let list = [...data] as any[];
    if (industry !== "All")
      list = list.filter((o) =>
        (o.businesses?.industry ?? "").toLowerCase().includes(industry.toLowerCase()),
      );
    if (sort === "funded")
      list.sort((a, b) => {
        const pA = a.goal_amount ? (a.raised_amount / a.goal_amount) : 0;
        const pB = b.goal_amount ? (b.raised_amount / b.goal_amount) : 0;
        return pB - pA;
      });
    if (sort === "returns")
      list.sort((a, b) => (b.target_return_pct ?? 0) - (a.target_return_pct ?? 0));
    return list;
  }, [data, industry, sort]);

  if (isLoading)
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-72 animate-pulse rounded-2xl bg-card" />
        ))}
      </div>
    );

  if (!filtered.length)
    return (
      <div className="py-14 text-center">
        <EmptySearchIllustration />
        <p className="mt-5 font-display text-base font-semibold">No opportunities found</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {q || industry !== "All" ? "Try a different search or filter." : "As businesses list funding rounds, they'll appear here."}
        </p>
      </div>
    );

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {filtered.map((o: any) => {
        const pct = o.goal_amount
          ? Math.min(100, Math.round((Number(o.raised_amount) / Number(o.goal_amount)) * 100))
          : 0;
        const days = daysLeft(o.closes_at);
        const isWatched = saved.has(o.id);
        const retColor =
          !o.target_return_pct
            ? "bg-secondary text-muted-foreground"
            : o.target_return_pct >= 20
              ? "bg-gold/10 text-gold"
              : o.target_return_pct >= 15
                ? "bg-primary/10 text-primary"
                : "bg-brand-green/10 text-brand-green";

        return (
          <article
            key={o.id}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-brand"
          >
            {/* Cover / banner area */}
            <div className="relative h-24 overflow-hidden">
              {o.businesses?.cover_url ? (
                <img src={o.businesses.cover_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full gradient-mesh" />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-card/80" />

              {/* Watchlist */}
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); onToggle(o.id); }}
                className={`absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full transition ${
                  isWatched
                    ? "bg-primary text-primary-foreground"
                    : "bg-black/40 text-white hover:bg-black/60"
                }`}
              >
                {isWatched ? (
                  <BookmarkCheck className="h-4 w-4" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
              </button>

              {/* Return badge */}
              {o.target_return_pct && (
                <span className={`absolute top-3 left-3 rounded-full px-2.5 py-1 text-[11px] font-bold ${retColor}`}>
                  {o.target_return_pct}% p.a.
                </span>
              )}
            </div>

            <div className="flex flex-1 flex-col p-5">
              {/* Business identity */}
              <div className="flex items-center gap-3 -mt-8 mb-3">
                {o.businesses?.logo_url ? (
                  <img
                    src={o.businesses.logo_url}
                    alt=""
                    className="h-10 w-10 shrink-0 rounded-xl border-2 border-card object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 shrink-0 rounded-xl border-2 border-card gradient-brand flex items-center justify-center">
                    <Building2 className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
                <div className="min-w-0 mt-6">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground truncate">
                    {o.businesses?.industry ?? "Business"}
                  </p>
                  <p className="text-sm font-bold truncate">{o.businesses?.name}</p>
                </div>
              </div>

              <h3 className="font-display text-base font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                {o.title}
              </h3>
              {o.summary && (
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {o.summary}
                </p>
              )}

              {/* Progress */}
              <div className="mt-auto pt-5">
                <div className="mb-1.5 flex justify-between text-xs">
                  <span className="font-semibold text-primary">{pct}% funded</span>
                  <span className="text-muted-foreground">{fmtNGN(Number(o.goal_amount))} goal</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      pct >= 75 ? "gradient-brand" : "bg-primary/60"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                {/* Bottom row */}
                <div className="mt-4 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {days !== null && (
                      <span className={`flex items-center gap-1 ${days <= 7 ? "text-amber-400 font-semibold" : ""}`}>
                        <Clock className="h-3.5 w-3.5" />
                        {days === 0 ? "Closes today" : `${days}d left`}
                      </span>
                    )}
                    {o.minimum_investment && (
                      <span>Min {fmtNGN(Number(o.minimum_investment))}</span>
                    )}
                  </div>
                  <Link
                    to="/invest/$opportunityId"
                    params={{ opportunityId: o.id }}
                    className="shrink-0 inline-flex items-center gap-1.5 rounded-xl gradient-brand px-4 py-2 text-sm font-bold text-primary-foreground shadow-brand transition hover:opacity-90"
                  >
                    Invest <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function Businesses({ q, industry }: { q: string; industry: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["browse", "biz", q],
    queryFn: async () => {
      let qb = supabase
        .from("businesses")
        .select("id,slug,name,industry,tagline,logo_url,cover_url,verified,followers_count,trust_score")
        .order("followers_count", { ascending: false })
        .limit(40);
      if (q) qb = qb.ilike("name", `%${q}%`);
      const { data, error } = await qb;
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    if (!data) return [];
    if (industry === "All") return data as any[];
    return (data as any[]).filter((b) =>
      (b.industry ?? "").toLowerCase().includes(industry.toLowerCase()),
    );
  }, [data, industry]);

  if (isLoading)
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-60 animate-pulse rounded-2xl bg-card" />
        ))}
      </div>
    );

  if (!filtered.length)
    return (
      <div className="py-14 text-center">
        <EmptySearchIllustration />
        <p className="mt-5 font-display text-base font-semibold">No businesses found</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {q || industry !== "All" ? "Try a different search or filter." : "Verified businesses will appear here."}
        </p>
      </div>
    );

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {filtered.map((b: any) => (
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
            {b.trust_score && (
              <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-xs font-bold text-white backdrop-blur-sm">
                <Flame className="h-3 w-3 text-amber-400" />
                {b.trust_score}
              </div>
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
              <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {b.tagline}
              </p>
            )}
            <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {b.followers_count ?? 0} followers
              </span>
              {b.verified && (
                <span className="flex items-center gap-1 text-brand-green font-semibold">
                  <BadgeCheck className="h-3.5 w-3.5" />
                  Verified
                </span>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
