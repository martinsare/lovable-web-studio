import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { TrendingUp, Briefcase, Rocket, ArrowRight, UserPlus, ShieldCheck, LineChart } from "lucide-react";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — CoFund" },
      { name: "description", content: "Three ways to grow with CoFund: invest, raise capital, or build a startup." },
      { property: "og:title", content: "How CoFund works" },
      { property: "og:description", content: "Invest, raise capital, or build a startup — backed by verification and escrow." },
    ],
  }),
  component: HowItWorks,
});

const tracks = [
  {
    icon: TrendingUp,
    title: "Invest",
    desc: "Discover verified investment opportunities across multiple industries.",
    steps: [
      "Complete KYC and set your investment interests",
      "Browse verified, due-diligenced opportunities",
      "Fund via escrow — your money is held safely until milestones",
      "Track performance and receive returns",
    ],
  },
  {
    icon: Briefcase,
    title: "Raise Capital",
    desc: "Apply for funding to grow your business through CoFund.",
    steps: [
      "Build your Business Passport",
      "Complete verification and trust score",
      "Submit a funding round with terms",
      "Receive funds in escrow and report progress",
    ],
  },
  {
    icon: Rocket,
    title: "Build an Idea",
    desc: "Share your startup idea, find collaborators, mentors and capital.",
    steps: [
      "Publish your startup idea on the Startup Hub",
      "Recruit co-founders, mentors and skills",
      "Validate with the community",
      "Graduate into a verified business",
    ],
  },
];

function HowItWorks() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 -z-10 gradient-mesh" />
        <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">How it works</p>
          <h1 className="mt-2 font-display text-4xl font-extrabold sm:text-5xl">
            Three ways to grow with <span className="text-gradient-brand">CoFund</span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
            Pick your path — or enable every role on one account. The platform adapts to you.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {tracks.map((t) => (
            <div key={t.title} className="rounded-2xl border border-border bg-card p-7 shadow-card">
              <div className="gradient-brand mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl text-white">
                <t.icon className="h-6 w-6" />
              </div>
              <h2 className="font-display text-2xl font-bold">{t.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{t.desc}</p>
              <ol className="mt-6 space-y-3 text-sm">
                {t.steps.map((s, i) => (
                  <li key={s} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="text-foreground/90">{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-secondary/40 py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center font-display text-3xl font-extrabold">Built on trust</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { icon: UserPlus, t: "Verified identities", d: "BVN, phone, email, address — every member is real." },
              { icon: ShieldCheck, t: "Escrow protection", d: "Funds are securely managed through banking partners." },
              { icon: LineChart, t: "Continuous monitoring", d: "Track milestones, reporting and trust scores live." },
            ].map((v) => (
              <div key={v.t} className="rounded-2xl border border-border bg-card p-6">
                <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <v.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-bold">{v.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{v.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="gradient-brand inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-brand"
            >
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}