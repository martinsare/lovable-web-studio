import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePlatformStats, fmtInvestors, fmtBusinesses, fmtReturn } from "@/hooks/use-platform-stats";
import { AppLayout } from "@/components/app-layout";
import { useAuth } from "@/hooks/use-auth";
import { fetchPostsWithAuthors } from "@/lib/post-feed";
import {
  MessageCircle,
  Sparkles,
  ArrowRight,
  TrendingUp,
  BarChart3,
  Wallet,
  Building2,
  Clock,
  Users,
  ChevronRight,
  Flame,
  Send,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({ meta: [{ title: "Dashboard · CoFund" }] }),
  component: Dashboard,
});

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function Dashboard() {
  const { profile, loading, roles } = useAuth();
  if (!loading && profile && !profile.onboarded) throw redirect({ to: "/onboarding" });
  const name = profile?.full_name?.split(" ")[0] ?? "there";

  return (
    <AppLayout>
      <div className="min-h-full bg-background">
        <PortfolioHero greeting={greeting()} name={name} />
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
            <CommunityFeed />
            <aside className="space-y-8">
              <FeaturedOpportunity />
              <QuickActions roles={roles} />
              <PlatformStats />
            </aside>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function PortfolioHero({ greeting: g, name }: { greeting: string; name: string }) {
  return (
    <div className="relative overflow-hidden border-b border-border/40">
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute right-0 top-0 h-64 w-96 bg-[radial-gradient(ellipse_at_top_right,oklch(0.65_0.18_160/0.10)_0%,transparent_70%)]" />
      <div className="relative mx-auto max-w-6xl px-4 pt-8 pb-0 sm:px-6 lg:px-8">
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground">
              {g},{" "}
              <span className="font-semibold text-foreground">{name}</span>
            </p>
            <div className="mt-6">
              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
                Total portfolio value
              </p>
              <p className="mt-2 font-display text-6xl font-bold tracking-tight sm:text-7xl">
                ₦0
              </p>
              <p className="mt-2.5 text-sm text-muted-foreground max-w-xs">
                Invest in your first deal to start building your African portfolio.
              </p>
            </div>
          </div>
          <Link
            to="/browse"
            className="hidden sm:inline-flex shrink-0 items-center gap-2 rounded-xl gradient-brand px-6 py-3 text-sm font-bold text-primary-foreground shadow-brand transition hover:opacity-90 mt-2"
          >
            Explore deals <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-10 grid grid-cols-3 border-t border-border divide-x divide-border">
          {[
            { label: "Active positions", value: "0", icon: TrendingUp },
            { label: "Wallet balance", value: "₦0", icon: Wallet },
            { label: "Pending actions", value: "0", icon: Clock },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3 px-5 py-4 first:pl-0">
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground/60" />
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
  );
}

function CommunityFeed() {
  const [draft, setDraft] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["dash", "feed"],
    queryFn: async () => {
      try {
        return await fetchPostsWithAuthors(12);
      } catch {
        return [];
      }
    },
  });

  return (
    <section>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-lg font-bold">Community</h2>
        <Link
          to="/community"
          className="flex items-center gap-1 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
        >
          See all <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="mb-8 flex items-start gap-3">
        <div className="h-8 w-8 shrink-0 rounded-full gradient-brand flex items-center justify-center text-xs font-bold text-primary-foreground">
          Y
        </div>
        <div className="flex-1 rounded-2xl border border-border bg-card px-4 py-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Share something with the community…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
          />
          {draft.length > 0 && (
            <div className="mt-3 flex justify-end">
              <Link
                to="/community"
                className="inline-flex items-center gap-1.5 rounded-lg gradient-brand px-3 py-1.5 text-xs font-bold text-primary-foreground"
              >
                <Send className="h-3 w-3" /> Post
              </Link>
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3.5">
              <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-secondary" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 w-28 animate-pulse rounded bg-secondary" />
                <div className="h-3 w-full animate-pulse rounded bg-secondary" />
                <div className="h-3 w-4/5 animate-pulse rounded bg-secondary" />
              </div>
            </div>
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="py-12 text-center">
          <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center">
            <MessageCircle className="h-6 w-6 text-muted-foreground/50" />
          </div>
          <p className="font-display text-base font-semibold">Nothing here yet</p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Be the first to post something to the CoFund community.
          </p>
          <Link
            to="/community"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
          >
            Go to community <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-border/60">
          {data.map((p: any) => (
            <div key={p.id} className="flex items-start gap-3.5 py-5 first:pt-0">
              {p.profile?.username ? (
                <Link to="/users/$username" params={{ username: p.profile.username }} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full gradient-brand text-xs font-bold text-primary-foreground transition hover:opacity-80">
                  {(p.profile?.full_name ?? "U").charAt(0)}
                </Link>
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full gradient-brand text-xs font-bold text-primary-foreground">
                  {(p.profile?.full_name ?? "U").charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  {p.profile?.username ? (
                    <Link to="/users/$username" params={{ username: p.profile.username }} className="text-sm font-semibold leading-none hover:text-primary transition-colors">
                      {p.profile?.full_name ?? "Member"}
                    </Link>
                  ) : (
                    <p className="text-sm font-semibold leading-none">
                      {p.profile?.full_name ?? "Member"}
                    </p>
                  )}
                  {p.created_at && (
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-3">
                  {p.content}
                </p>
                <div className="mt-3 flex items-center gap-4">
                  <button className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition">
                    <MessageCircle className="h-3.5 w-3.5" /> Reply
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function FeaturedOpportunity() {
  const { data } = useQuery({
    queryKey: ["dash", "featured-opp"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunities")
        .select("id,title,goal_amount,raised_amount,target_return_pct,businesses(name,industry)")
        .eq("featured", true)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const raised = (data as any)?.raised_amount ?? 0;
  const goal = (data as any)?.goal_amount ?? 1;
  const progress = Math.min((raised / goal) * 100, 100);

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-4">
        <Flame className="h-3.5 w-3.5 text-gold" />
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
          Featured round
        </p>
      </div>

      {data ? (
        <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card">
          {/* Full-card overlay link */}
          <Link
            to="/offerings/$opportunityId"
            params={{ opportunityId: (data as any).id }}
            className="absolute inset-0 z-0 rounded-2xl"
            aria-label={`View ${(data as any).title} offering details`}
          />
          <div className="absolute top-0 inset-x-0 h-px gradient-brand" />
          <div className="p-5">
            <div className="flex items-center gap-1.5 mb-4">
              <div className="h-2 w-2 rounded-full bg-brand-green animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-green">
                Live
              </span>
            </div>
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 shrink-0 rounded-xl gradient-brand" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  {(data as any).businesses?.industry}
                </p>
                <p className="text-sm font-bold truncate">{(data as any).businesses?.name}</p>
              </div>
            </div>
            <h3 className="font-display text-sm font-bold leading-snug text-foreground">
              {(data as any).title}
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-background/60 p-3.5">
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">Target return</p>
                <p className="font-display text-2xl font-bold text-brand-green">
                  {(data as any).target_return_pct ?? "—"}%
                </p>
                <p className="text-[10px] text-muted-foreground">per annum</p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground mb-0.5">Funding goal</p>
                <p className="font-display text-xl font-bold">
                  {goal >= 1_000_000
                    ? `₦${(goal / 1_000_000).toFixed(0)}M`
                    : `₦${goal.toLocaleString()}`}
                </p>
                <p className="text-[10px] text-muted-foreground">this round</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5">
                <span>{progress.toFixed(0)}% funded</span>
                <span>
                  {raised >= 1_000_000
                    ? `₦${(raised / 1_000_000).toFixed(1)}M`
                    : `₦${raised.toLocaleString()}`}{" "}
                  raised
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-green transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <Link
              to="/offerings/$opportunityId"
              params={{ opportunityId: (data as any).id }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 mt-5 flex w-full items-center justify-center gap-2 rounded-xl gradient-brand py-3 text-sm font-bold text-primary-foreground shadow-brand transition hover:opacity-90"
            >
              View opportunity <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/60 p-8 text-center">
          <Sparkles className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm font-semibold">No featured round yet</p>
          <p className="mt-1 text-xs text-muted-foreground">New opportunities drop weekly</p>
          <Link
            to="/browse"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-primary"
          >
            Browse all deals <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}

function QuickActions({ roles }: { roles: string[] }) {
  const actions = [
    { to: "/browse", icon: TrendingUp, label: "Browse deals", desc: "Verified African opportunities" },
    { to: "/community", icon: MessageCircle, label: "Community", desc: "See what's trending" },
    ...(roles.includes("investor")
      ? [
          { to: "/portfolio", icon: BarChart3, label: "My portfolio", desc: "Track your investments" },
          { to: "/wallet", icon: Wallet, label: "Wallet", desc: "Fund or withdraw" },
        ]
      : []),
    ...(roles.includes("business_owner")
      ? [{ to: "/my-business", icon: Building2, label: "My business", desc: "Manage your listing" }]
      : []),
  ].slice(0, 4);

  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">
        Quick access
      </p>
      <div className="space-y-0.5">
        {actions.map(({ to, icon: Icon, label, desc }) => (
          <Link
            key={to}
            to={to as never}
            className="group flex items-center gap-3.5 rounded-xl px-3 py-2.5 transition hover:bg-secondary/60 -mx-3"
          >
            <Icon className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-none">{label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}

function PlatformStats() {
  const { data: stats } = usePlatformStats();
  const rows = [
    { label: "Active investors", value: fmtInvestors(stats?.investorCount ?? null), icon: Users },
    { label: "Verified businesses", value: fmtBusinesses(stats?.verifiedBusinessCount ?? null), icon: Building2 },
    { label: "Avg. target return", value: fmtReturn(stats?.avgTargetReturn ?? null), icon: TrendingUp },
  ];
  return (
    <div className="border-t border-border pt-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">
        Platform
      </p>
      <div className="space-y-3">
        {rows.map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {label}
            </div>
            <span className="text-sm font-bold text-foreground">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
