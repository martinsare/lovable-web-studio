import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { usePlatformStats, fmtInvestors, fmtBusinesses, fmtReturn, fmtCapital } from "@/hooks/use-platform-stats";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  homeHero,
  homeInvest,
  homeCapital,
  homeBuild,
} from "@/assets/images";
import { useAuth } from "@/hooks/use-auth";
import {
  TrendingUp,
  Briefcase,
  Rocket,
  ShieldCheck,
  BadgeCheck,
  BarChart3,
  ArrowRight,
  MessageCircle,
  Users,
  CheckCircle2,
  Star,
  Globe,
} from "lucide-react";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "CoFund — Africa's Trusted Investment & Business Growth Platform" },
      {
        name: "description",
        content:
          "Invest in verified African businesses, raise capital, or build your startup. Escrow-protected and continuously monitored.",
      },
    ],
  }),
  component: PublicHome,
});

const featuredOpportunities = [
  {
    id: "opp-1",
    title: "Warehouse expansion for a fast-growing agri processor",
    industry: "Agriculture",
    businessName: "Harvest Loop Foods",
    goalAmount: 120_000_000,
    raisedAmount: 78_000_000,
    targetReturnPct: 18,
    daysLeft: 21,
    risk: "Medium",
  },
  {
    id: "opp-2",
    title: "Working-capital line for a regional care network",
    industry: "Healthcare",
    businessName: "MediBridge Clinics",
    goalAmount: 85_000_000,
    raisedAmount: 62_000_000,
    targetReturnPct: 16,
    daysLeft: 9,
    risk: "Low",
  },
  {
    id: "opp-3",
    title: "Fleet financing for intra-city delivery growth",
    industry: "Logistics",
    businessName: "SwiftRoute Africa",
    goalAmount: 150_000_000,
    raisedAmount: 98_000_000,
    targetReturnPct: 21,
    daysLeft: 14,
    risk: "Medium",
  },
];


const communityPosts = [
  {
    id: "p1",
    author: "Ada N.",
    role: "Founder",
    content:
      "We closed our first supplier milestone and posted the update for investors this morning. The escrow release was seamless.",
  },
  {
    id: "p2",
    author: "Kola A.",
    role: "Angel Investor",
    content:
      "Looking at consumer, logistics, and climate opportunities with strong milestone reporting. CoFund's due diligence gives me confidence.",
  },
  {
    id: "p3",
    author: "Favour O.",
    role: "Operator",
    content:
      "The best founders here think like portfolio companies before the round even closes. That discipline shows in their returns.",
  },
];

function fmtCompact(n: number) {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(0)}M`;
  return `₦${(n / 1_000).toFixed(0)}K`;
}

function PublicHome() {
  const { user, loading, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (user && profile?.onboarded) void navigate({ to: "/home", replace: true });
    else if (user && profile && !profile.onboarded) void navigate({ to: "/onboarding", replace: true });
  }, [loading, navigate, profile, user]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <Hero />
      <TrustBar />
      <FeaturedOpportunities />
      <HowItWorks />
      <Stats />
      <Roles />
      <CommunitySection />
      <CTA />
      <SiteFooter />
    </div>
  );
}

function Hero() {
  const { data: s } = usePlatformStats();
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 gradient-hero" />
      <div
        className="absolute inset-0 -z-10 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(to right, oklch(1 0 0 / 0.02) 1px, transparent 1px), linear-gradient(to bottom, oklch(1 0 0 / 0.02) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />

      <div className="mx-auto max-w-7xl px-4 pb-28 pt-20 sm:px-6 lg:px-8 lg:pb-36">
        <div className="grid items-center gap-16 lg:grid-cols-[1fr_0.9fr]">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/8 px-3.5 py-1.5 text-xs font-semibold text-primary">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Live opportunities available now
            </div>

            <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-[4rem]">
              Where Africa's{" "}
              <span className="text-gradient-brand">serious capital</span>{" "}
              meets{" "}
              <span className="text-gradient-brand">verified growth</span>
            </h1>

            <p className="mt-6 text-base leading-relaxed text-muted-foreground sm:text-lg max-w-xl">
              CoFund connects verified African businesses with institutional-grade investors through escrow-backed funding rounds, KYC verification, and real-time milestone tracking.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="inline-flex items-center gap-2 rounded-xl gradient-brand px-6 py-3 text-sm font-semibold text-primary-foreground shadow-brand transition hover:opacity-90 active:scale-[0.98]"
              >
                Start investing free <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/how-it-works"
                className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-semibold text-foreground/80 transition hover:border-foreground/30 hover:text-foreground"
              >
                See how it works
              </Link>
            </div>

            <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
              {[
                { Icon: ShieldCheck, text: "Escrow protected" },
                { Icon: BadgeCheck, text: "KYC/KYB verified" },
                { Icon: BarChart3, text: "Real-time monitoring" },
              ].map(({ Icon, text }) => (
                <span key={text} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Icon className="h-4 w-4 text-brand-green" />
                  {text}
                </span>
              ))}
            </div>
          </div>

          <div className="relative hidden lg:block">
            <div className="relative overflow-hidden rounded-3xl border border-border/50 shadow-elevated">
              <img
                src={homeHero}
                alt="African entrepreneurs"
                className="aspect-[4/3] w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/50 via-transparent to-transparent" />
            </div>
            <div className="absolute -bottom-5 -left-5 rounded-2xl border border-border bg-card/95 p-4 shadow-elevated backdrop-blur-xl">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Capital raised</p>
              <p className="mt-0.5 font-display text-2xl font-bold text-gradient-brand">{fmtCapital(s?.capitalDeployed ?? null)}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">across {fmtBusinesses(s?.verifiedBusinessCount ?? null)} businesses</p>
            </div>
            <div className="absolute -right-5 top-10 rounded-2xl border border-border bg-card/95 p-4 shadow-elevated backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-green/15">
                  <TrendingUp className="h-4 w-4 text-brand-green" />
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">Avg. return</p>
                  <p className="font-display text-lg font-bold text-brand-green">{fmtReturn(s?.avgTargetReturn ?? null)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBar() {
  return (
    <div className="border-y border-border/60 bg-card/30">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm text-muted-foreground">
          {[
            { Icon: ShieldCheck, text: "Escrow-protected transactions" },
            { Icon: BadgeCheck, text: "Every business KYC/KYB verified" },
            { Icon: BarChart3, text: "Real-time milestone tracking" },
            { Icon: Globe, text: "Pan-African coverage" },
          ].map(({ Icon, text }) => (
            <span key={text} className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-primary" />
              {text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function FeaturedOpportunities() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Live now</p>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Featured opportunities</h2>
            <p className="mt-2 text-muted-foreground max-w-md">
              Verified businesses actively raising capital. Backed by escrow and full due diligence.
            </p>
          </div>
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-primary transition hover:text-foreground sm:flex"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featuredOpportunities.map((opp) => {
            const pct = Math.min(100, Math.round((opp.raisedAmount / opp.goalAmount) * 100));
            return (
              <article
                key={opp.id}
                className="group flex flex-col rounded-2xl border border-border bg-card p-6 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-brand"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-xl gradient-brand" />
                    <div className="min-w-0">
                      <p className="truncate text-[11px] font-medium text-muted-foreground">{opp.industry}</p>
                      <p className="truncate text-sm font-semibold">{opp.businessName}</p>
                    </div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    opp.risk === "Low" ? "bg-brand-green/10 text-brand-green" : "bg-gold/10 text-gold"
                  }`}>
                    {opp.risk} risk
                  </span>
                </div>

                <h3 className="mt-5 font-display text-lg font-bold leading-snug group-hover:text-primary transition-colors">
                  {opp.title}
                </h3>

                <div className="mt-auto pt-6">
                  <div className="mb-2 flex justify-between text-xs text-muted-foreground">
                    <span>{pct}% funded</span>
                    <span className="font-medium text-foreground">{fmtCompact(opp.goalAmount)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full gradient-brand transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="mt-4 flex items-center justify-between">
                    <div>
                      <p className="text-[11px] text-muted-foreground">Target return</p>
                      <p className="font-display text-xl font-bold text-brand-green">{opp.targetReturnPct}%</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[11px] text-muted-foreground">Closes in</p>
                      <p className="font-semibold text-sm">{opp.daysLeft} days</p>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/auth"
            search={{ mode: "signup" }}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-2.5 text-sm font-semibold text-muted-foreground transition hover:border-primary/40 hover:text-primary"
          >
            Sign up to see all live opportunities <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Create & verify your account",
      desc: "Complete KYC verification and investor suitability assessment to unlock investment access.",
      Icon: BadgeCheck,
    },
    {
      n: "02",
      title: "Browse verified opportunities",
      desc: "Explore curated investment rounds across agriculture, health, logistics, fintech, and more.",
      Icon: BarChart3,
    },
    {
      n: "03",
      title: "Commit via escrow",
      desc: "Your funds are held securely in escrow until business milestones are verified and approved.",
      Icon: ShieldCheck,
    },
    {
      n: "04",
      title: "Track & receive returns",
      desc: "Monitor milestones in real time and receive structured returns as rounds complete.",
      Icon: TrendingUp,
    },
  ];

  return (
    <section className="border-y border-border/60 bg-card/20 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Process</p>
          <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">How CoFund works</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            A structured, secure process from account creation to receiving returns.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div key={step.n} className="relative flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 shadow-card">
              <div className="flex items-center justify-between">
                <span className="font-display text-4xl font-bold text-primary/15">{step.n}</span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <step.Icon className="h-5 w-5" />
                </div>
              </div>
              <div>
                <h3 className="font-display text-base font-bold">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Stats() {
  const { data: s } = usePlatformStats();
  const rows = [
    { value: fmtCapital(s?.capitalDeployed ?? null), label: "Capital deployed" },
    { value: fmtBusinesses(s?.verifiedBusinessCount ?? null), label: "Verified businesses" },
    { value: fmtInvestors(s?.investorCount ?? null), label: "Active investors" },
    { value: fmtReturn(s?.avgTargetReturn ?? null), label: "Avg. target return" },
  ];
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-primary/15 bg-card shadow-brand">
          <div className="grid grid-cols-2 divide-x divide-y divide-border/60 lg:grid-cols-4 lg:divide-y-0">
            {rows.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center justify-center py-12 text-center">
                <p className="font-display text-4xl font-bold text-gradient-brand sm:text-5xl">{stat.value}</p>
                <p className="mt-2 text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Roles() {
  const roles = [
    {
      icon: TrendingUp,
      title: "Invest",
      color: "text-primary bg-primary/10",
      desc: "Discover vetted investment opportunities across sectors. Deploy capital into escrow-backed rounds with structured returns.",
      img: homeInvest,
      cta: "Start investing",
    },
    {
      icon: Briefcase,
      title: "Raise Capital",
      color: "text-gold bg-gold/10",
      desc: "Apply for funding to grow your business. Get matched with serious investors and manage your round through the platform.",
      img: homeCapital,
      cta: "List your business",
    },
    {
      icon: Rocket,
      title: "Build",
      color: "text-brand-green bg-brand-green/10",
      desc: "Share your startup idea, find co-founders and mentors, and access community capital through the CoFund Startup Hub.",
      img: homeBuild,
      cta: "Join the hub",
    },
  ];

  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-14 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Three paths</p>
          <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">Your role on CoFund</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Whether you're deploying capital, raising it, or building from scratch — CoFund has a home for you.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {roles.map((role) => (
            <div
              key={role.title}
              className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-elevated"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={role.img}
                  alt={role.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                <div className={`absolute bottom-4 left-5 flex h-10 w-10 items-center justify-center rounded-xl ${role.color}`}>
                  <role.icon className="h-5 w-5" />
                </div>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="font-display text-xl font-bold">{role.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{role.desc}</p>
                <Link
                  to="/auth"
                  search={{ mode: "signup" }}
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary transition-all hover:gap-3"
                >
                  {role.cta} <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CommunitySection() {
  const { data: s } = usePlatformStats();
  return (
    <section className="border-y border-border/60 bg-card/20 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">Community</p>
            <h2 className="mt-2 font-display text-3xl font-bold sm:text-4xl">
              Founders and investors, building Africa together
            </h2>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              The CoFund community is where deals get discovered, knowledge gets shared, and partnerships form. Join thousands of operators across Africa.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                { Icon: Users, label: `${fmtInvestors(s?.investorCount ?? null)} active members` },
                { Icon: MessageCircle, label: "Active discussion forums" },
                { Icon: Star, label: "Verified mentor network" },
                { Icon: CheckCircle2, label: "Deal syndication tools" },
              ].map(({ Icon, label }) => (
                <div key={label} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Icon className="h-4 w-4 shrink-0 text-primary" />
                  {label}
                </div>
              ))}
            </div>
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="mt-8 inline-flex items-center gap-2 rounded-xl gradient-brand px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-brand transition hover:opacity-90"
            >
              Join the community <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {communityPosts.map((post) => (
              <div
                key={post.id}
                className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 shadow-card"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full gradient-brand text-sm font-bold text-primary-foreground">
                  {post.author.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{post.author}</p>
                    <span className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                      {post.role}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{post.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl px-8 py-20 text-center gradient-brand shadow-brand">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(to right, oklch(1 0 0 / 0.04) 1px, transparent 1px), linear-gradient(to bottom, oklch(1 0 0 / 0.04) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
          <div className="relative">
            <p className="text-sm font-semibold uppercase tracking-widest text-white/70">Ready to start?</p>
            <h2 className="mt-3 font-display text-4xl font-bold text-white sm:text-5xl">
              Together, we grow.
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-lg text-white/80">
              Join Africa's business ecosystem and start your CoFund journey — as an investor, founder, or builder.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-primary shadow-soft transition hover:bg-white/95 active:scale-[0.98]"
              >
                Create your free account <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/how-it-works"
                className="inline-flex items-center gap-2 rounded-xl border border-white/25 px-7 py-3.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Learn more
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
