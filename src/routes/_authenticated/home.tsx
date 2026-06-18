import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
      <div className="min-h-full">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
          <WelcomeHeader greeting={greeting()} name={name} roles={roles} />
          <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
            <div className="space-y-8 min-w-0">
              <QuickStats />
              <CommunityFeed />
            </div>
            <div className="space-y-5">
              <FeaturedOpportunity />
              <QuickActions roles={roles} />
              <ActivityItem />
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function WelcomeHeader({ greeting: g, name, roles }: { greeting: string; name: string; roles: string[] }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-7 shadow-card">
      <div className="absolute inset-0 -z-10 gradient-hero opacity-80" />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{g}</p>
          <h1 className="mt-1 font-display text-3xl font-bold">{name} 👋</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Here's what's happening in your CoFund world today.
          </p>
          {roles.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {roles.map((r) => (
                <span
                  key={r}
                  className="inline-flex items-center rounded-full border border-primary/20 bg-primary/8 px-3 py-1 text-xs font-semibold capitalize text-primary"
                >
                  {r.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          )}
        </div>
        <Link
          to="/browse"
          className="hidden shrink-0 items-center gap-2 rounded-xl gradient-brand px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-brand transition hover:opacity-90 sm:flex"
        >
          Browse deals <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

function QuickStats() {
  const stats = [
    { icon: BarChart3, label: "Portfolio value", value: "₦0", color: "text-primary bg-primary/10" },
    { icon: TrendingUp, label: "Active positions", value: "0", color: "text-brand-green bg-brand-green/10" },
    { icon: Wallet, label: "Wallet balance", value: "₦0", color: "text-gold bg-gold/10" },
    { icon: Clock, label: "Pending actions", value: "0", color: "text-muted-foreground bg-secondary" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-2xl border border-border bg-card p-4 shadow-card">
          <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl ${stat.color}`}>
            <stat.icon className="h-4.5 w-4.5" />
          </div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">{stat.label}</p>
          <p className="mt-1 font-display text-xl font-bold">{stat.value}</p>
        </div>
      ))}
    </div>
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

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Featured round
        </p>
        {data && (
          <span className="rounded-full bg-brand-green/10 px-2.5 py-1 text-[10px] font-semibold text-brand-green">
            LIVE
          </span>
        )}
      </div>

      {data ? (
        <>
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 shrink-0 rounded-lg gradient-brand" />
            <div className="min-w-0">
              <p className="truncate text-[11px] text-muted-foreground">{(data as any).businesses?.industry}</p>
              <p className="truncate text-sm font-semibold">{(data as any).businesses?.name}</p>
            </div>
          </div>
          <h3 className="mt-3.5 font-display text-base font-bold leading-snug">{(data as any).title}</h3>
          {(data as any).target_return_pct && (
            <div className="mt-3 flex items-center justify-between rounded-xl bg-brand-green/8 px-3.5 py-2.5">
              <span className="text-xs text-muted-foreground">Target return</span>
              <span className="font-display text-lg font-bold text-brand-green">{(data as any).target_return_pct}%</span>
            </div>
          )}
          <Link
            to="/browse"
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl gradient-brand py-2.5 text-sm font-semibold text-primary-foreground shadow-brand transition hover:opacity-90"
          >
            View opportunity <ArrowRight className="h-4 w-4" />
          </Link>
        </>
      ) : (
        <div className="text-center py-4">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-muted-foreground">
            <Sparkles className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium">No featured round right now</p>
          <p className="mt-1 text-xs text-muted-foreground">New opportunities are added weekly</p>
          <Link
            to="/browse"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition hover:text-foreground"
          >
            Browse all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}

function QuickActions({ roles }: { roles: string[] }) {
  const actions = [
    { to: "/browse", icon: TrendingUp, label: "Browse opportunities", desc: "Find your next investment" },
    { to: "/community", icon: MessageCircle, label: "Community", desc: "See what's trending" },
    ...(roles.includes("investor")
      ? [
          { to: "/portfolio", icon: BarChart3, label: "My portfolio", desc: "Track investments" },
          { to: "/wallet", icon: Wallet, label: "Wallet", desc: "Manage your balance" },
        ]
      : []),
    ...(roles.includes("business_owner")
      ? [{ to: "/my-business", icon: Building2, label: "My business", desc: "Manage your listing" }]
      : []),
  ].slice(0, 4);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Quick actions</p>
      <div className="space-y-1.5">
        {actions.map(({ to, icon: Icon, label, desc }) => (
          <Link
            key={to}
            to={to as never}
            className="group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition hover:bg-secondary/60"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition">
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{label}</p>
              <p className="truncate text-xs text-muted-foreground">{desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/40 group-hover:text-muted-foreground transition" />
          </Link>
        ))}
      </div>
    </div>
  );
}

function ActivityItem() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Platform stats</p>
      </div>
      <div className="space-y-3">
        {[
          { label: "Active investors", value: "2,400+", icon: Users },
          { label: "Verified businesses", value: "180+", icon: Building2 },
          { label: "Avg. target return", value: "22% p.a.", icon: TrendingUp },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </div>
            <span className="text-sm font-semibold text-foreground">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CommunityFeed() {
  const { data, isLoading } = useQuery({
    queryKey: ["dash", "feed"],
    queryFn: async () => {
      try {
        return await fetchPostsWithAuthors(10);
      } catch {
        return [];
      }
    },
  });

  return (
    <div className="rounded-2xl border border-border bg-card shadow-card">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <MessageCircle className="h-4 w-4 text-primary" />
          Community feed
        </p>
        <Link
          to="/community"
          className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition hover:text-foreground"
        >
          See all <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="divide-y divide-border">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-5">
              <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-secondary" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-24 animate-pulse rounded bg-secondary" />
                <div className="h-3 w-full animate-pulse rounded bg-secondary" />
                <div className="h-3 w-3/4 animate-pulse rounded bg-secondary" />
              </div>
            </div>
          ))
        ) : !data || data.length === 0 ? (
          <div className="p-10 text-center">
            <MessageCircle className="mx-auto mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm font-medium">No posts yet</p>
            <p className="mt-1 text-xs text-muted-foreground">Be the first to share something with the community.</p>
            <Link
              to="/community"
              className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary"
            >
              Go to community <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ) : (
          data.map((p: any) => (
            <div key={p.id} className="flex items-start gap-4 px-6 py-4">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full gradient-brand text-xs font-bold text-primary-foreground">
                {(p.profile?.full_name ?? "U").charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{p.profile?.full_name ?? "Member"}</p>
                  {p.created_at && (
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">{p.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
