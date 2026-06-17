import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ShieldCheck, BadgeCheck, BarChart3, Sparkles, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — CoFund" },
      { name: "description", content: "CoFund is building Africa's most trusted business and investment ecosystem." },
      { property: "og:title", content: "About CoFund" },
      { property: "og:description", content: "Africa's trusted private investment & business growth platform." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 -z-10 gradient-mesh" />
        <div className="mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-soft">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Our story
          </div>
          <h1 className="font-display text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
            Building Africa's <span className="text-gradient-brand">business ecosystem</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            CoFund is a business identity, trust, investment and growth platform — one home for
            investors, founders, mentors and operators across the continent.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Mission</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold">Verified, protected, and built to last.</h2>
          </div>
          <p className="text-muted-foreground">
            We exist to make private investment in Africa safer, more transparent, and more accessible.
            Every business on CoFund is verified. Every transaction is escrow-protected. Every
            relationship is built on a real, traceable trust score — not promises.
          </p>
        </div>
      </section>

      <section className="bg-secondary/40 py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-display text-3xl font-extrabold">What we believe</h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { icon: ShieldCheck, t: "Trust is infrastructure", d: "Escrow, KYC, and continuous monitoring are non-negotiable." },
              { icon: BadgeCheck, t: "Verification beats hype", d: "Real businesses, real founders, real numbers." },
              { icon: BarChart3, t: "Community compounds", d: "Investors, founders and mentors growing together." },
            ].map((v) => (
              <div key={v.t} className="rounded-2xl border border-border bg-card p-6 shadow-card">
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-green/15 text-brand-green">
                  <v.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-lg font-bold">{v.t}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{v.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="gradient-brand relative overflow-hidden rounded-3xl px-6 py-12 text-center text-white shadow-brand sm:py-16">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Join the ecosystem.</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/90">
            One account. Every role. Investor, founder, mentor, or member — start where you are.
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
      <SiteFooter />
    </div>
  );
}