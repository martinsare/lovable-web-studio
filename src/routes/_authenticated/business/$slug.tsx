import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useSecurity } from "@/hooks/use-security";
import { buildInvestmentReadiness } from "@/lib/investment-readiness";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  BadgeCheck,
  Building2,
  MapPin,
  Calendar,
  Users,
  TrendingUp,
  ArrowLeft,
  Heart,
  Coins,
  MessageCircle,
  Shield,
  Star,
  FileText,
  Lightbulb,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/business/$slug")({
  head: () => ({ meta: [{ title: "Business Passport · CoFund" }] }),
  component: BusinessPassportPage,
});

type BizTab = "overview" | "opportunities" | "updates" | "team";

function BusinessPassportPage() {
  const { slug } = Route.useParams();
  const { user, profile, roles } = useAuth();
  const { security } = useSecurity();
  const [tab, setTab] = useState<BizTab>("overview");
  const [followed, setFollowed] = useState(false);

  const { data: biz, isLoading } = useQuery({
    queryKey: ["business", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select(
          "id,name,slug,industry,tagline,description,logo_url,cover_url,verified,featured,spotlight,followers_count,trust_score,location,founded_year,revenue_growth_pct,owner_id,created_at"
        )
        .eq("slug", slug)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  const { data: owner } = useQuery({
    enabled: !!biz?.owner_id,
    queryKey: ["profile", biz?.owner_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id,full_name,username,avatar_url")
        .eq("id", biz!.owner_id)
        .maybeSingle();
      return data;
    },
  });

  const { data: opps } = useQuery({
    enabled: !!biz?.id,
    queryKey: ["business-opps", biz?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunities")
        .select("id,title,summary,goal_amount,raised_amount,target_return_pct,status,closes_at")
        .eq("business_id", biz!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: posts } = useQuery({
    enabled: !!biz?.id,
    queryKey: ["business-posts", biz?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("id,content,created_at,category")
        .eq("business_id", biz!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading) return <PassportSkeleton />;
  if (!biz) return null;

  const trustPct = Math.min(100, Math.round((biz.trust_score ?? 0) * 10));
  const isOwner = user?.id === biz.owner_id;
  const investorReadiness = buildInvestmentReadiness({ profile, roles, security });
  const investLabel = investorReadiness.canInvestNow ? "Invest in this round" : "Complete checks to invest";

  const TABS: { key: BizTab; label: string; icon: typeof Building2 }[] = [
    { key: "overview", label: "Overview", icon: Building2 },
    { key: "opportunities", label: "Opportunities", icon: Coins },
    { key: "updates", label: "Updates", icon: MessageCircle },
    { key: "team", label: "Team", icon: Users },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <div className="relative">
        {biz.cover_url ? (
          <img src={biz.cover_url} alt="" className="h-56 w-full object-cover sm:h-72 lg:h-80" />
        ) : (
          <div className="gradient-mesh h-56 w-full sm:h-72 lg:h-80" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />

        {/* Back link */}
        <div className="absolute left-4 top-4 sm:left-6">
          <Link
            to="/browse"
            className="inline-flex items-center gap-1.5 rounded-xl bg-background/80 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm transition hover:bg-background"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Browse
          </Link>
        </div>

        {biz.spotlight && (
          <div className="absolute right-4 top-4 sm:right-6">
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/90 px-2.5 py-1 text-xs font-bold text-amber-900 backdrop-blur-sm">
              <Star className="h-3 w-3" /> Spotlight
            </span>
          </div>
        )}
      </div>

      {/* Identity bar */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6 -mt-10 sm:-mt-14 relative z-10 pb-6">
          {biz.logo_url ? (
            <img
              src={biz.logo_url}
              alt={biz.name}
              className="h-20 w-20 rounded-2xl border-4 border-background object-cover shadow-soft sm:h-24 sm:w-24"
            />
          ) : (
            <div className="gradient-brand flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-background shadow-soft sm:h-24 sm:w-24">
              <Building2 className="h-8 w-8 text-white" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{biz.name}</h1>
              {biz.verified && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-green/10 px-2 py-0.5 text-xs font-semibold text-brand-green">
                  <BadgeCheck className="h-3.5 w-3.5" /> Verified
                </span>
              )}
              {biz.featured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  Featured
                </span>
              )}
            </div>
            {biz.tagline && <p className="mt-1 text-sm text-muted-foreground">{biz.tagline}</p>}
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
              {biz.industry && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5" /> {biz.industry}
                </span>
              )}
              {biz.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {biz.location}
                </span>
              )}
              {biz.founded_year && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Est. {biz.founded_year}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> {biz.followers_count ?? 0} followers
              </span>
            </div>
          </div>

          {/* Mobile CTA row */}
          <div className="flex gap-2 sm:hidden">
            <button
              onClick={() => setFollowed((f) => !f)}
              className={`flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                followed ? "border-brand-green bg-brand-green/10 text-brand-green" : "border-border bg-card"
              }`}
            >
              <Heart className={`h-4 w-4 ${followed ? "fill-brand-green" : ""}`} />
              {followed ? "Following" : "Follow"}
            </button>
            {!isOwner && (
              <button className="gradient-brand flex-1 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-soft">
                {investorReadiness.canInvestNow ? "Invest / Connect" : "Review readiness"}
              </button>
            )}
            {isOwner && (
              <Link
                to="/my-business"
                className="flex-1 rounded-xl border border-primary px-4 py-2 text-center text-sm font-semibold text-primary"
              >
                Edit Passport
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
            {TABS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  tab === key
                    ? "gradient-brand text-white shadow-soft"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
                {key === "opportunities" && opps && opps.length > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${tab === key ? "bg-white/30" : "bg-primary/10 text-primary"}`}>
                    {opps.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* Main */}
          <div className="min-w-0">
            {tab === "overview" && <OverviewTab biz={biz} owner={owner} />}
            {tab === "opportunities" && <OpportunitiesTab opps={opps ?? []} bizName={biz.name} />}
            {tab === "updates" && <UpdatesTab posts={posts ?? []} bizName={biz.name} logo={biz.logo_url} />}
            {tab === "team" && <TeamTab owner={owner} biz={biz} />}
          </div>

          {/* Sticky sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 flex flex-col gap-4">
              {/* Trust Score */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Shield className="h-4 w-4 text-brand-green" />
                  Trust Score
                </div>
                <div className="mt-4 flex items-end gap-3">
                  <p className="font-display text-5xl font-extrabold text-gradient-brand leading-none">
                    {biz.trust_score?.toFixed(1) ?? "—"}
                  </p>
                  <p className="mb-1 text-sm text-muted-foreground">/ 10</p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="gradient-brand h-full rounded-full transition-all"
                    style={{ width: `${trustPct}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  {trustPct >= 70 ? "High trust — well-verified business" : trustPct >= 40 ? "Building trust — completing milestones" : "New — trust grows with activity"}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setFollowed((f) => !f)}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                    followed ? "border-brand-green bg-brand-green/10 text-brand-green" : "border-border bg-card hover:bg-secondary"
                  }`}
                >
                  <Heart className={`h-4 w-4 ${followed ? "fill-brand-green" : ""}`} />
                  {followed ? "Following" : "Follow"}
                </button>

                {!isOwner && (
                  <div className="space-y-2">
                    <button className="gradient-brand w-full rounded-xl py-2.5 text-sm font-semibold text-white shadow-soft transition hover:opacity-90">
                      {investorReadiness.canInvestNow ? "Invest / Connect" : "Review readiness"}
                    </button>
                    {!investorReadiness.canInvestNow && (
                      <p className="text-center text-xs text-muted-foreground">
                        Funding actions unlock after email verification, MFA, and approved KYC/KYB.
                      </p>
                    )}
                  </div>
                )}
                {isOwner && (
                  <Link
                    to="/my-business"
                    className="w-full rounded-xl border border-primary py-2.5 text-center text-sm font-semibold text-primary transition hover:bg-primary/5"
                  >
                    Edit Passport
                  </Link>
                )}
              </div>

              {/* Key stats */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
                <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Key Info</p>
                <dl className="flex flex-col gap-3">
                  {biz.industry && <StatRow label="Industry" value={biz.industry} />}
                  {biz.location && <StatRow label="Location" value={biz.location} />}
                  {biz.founded_year && <StatRow label="Founded" value={String(biz.founded_year)} />}
                  {biz.revenue_growth_pct != null && (
                    <StatRow
                      label="Revenue growth"
                      value={`${biz.revenue_growth_pct > 0 ? "+" : ""}${biz.revenue_growth_pct}%`}
                      valueClass={biz.revenue_growth_pct >= 0 ? "text-brand-green" : "text-destructive"}
                    />
                  )}
                  <StatRow label="Followers" value={String(biz.followers_count ?? 0)} />
                  {opps && (
                    <StatRow label="Open rounds" value={String(opps.filter((o) => o.status === "open").length)} />
                  )}
                </dl>
              </div>

              {/* Escrow badge */}
              <div className="rounded-2xl border border-brand-green/20 bg-brand-green/5 p-4">
                <div className="flex items-start gap-2.5">
                  <Shield className="mt-0.5 h-4 w-4 shrink-0 text-brand-green" />
                  <div>
                    <p className="text-xs font-semibold text-brand-green">Escrow Protected</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      All investments on CoFund are held in secure escrow until milestones are met.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}

function StatRow({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className={`text-sm font-semibold ${valueClass ?? ""}`}>{value}</dd>
    </div>
  );
}

function OverviewTab({ biz, owner }: { biz: any; owner: any }) {
  return (
    <div className="flex flex-col gap-8">
      {/* Metrics row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { icon: Shield, label: "Trust Score", value: biz.trust_score?.toFixed(1) ?? "—", sub: "/ 10" },
          { icon: Users, label: "Followers", value: biz.followers_count ?? 0, sub: "community" },
          {
            icon: TrendingUp,
            label: "Revenue Growth",
            value: biz.revenue_growth_pct != null ? `${biz.revenue_growth_pct > 0 ? "+" : ""}${biz.revenue_growth_pct}%` : "—",
            sub: "YoY",
            green: (biz.revenue_growth_pct ?? 0) >= 0,
          },
          { icon: Calendar, label: "Founded", value: biz.founded_year ?? "—", sub: "year" },
        ].map((m) => (
          <div key={m.label} className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <m.icon className="h-4 w-4" />
            </div>
            <p className={`font-display text-2xl font-extrabold ${m.green ? "text-brand-green" : ""}`}>{m.value}</p>
            <p className="text-xs text-muted-foreground">{m.label}</p>
          </div>
        ))}
      </div>

      {/* Description */}
      {biz.description ? (
        <section>
          <h2 className="font-display text-lg font-bold">About</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{biz.description}</p>
        </section>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center">
          <Lightbulb className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-semibold">No description yet</p>
          <p className="mt-1 text-xs text-muted-foreground">The business owner hasn't added a story yet.</p>
        </div>
      )}

      {/* Owner card */}
      {owner && (
        <section>
          <h2 className="font-display text-lg font-bold">Founder</h2>
          <div className="mt-3 flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-card">
            {owner.avatar_url ? (
              <img src={owner.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
            ) : (
              <div className="gradient-brand flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold">
                {(owner.full_name ?? owner.username ?? "?")[0].toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-semibold">{owner.full_name ?? owner.username ?? "Anonymous"}</p>
              {owner.username && <p className="text-xs text-muted-foreground">@{owner.username}</p>}
            </div>
          </div>
        </section>
      )}

      {/* Mobile sidebar info */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-card lg:hidden">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Key Info</p>
        <dl className="grid grid-cols-2 gap-3">
          {biz.industry && <MobileStat label="Industry" value={biz.industry} />}
          {biz.location && <MobileStat label="Location" value={biz.location} />}
          {biz.founded_year && <MobileStat label="Founded" value={String(biz.founded_year)} />}
          {biz.revenue_growth_pct != null && (
            <MobileStat
              label="Revenue growth"
              value={`${biz.revenue_growth_pct > 0 ? "+" : ""}${biz.revenue_growth_pct}%`}
            />
          )}
        </dl>
      </div>
    </div>
  );
}

function MobileStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold">{value}</dd>
    </div>
  );
}

function fmtNGN(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
}

function OpportunitiesTab({ opps, bizName }: { opps: any[]; bizName: string }) {
  if (!opps.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
        <Coins className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="font-display text-lg font-bold">No open rounds</p>
        <p className="mt-2 text-sm text-muted-foreground">{bizName} hasn't listed a funding round yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {opps.map((o: any) => {
        const pct = o.goal_amount ? Math.min(100, Math.round((Number(o.raised_amount) / Number(o.goal_amount)) * 100)) : 0;
        const isOpen = o.status === "open";
        return (
          <article key={o.id} className="rounded-2xl border border-border bg-card p-6 shadow-card">
            <div className="flex items-start justify-between gap-3">
              <h3 className="font-display text-lg font-bold">{o.title}</h3>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  isOpen ? "bg-brand-green/10 text-brand-green" : "bg-muted text-muted-foreground"
                }`}
              >
                {o.status}
              </span>
            </div>
            {o.summary && <p className="mt-2 text-sm text-muted-foreground">{o.summary}</p>}

            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-secondary/60 p-3">
                <p className="text-xs text-muted-foreground">Goal</p>
                <p className="mt-1 font-display text-base font-bold">{fmtNGN(Number(o.goal_amount))}</p>
              </div>
              <div className="rounded-xl bg-secondary/60 p-3">
                <p className="text-xs text-muted-foreground">Raised</p>
                <p className="mt-1 font-display text-base font-bold">{fmtNGN(Number(o.raised_amount))}</p>
              </div>
              {o.target_return_pct && (
                <div className="rounded-xl bg-secondary/60 p-3">
                  <p className="text-xs text-muted-foreground">Target return</p>
                  <p className="mt-1 font-display text-base font-bold text-brand-green">{o.target_return_pct}%</p>
                </div>
              )}
            </div>

            <div className="mt-4">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{pct}% funded</span>
                {o.closes_at && <span>Closes {fmtDate(o.closes_at)}</span>}
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                <div className="gradient-brand h-full transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>

            {isOpen && (
              <button className="gradient-brand mt-4 w-full rounded-xl py-2.5 text-sm font-semibold text-white shadow-soft transition hover:opacity-90">
                {investLabel}
              </button>
            )}
          </article>
        );
      })}
    </div>
  );
}

function UpdatesTab({ posts, bizName, logo }: { posts: any[]; bizName: string; logo: string | null }) {
  if (!posts.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
        <MessageCircle className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="font-display text-lg font-bold">No updates yet</p>
        <p className="mt-2 text-sm text-muted-foreground">{bizName} hasn't posted any updates yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {posts.map((p: any) => (
        <article key={p.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center gap-3">
            {logo ? (
              <img src={logo} alt="" className="h-9 w-9 rounded-lg object-cover" />
            ) : (
              <div className="gradient-brand flex h-9 w-9 shrink-0 items-center justify-center rounded-lg">
                <Building2 className="h-4 w-4 text-white" />
              </div>
            )}
            <div>
              <p className="text-sm font-semibold">{bizName}</p>
              <p className="text-xs text-muted-foreground">{fmtDate(p.created_at)}</p>
            </div>
            {p.category && (
              <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                {p.category}
              </span>
            )}
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{p.content}</p>
        </article>
      ))}
    </div>
  );
}

function TeamTab({ owner, biz }: { owner: any; biz: any }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center">
        <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
        <p className="font-display text-lg font-bold">Team profiles coming soon</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Business owners will be able to add co-founders, employees, and advisors.
        </p>
      </div>

      {owner && (
        <section>
          <h2 className="font-display text-base font-bold">Founder</h2>
          <div className="mt-3 flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-card">
            {owner.avatar_url ? (
              <img src={owner.avatar_url} alt="" className="h-12 w-12 rounded-full object-cover" />
            ) : (
              <div className="gradient-brand flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white text-sm font-bold">
                {(owner.full_name ?? owner.username ?? "?")[0].toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-semibold">{owner.full_name ?? owner.username ?? "Anonymous"}</p>
              {owner.username && <p className="text-xs text-muted-foreground">@{owner.username}</p>}
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                <FileText className="h-3 w-3" /> Founder
              </span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function PassportSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="h-72 w-full animate-pulse bg-muted" />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex items-end gap-4 -mt-14 pb-6">
          <div className="h-24 w-24 animate-pulse rounded-2xl bg-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-8 w-48 animate-pulse rounded-xl bg-muted" />
            <div className="h-4 w-72 animate-pulse rounded-xl bg-muted" />
          </div>
        </div>
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
          <div className="hidden space-y-4 lg:block">
            <div className="h-40 animate-pulse rounded-2xl bg-muted" />
            <div className="h-24 animate-pulse rounded-2xl bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
