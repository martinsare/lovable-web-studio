import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/hooks/use-auth";
import logo from "@/assets/cofund-logo.png.asset.json";
import {
  TrendingUp,
  Briefcase,
  Rocket,
  ShieldCheck,
  BadgeCheck,
  BarChart3,
  ArrowRight,
  Sparkles,
  MessageCircle,
  BookOpen,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CoFund — Africa's Trusted Investment & Business Growth Platform" },
      {
        name: "description",
        content:
          "Invest in verified African businesses, raise capital for your venture, or build the next great startup. Escrow-protected and continuously monitored.",
      },
      { property: "og:title", content: "CoFund — Together, We Grow" },
      {
        property: "og:description",
        content: "Connecting investors with verified African businesses.",
      },
    ],
  }),
  component: PublicHome,
});

function PublicHome() {
  const { user, loading, profile } = useAuth();

  // Redirect signed-in (onboarded) users to the dashboard
  if (!loading && user && profile?.onboarded) {
    throw redirect({ to: "/home" });
  }
  if (!loading && user && profile && !profile.onboarded) {
    throw redirect({ to: "/onboarding" });
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <Hero />
      <PrimaryActions />
      <TrustSection />
      <FeaturedOpportunities />
      <BusinessSpotlight />
      <CommunityPreview />
      <LearningSection />
      <Stats />
      <Partners />
      <CTA />
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 gradient-mesh" />
      <div className="absolute inset-0 -z-10 grid-bg opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:px-8 lg:pb-28">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-soft backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Welcome to CoFund · Together, we grow
          </div>
          <h1 className="font-display text-4xl font-extrabold leading-[1.04] sm:text-5xl lg:text-[4rem]">
            Africa's trusted private{" "}
            <span className="text-gradient-brand">investment & business</span> growth platform
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Connecting investors with verified businesses while helping entrepreneurs
            build, grow, and raise capital — all backed by escrow protection.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="gradient-brand inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-brand transition hover:opacity-90"
            >
              Join CoFund <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/how-it-works" className="rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted">
              How it works
            </Link>
          </div>
          <div className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-x-8 gap-y-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-brand-green" /> Escrow protected</span>
            <span className="flex items-center gap-1.5"><BadgeCheck className="h-3.5 w-3.5 text-brand-green" /> KYC verified</span>
            <span className="flex items-center gap-1.5"><BarChart3 className="h-3.5 w-3.5 text-brand-green" /> Continuously monitored</span>
          </div>
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
      desc: "Discover verified investment opportunities across multiple industries.",
      cta: "Explore Investments",
    },
    {
      icon: Briefcase,
      title: "Raise Capital",
      desc: "Apply for funding to grow your business through CoFund.",
      cta: "Apply for Funding",
    },
    {
      icon: Rocket,
      title: "Build an Idea",
      desc: "Share your startup idea, find collaborators, mentors and capital.",
      cta: "Start Building",
    },
  ];
  return (
    <section id="how" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid gap-5 md:grid-cols-3">
        {actions.map((a) => (
          <div
            key={a.title}
            className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-brand"
          >
            <div className="gradient-brand mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl text-white">
              <a.icon className="h-6 w-6" />
            </div>
            <h3 className="font-display text-xl font-bold">{a.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{a.desc}</p>
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary"
            >
              {a.cta} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

function TrustSection() {
  const items = [
    { icon: ShieldCheck, title: "Escrow Protection", desc: "Funds are securely managed through trusted banking partners." },
    { icon: BadgeCheck, title: "Verified Businesses", desc: "Every business undergoes due diligence before listing." },
    { icon: BarChart3, title: "Active Monitoring", desc: "Businesses are monitored throughout the investment lifecycle." },
  ];
  return (
    <section className="bg-secondary/40 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Why CoFund</p>
          <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">Trust, built into every step</h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {items.map((it) => (
            <div key={it.title} className="rounded-2xl border border-border bg-card p-6">
              <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-green/15 text-brand-green">
                <it.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-lg font-bold">{it.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{it.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function fmtNGN(n: number) {
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
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
        .eq("featured", true)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeader eyebrow="Featured" title="Live opportunities" subtitle="Hand-picked deals open for funding right now." />
      {isLoading ? (
        <SkeletonGrid count={3} />
      ) : !data || data.length === 0 ? (
        <EmptyState text="Featured opportunities will appear here once businesses are listed." />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((o: any) => {
            const pct = o.goal_amount ? Math.min(100, Math.round((Number(o.raised_amount) / Number(o.goal_amount)) * 100)) : 0;
            return (
              <div key={o.id} className="rounded-2xl border border-border bg-card p-5 shadow-soft">
                <div className="flex items-center gap-3">
                  {o.businesses?.logo_url ? (
                    <img src={o.businesses.logo_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  ) : (
                    <div className="gradient-brand h-10 w-10 rounded-lg" />
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground">{o.businesses?.industry ?? "Business"}</p>
                    <p className="text-sm font-semibold">{o.businesses?.name}</p>
                  </div>
                </div>
                <h3 className="mt-4 font-display text-lg font-bold">{o.title}</h3>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{pct}% funded</span>
                    <span>{fmtNGN(Number(o.goal_amount))} goal</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="gradient-brand h-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                {o.target_return_pct && (
                  <p className="mt-3 text-sm">
                    <span className="text-muted-foreground">Target return </span>
                    <span className="font-semibold text-brand-green">{o.target_return_pct}%</span>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function BusinessSpotlight() {
  const { data } = useQuery({
    queryKey: ["public", "spotlight"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id,name,industry,logo_url,cover_url,founded_year,followers_count,revenue_growth_pct,tagline")
        .eq("spotlight", true)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  if (!data) return null;
  return (
    <section className="bg-secondary/40 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Spotlight" title="Business of the week" />
        <div className="grid gap-6 rounded-3xl border border-border bg-card p-6 shadow-soft md:grid-cols-2 md:p-10">
          <div>
            <div className="flex items-center gap-3">
              {data.logo_url && <img src={data.logo_url} alt="" className="h-14 w-14 rounded-xl object-cover" />}
              <div>
                <h3 className="font-display text-2xl font-bold">{data.name}</h3>
                <p className="text-sm text-muted-foreground">{data.industry}</p>
              </div>
            </div>
            {data.tagline && <p className="mt-4 text-muted-foreground">{data.tagline}</p>}
            <div className="mt-6 grid grid-cols-3 gap-4">
              {data.founded_year && <Stat label="Founded" value={String(data.founded_year)} />}
              {data.revenue_growth_pct != null && <Stat label="Revenue Growth" value={`${data.revenue_growth_pct}%`} />}
              <Stat label="Followers" value={String(data.followers_count ?? 0)} />
            </div>
          </div>
          {data.cover_url && (
            <img src={data.cover_url} alt="" className="aspect-video w-full rounded-2xl object-cover" />
          )}
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-secondary/60 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-lg font-bold">{value}</p>
    </div>
  );
}

function CommunityPreview() {
  const { data } = useQuery({
    queryKey: ["public", "posts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("id,content,category,created_at,profiles(full_name,avatar_url)")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <SectionHeader eyebrow="Community" title="Recent activity" icon={<MessageCircle className="h-5 w-5" />} />
      {!data || data.length === 0 ? (
        <EmptyState text="Once people start sharing in the community, their posts will appear here." />
      ) : (
        <div className="space-y-3">
          {data.map((p: any) => (
            <div key={p.id} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
              <div className="gradient-brand flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
                {(p.profiles?.full_name ?? "U").charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{p.profiles?.full_name ?? "Member"}</p>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{p.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function LearningSection() {
  const { data } = useQuery({
    queryKey: ["public", "articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learning_articles")
        .select("id,title,excerpt,category,cover_url,slug")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (!data || data.length === 0) return null;
  return (
    <section className="bg-secondary/40 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeader eyebrow="Knowledge" title="Business resources" icon={<BookOpen className="h-5 w-5" />} />
        <div className="grid gap-5 md:grid-cols-3">
          {data.map((a: any) => (
            <div key={a.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
              {a.cover_url && <img src={a.cover_url} alt="" className="aspect-video w-full object-cover" />}
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">{a.category}</p>
                <h3 className="mt-1 font-display text-lg font-bold">{a.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{a.excerpt}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const { data } = useQuery({
    queryKey: ["public", "stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_stats")
        .select("key,label,value,display_order")
        .eq("visible", true)
        .order("display_order");
      if (error) throw error;
      return data ?? [];
    },
  });
  if (!data || data.length === 0) return null;
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid gap-4 rounded-3xl border border-border bg-card p-6 shadow-soft sm:grid-cols-2 md:grid-cols-4">
        {data.map((s) => (
          <div key={s.key} className="text-center">
            <p className="font-display text-3xl font-extrabold text-gradient-brand">{s.value}</p>
            <p className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Partners() {
  const { data } = useQuery({
    queryKey: ["public", "partners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("partners")
        .select("id,name,logo_url,url")
        .eq("active", true)
        .order("display_order");
      if (error) throw error;
      return data ?? [];
    },
  });
  if (!data || data.length === 0) return null;
  return (
    <section className="border-t border-border bg-background py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">Trusted by</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-6 opacity-80">
          {data.map((p) =>
            p.logo_url ? (
              <img key={p.id} src={p.logo_url} alt={p.name} className="h-7 object-contain" />
            ) : (
              <span key={p.id} className="font-display text-lg font-bold text-muted-foreground">{p.name}</span>
            ),
          )}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="gradient-brand relative overflow-hidden rounded-3xl px-6 py-12 text-center text-white shadow-brand sm:py-16">
        <img src={logo.url} alt="" className="absolute -right-10 -top-10 h-48 w-48 opacity-10" />
        <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Together, we grow.</h2>
        <p className="mx-auto mt-3 max-w-xl text-white/90">
          Join Africa's business ecosystem and start your CoFund journey today.
        </p>
        <Link
          to="/auth"
          search={{ mode: "signup" }}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-primary shadow-soft hover:bg-white/95"
        >
          Create your account <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function SectionHeader({ eyebrow, title, subtitle, icon }: { eyebrow: string; title: string; subtitle?: string; icon?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary">
          {icon}
          {eyebrow}
        </p>
        <h2 className="mt-1 text-2xl font-extrabold sm:text-3xl">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}

function SkeletonGrid({ count }: { count: number }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-56 animate-pulse rounded-2xl border border-border bg-card" />
      ))}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/40 p-10 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}
