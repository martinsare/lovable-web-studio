import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { howInvest, howRaise, howBuild } from "@/assets/images";
import { TrendingUp, Briefcase, Rocket, ArrowRight, UserPlus, ShieldCheck, LineChart } from "lucide-react";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works — CoFund" },
      { name: "description", content: "Three ways to grow with CoFund: invest, raise capital, or build a startup." },
    ],
  }),
  component: HowItWorks,
});

const tracks = [
  {
    icon: TrendingUp,
    img: howInvest,
    title: "Invest",
    desc: "Discover verified investment opportunities across multiple industries.",
    steps: [
      "Complete KYC and set your investment interests",
      "Browse verified, due-diligenced opportunities",
      "Fund via escrow — money held safely until milestones",
      "Track performance and receive returns",
    ],
  },
  {
    icon: Briefcase,
    img: howRaise,
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
    img: howBuild,
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
        <div className="mx-auto max-w-5xl px-4 py-24 text-center sm:px-6 lg:px-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">How it works</p>
          <h1 className="font-display text-5xl font-bold leading-[1.06] sm:text-6xl">
            Three ways to grow with{" "}
            <span className="text-gradient-brand">CoFund</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Pick your path — or enable every role on one account. The platform adapts to you.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {tracks.map((t, i) => (
            <div key={t.title} className={`grid gap-8 rounded-3xl border border-border bg-card overflow-hidden md:grid-cols-2 ${i % 2 === 1 ? "md:[&>*:first-child]:order-last" : ""}`}>
              <div className="relative overflow-hidden aspect-[16/10]">
                <img src={t.img} alt={t.title} className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-card/50 to-transparent" />
              </div>
              <div className="flex flex-col justify-center p-8 lg:p-10">
                <div className="gradient-brand mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-brand w-fit">
                  <t.icon className="h-6 w-6" />
                </div>
                <h2 className="font-display text-2xl font-bold">{t.title}</h2>
                <p className="mt-2 text-muted-foreground">{t.desc}</p>
                <ol className="mt-6 space-y-3">
                  {t.steps.map((s, j) => (
                    <li key={s} className="flex items-start gap-3 text-sm">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {j + 1}
                      </span>
                      <span className="text-foreground/80 pt-0.5">{s}</span>
                    </li>
                  ))}
                </ol>
                <Link to="/auth" search={{ mode: "signup" }}
                  className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-foreground transition">
                  Get started <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-card/40 border-y border-white/[0.06] py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold">Built on trust</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { icon: UserPlus, t: "Verified identities", d: "BVN, phone, email, address — every member is real." },
              { icon: ShieldCheck, t: "Escrow protection", d: "Funds are securely managed through banking partners." },
              { icon: LineChart, t: "Continuous monitoring", d: "Track milestones, reporting and trust scores live." },
            ].map((v) => (
              <div key={v.t} className="rounded-2xl border border-white/[0.06] bg-card p-7">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <v.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-bold">{v.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link to="/auth" search={{ mode: "signup" }}
              className="gradient-brand inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-brand hover:opacity-90 transition">
              Get started <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
