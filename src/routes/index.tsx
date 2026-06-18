import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  homeHero,
  homeInvest,
  homeCapital,
  homeBuild,
  homeBanner1,
  homeBanner2,
} from "@/assets/images";
import { useAuth } from "@/hooks/use-auth";
import {
  TrendingUp, Briefcase, Rocket, ShieldCheck, BadgeCheck, BarChart3,
  ArrowRight, Sparkles, MessageCircle, Users, Coins
} from "lucide-react";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "CoFund — Africa's Trusted Investment & Business Growth Platform" },
      { name: "description", content: "Invest in verified African businesses, raise capital, or build your startup. Escrow-protected and continuously monitored." },
      { property: "og:title", content: "CoFund — Together, We Grow" },
    ],
  }),
  component: PublicHome,
});

function PublicHome() {
  const { user, loading, profile } = useAuth();
  if (!loading && user && profile?.onboarded) throw redirect({ to: "/home" });
  if (!loading && user && profile && !profile.onboarded) throw redirect({ to: "/onboarding" });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <Hero />
      <TrustBanner />
      <PrimaryActions />
      <FeaturedOpportunities />
      <ImageBanner />
      <Stats />
      <CommunityPreview />
      <CTA />
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 gradient-mesh" />
      <div className="absolute inset-0 -z-10 [background-image:linear-gradient(to_right,oklch(1_0_0/0.025)_1px,transparent_1px),linear-gradient(to_bottom,oklch(1_0_0/0.025)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_75%)]" />

      <div className="mx-auto max-w-7xl px-4 pb-24 pt-16 sm:px-6 sm:pt-28 lg:px-8 lg:pb-32">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Africa's private investment platform
            </div>
            <h1 className="font-display text-5xl font-bold leading-[1.06] sm:text-6xl lg:text-[3.75rem]">
              Invest in Africa's{" "}
              <span className="text-gradient-brand">next great businesses</span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
              Connecting investors with verified businesses. Helping founders raise capital and build their legacy — backed by escrow protection and real trust scores.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="gradient-brand inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-brand transition hover:opacity-90"
              >
                Start investing <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/how-it-works" className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-6 py-3 text-sm font-semibold text-muted-foreground transition hover:border-white/20 hover:text-foreground">
                How it works
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-brand-green" /> Escrow protected</span>
              <span className="flex items-center gap-1.5"><BadgeCheck className="h-3.5 w-3.5 text-brand-green" /> KYC verified</span>
              <span className="flex items-center gap-1.5"><BarChart3 className="h-3.5 w-3.5 text-brand-green" /> Continuously monitored</span>
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative overflow-hidden rounded-3xl shadow-soft">
              <img src={homeHero} alt="African entrepreneurs" className="aspect-[4/3] w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
            </div>
            <div className="absolute -bottom-4 -left-4 rounded-2xl border border-white/10 bg-card/90 p-4 backdrop-blur shadow-soft">
              <p className="text-xs text-muted-foreground">Active investors</p>
              <p className="font-display text-2xl font-bold text-gradient-brand">2,400+</p>
            </div>
            <div className="absolute -right-4 top-8 rounded-2xl border border-white/10 bg-card/90 p-4 backdrop-blur shadow-soft">
              <p className="text-xs text-muted-foreground">Businesses verified</p>
              <p className="font-display text-2xl font-bold text-gradient-brand">180+</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBanner() {
  return (
    <section className="border-y border-white/[0.06] bg-card/40">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm text-muted-foreground">
          {[
            { Icon: ShieldCheck, text: "Escrow-protected transactions" },
            { Icon: BadgeCheck, text: "Every business verified" },
            { Icon: BarChart3, text: "Real-time milestone tracking" },
            { Icon: Users, text: "Community-backed growth" },
          ].map(({ Icon, text }) => (
            <span key={text} className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-primary" /> {text}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function PrimaryActions() {
  const actions = [
    {
      icon: TrendingUp,
      title: "Invest",
      desc: "Discover verified investment opportunities across multiple industries and sectors.",
      img: homeInvest,
    },
    {
      icon: Briefcase,
      title: "Raise Capital",
      desc: "Apply for funding to grow your business through CoFund's escrow-protected rounds.",
      img: homeCapital,
    },
    {
      icon: Rocket,
      title: "Build an Idea",
      desc: "Share your startup, find co-founders, mentors and capital on the Startup Hub.",
      img: homeBuild,
    },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Three paths</p>
        <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Pick your role on CoFund</h2>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        {actions.map((a) => (
          <div key={a.title} className="group overflow-hidden rounded-3xl border border-white/[0.06] bg-card transition hover:-translate-y-1 hover:shadow-brand">
            <div className="relative overflow-hidden aspect-[16/9]">
              <img src={a.img} alt={a.title} className="h-full w-full object-cover transition group-hover:scale-105 duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
              <div className="absolute bottom-4 left-5 gradient-brand inline-flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-brand">
                <a.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="p-6">
              <h3 className="font-display text-xl font-bold">{a.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{a.desc}</p>
              <Link to="/auth" search={{ mode: "signup" }}
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition hover:gap-2.5">
                Get started <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function fmtNGN(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(0)}K`;
  return `₦${n}`;
}

function FeaturedOpportunities() {
  const { data, isLoading } = useQuery({
    queryKey: ["public", "featured-opportunities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunities")
        .select("id,title,summary,goal_amount,raised_amount,target_return_pct,businesses(name,industry,logo_url)")
        .eq("featured", true).eq("status", "open")
        .order("created_at", { ascending: false }).limit(3);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (!isLoading && (!data || data.length === 0)) return null;

  return (
    <section className="bg-card/30 py-20 border-y border-white/[0.06]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Live now</p>
            <h2 className="mt-2 font-display text-3xl font-bold">Featured opportunities</h2>
          </div>
          <Link to="/auth" search={{ mode: "signup" }} className="hidden text-sm font-semibold text-primary hover:text-foreground transition sm:flex items-center gap-1">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[0,1,2].map(i => <div key={i} className="h-56 animate-pulse rounded-2xl bg-card" />)}
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {(data ?? []).map((o: any) => {
              const pct = o.goal_amount ? Math.min(100, Math.round((Number(o.raised_amount) / Number(o.goal_amount)) * 100)) : 0;
              return (
                <div key={o.id} className="flex flex-col rounded-2xl border border-white/[0.06] bg-card p-5">
                  <div className="flex items-center gap-3">
                    {o.businesses?.logo_url
                      ? <img src={o.businesses.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                      : <div className="gradient-brand h-10 w-10 shrink-0 rounded-lg" />
                    }
                    <div className="min-w-0">
                      <p className="truncate text-xs text-muted-foreground">{o.businesses?.industry}</p>
                      <p className="truncate text-sm font-semibold">{o.businesses?.name}</p>
                    </div>
                  </div>
                  <h3 className="mt-4 font-display text-lg font-bold leading-tight">{o.title}</h3>
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
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function ImageBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-2 items-center">
        <div className="space-y-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Built on trust</p>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
              Every business is verified. Every naira is protected.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Before any business lists on CoFund, they pass through verification, due diligence, and trust scoring. Your investment is held in escrow until agreed milestones are hit.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { Icon: ShieldCheck, label: "Escrow Protection", desc: "Funds held by banking partners" },
              { Icon: BadgeCheck, label: "Full KYC", desc: "BVN, phone & address verified" },
              { Icon: BarChart3, label: "Live Monitoring", desc: "Track milestones in real time" },
              { Icon: Coins, label: "Structured Returns", desc: "Clear terms, no surprises" },
            ].map(({ Icon, label, desc }) => (
              <div key={label} className="rounded-2xl border border-white/[0.06] bg-card p-4">
                <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <p className="text-sm font-semibold">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <img src={homeBanner1} alt="" className="rounded-2xl object-cover aspect-square w-full" />
          <img src={homeBanner2} alt="" className="rounded-2xl object-cover aspect-square w-full mt-8" />
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const { data } = useQuery({
    queryKey: ["public", "stats"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_stats").select("key,label,value,display_order").eq("visible", true).order("display_order");
      if (error) throw error;
      return data ?? [];
    },
  });

  const fallback = [
    { key: "investors", label: "Active investors", value: "2,400+" },
    { key: "businesses", label: "Verified businesses", value: "180+" },
    { key: "funded", label: "Capital raised", value: "₦2.1B+" },
    { key: "returns", label: "Avg. target return", value: "22%" },
  ];

  const stats = (data && data.length > 0) ? data : fallback;

  return (
    <section className="bg-card/30 border-y border-white/[0.06] py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {stats.map((s: any) => (
            <div key={s.key} className="text-center">
              <p className="font-display text-4xl font-bold text-gradient-brand">{s.value}</p>
              <p className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CommunityPreview() {
  const { data } = useQuery({
    queryKey: ["public", "posts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("posts").select("id,content,created_at,profiles(full_name)").order("created_at", { ascending: false }).limit(4);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid gap-12 lg:grid-cols-2 items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Community</p>
          <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Founders and investors, together</h2>
          <p className="mt-4 text-muted-foreground leading-relaxed">
            The CoFund community is where deals get discovered, knowledge gets shared, and partnerships form. Join thousands of operators across Africa.
          </p>
          <Link to="/auth" search={{ mode: "signup" }}
            className="mt-6 inline-flex items-center gap-2 gradient-brand rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-brand hover:opacity-90 transition">
            Join the community <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="space-y-3">
          {!data || data.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-card/40 p-8 text-center text-sm text-muted-foreground">
              Be the first to start a discussion.
            </div>
          ) : (
            data.map((p: any) => (
              <div key={p.id} className="flex items-start gap-3 rounded-2xl border border-white/[0.06] bg-card p-4">
                <div className="gradient-brand flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
                  {(p.profiles?.full_name ?? "U").charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{p.profiles?.full_name ?? "Member"}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">{p.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 pb-20 sm:px-6 lg:px-8">
      <div className="relative overflow-hidden rounded-3xl gradient-brand px-8 py-16 text-center shadow-brand">
        <div className="absolute inset-0 [background-image:linear-gradient(to_right,oklch(1_0_0/0.04)_1px,transparent_1px),linear-gradient(to_bottom,oklch(1_0_0/0.04)_1px,transparent_1px)] [background-size:40px_40px]" />
        <div className="relative">
          <h2 className="font-display text-4xl font-bold text-white sm:text-5xl">Together, we grow.</h2>
          <p className="mx-auto mt-4 max-w-xl text-white/80 text-lg">
            Join Africa's business ecosystem and start your CoFund journey today.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to="/auth" search={{ mode: "signup" }}
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-primary shadow-soft hover:bg-white/95 transition">
              Create your account <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/how-it-works"
              className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10 transition">
              Learn more
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
