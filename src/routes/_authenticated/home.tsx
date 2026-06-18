import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/hooks/use-auth";
import { fetchPostsWithAuthors } from "@/lib/post-feed";
import { MessageCircle, Sparkles, ArrowRight, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({ meta: [{ title: "Home · CoFund" }] }),
  component: Dashboard,
});

function greetingForNow() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function Dashboard() {
  const { profile, loading, roles } = useAuth();
  if (!loading && profile && !profile.onboarded) throw redirect({ to: "/onboarding" });

  const greeting = greetingForNow();
  const name = profile?.full_name?.split(" ")[0] ?? "there";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8 relative overflow-hidden rounded-3xl border border-white/[0.06] bg-card p-8">
          <div className="absolute inset-0 -z-10 gradient-mesh opacity-60" />
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">{greeting}</p>
          <h1 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Welcome back, {name}.</h1>
          <p className="mt-1.5 text-muted-foreground">Here's what's happening in your CoFund world today.</p>
          {roles.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {roles.map((r) => (
                <span key={r} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium capitalize text-muted-foreground">
                  {r.replace("_", " ")}
                </span>
              ))}
            </div>
          )}
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6">
            <FeaturedOpportunity />
            <QuickLinks />
          </div>
          <div className="lg:col-span-2">
            <CommunityFeed />
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function FeaturedOpportunity() {
  const { data } = useQuery({
    queryKey: ["dash", "featured-opp"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunities")
        .select("id,title,goal_amount,raised_amount,target_return_pct,businesses(name,industry,logo_url)")
        .eq("featured", true).eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-card p-5">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
        <Sparkles className="h-3.5 w-3.5" /> Featured
      </p>
      {data ? (
        <>
          <h3 className="mt-3 font-display text-lg font-bold leading-tight">{(data as any).title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{(data as any).businesses?.name}</p>
          {(data as any).target_return_pct && (
            <p className="mt-2 text-sm text-muted-foreground">
              Target return <span className="font-semibold text-brand-green">{(data as any).target_return_pct}%</span>
            </p>
          )}
          <Link to="/browse" className="gradient-brand mt-4 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-brand">
            View <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </>
      ) : (
        <div className="mt-3">
          <p className="text-sm text-muted-foreground">No featured opportunities yet.</p>
          <Link to="/browse" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary">
            Browse all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}

function QuickLinks() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-card p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Quick actions</p>
      <div className="mt-3 space-y-2">
        {[
          { to: "/browse", icon: TrendingUp, label: "Browse opportunities" },
          { to: "/community", icon: MessageCircle, label: "Community feed" },
        ].map(({ to, icon: Icon, label }) => (
          <Link key={to} to={to as never}
            className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-secondary/40 px-4 py-3 text-sm font-medium transition hover:bg-white/5 hover:text-foreground text-muted-foreground">
            <Icon className="h-4 w-4 text-primary" /> {label}
          </Link>
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
    <div className="rounded-2xl border border-white/[0.06] bg-card p-6">
      <div className="mb-5 flex items-center justify-between">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
          <MessageCircle className="h-3.5 w-3.5" /> Community feed
        </p>
        <Link to="/community" className="text-xs font-medium text-muted-foreground hover:text-foreground transition">
          See all
        </Link>
      </div>
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-secondary/50" />)
        ) : !data || data.length === 0 ? (
          <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-muted-foreground">
            No posts yet. Be the first to share something.
          </div>
        ) : (
          data.map((p: any) => (
            <div key={p.id} className="flex items-start gap-3 rounded-xl border border-white/[0.04] bg-secondary/30 p-4">
              <div className="gradient-brand flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
                {(p.profile?.full_name ?? "U").charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{p.profile?.full_name ?? "Member"}</p>
                <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">{p.content}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
