import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/hooks/use-auth";
import { MessageCircle, Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({ meta: [{ title: "Home · CoFund" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { profile, loading, roles } = useAuth();
  if (!loading && profile && !profile.onboarded) throw redirect({ to: "/onboarding" });

  const greeting = greetingForNow();
  const name = profile?.full_name?.split(" ")[0] ?? "there";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">{greeting}</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold sm:text-4xl">Welcome back, {name}.</h1>
          <p className="mt-1 text-muted-foreground">Here's what's happening in your CoFund world today.</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          <FeaturedOpportunity />
          <div className="space-y-6 lg:col-span-2">
            <CommunityFeed />
          </div>
        </div>

        {roles.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display text-xl font-bold">Your active roles</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {roles.map((r) => (
                <span key={r} className="rounded-full border border-border bg-card px-3 py-1 text-xs font-medium capitalize text-muted-foreground">
                  {r.replace("_", " ")}
                </span>
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}

function greetingForNow() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function FeaturedOpportunity() {
  const { data } = useQuery({
    queryKey: ["dash", "featured-opp"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunities")
        .select("id,title,goal_amount,raised_amount,target_return_pct,businesses(name,industry,logo_url)")
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
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
        <Sparkles className="h-3.5 w-3.5" /> Featured opportunity
      </p>
      {data ? (
        <>
          <h3 className="mt-3 font-display text-xl font-bold">{(data as any).title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{(data as any).businesses?.name}</p>
          <Link to="/browse" className="gradient-brand mt-5 inline-flex rounded-lg px-4 py-2 text-sm font-semibold text-white">
            View opportunity
          </Link>
        </>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">No featured opportunities yet.</p>
      )}
    </div>
  );
}

function CommunityFeed() {
  const { data, isLoading } = useQuery({
    queryKey: ["dash", "feed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("id,content,created_at,profiles(full_name)")
        .order("created_at", { ascending: false })
        .limit(8);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
        <MessageCircle className="h-3.5 w-3.5" /> Community feed
      </p>
      <div className="mt-4 space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No posts yet. Be the first to share something.</p>
        ) : (
          data.map((p: any) => (
            <div key={p.id} className="border-b border-border pb-3 last:border-0">
              <p className="text-sm font-semibold">{p.profiles?.full_name ?? "Member"}</p>
              <p className="mt-1 text-sm text-muted-foreground">{p.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}