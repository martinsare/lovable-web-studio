import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { aboutHero, aboutGrid1, aboutGrid2, aboutGrid3 } from "@/assets/images";
import { ShieldCheck, BadgeCheck, BarChart3, ArrowRight, Globe, Target, Heart } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — CoFund" },
      { name: "description", content: "CoFund is building Africa's most trusted business and investment ecosystem." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } } as const;
  const fadeUp = { hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0 } } as const;
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 -z-10 gradient-mesh" />
        <motion.div
          className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8 lg:py-32"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <motion.div className="grid gap-12 lg:grid-cols-2 items-center" variants={stagger} initial="hidden" animate="visible">
            <motion.div variants={fadeUp}>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-4">Our story</p>
              <h1 className="font-display text-5xl font-bold leading-[1.06] sm:text-6xl">
                Building Africa's{" "}
                <span className="text-gradient-brand">business ecosystem</span>
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
                CoFund is a business identity, trust, investment and growth platform — one home for investors, founders, mentors and operators across the continent.
              </p>
              <Link to="/auth" search={{ mode: "signup" }}
                className="mt-8 inline-flex items-center gap-2 gradient-brand rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-brand hover:opacity-90 transition">
                Join the ecosystem <ArrowRight className="h-4 w-4" />
              </Link>
            </motion.div>
            <motion.div className="relative hidden lg:block" initial={{ opacity: 0, x: 30, scale: 0.97 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ duration: 0.8, delay: 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}>
              <img src={aboutHero} alt="Team collaboration" className="rounded-3xl aspect-[4/3] w-full object-cover shadow-soft" />
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      <motion.section
        className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <motion.div className="grid gap-12 md:grid-cols-2 items-start" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}>
          <motion.div variants={fadeUp}>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-3">Mission</p>
            <h2 className="font-display text-3xl font-bold">Verified, protected, and built to last.</h2>
          </motion.div>
          <motion.div variants={fadeUp} className="space-y-4 text-muted-foreground leading-relaxed">
            <p>
              We exist to make private investment in Africa safer, more transparent, and more accessible.
              Every business on CoFund is verified. Every transaction is escrow-protected.
            </p>
            <p>
              Every relationship is built on a real, traceable trust score — not promises. We believe Africa's next generation of great businesses deserves the same institutional-grade infrastructure that global markets take for granted.
            </p>
          </motion.div>
        </motion.div>
      </motion.section>

      <motion.section
        className="bg-card/40 border-y border-border py-20"
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="font-display text-3xl font-bold">What we believe</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { icon: ShieldCheck, color: "text-primary bg-primary/10", t: "Trust is infrastructure", d: "Escrow, KYC, and continuous monitoring are non-negotiable features, not nice-to-haves." },
              { icon: BadgeCheck, color: "text-brand-green bg-brand-green/10", t: "Verification beats hype", d: "Real businesses, real founders, real numbers. We do the homework so investors don't have to." },
              { icon: BarChart3, color: "text-gold bg-gold/10", t: "Community compounds", d: "Investors, founders and mentors growing together create value that no single actor can unlock alone." },
            ].map((v) => (
              <div key={v.t} className="rounded-2xl border border-border bg-card p-7">
                <div className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl ${v.color}`}>
                  <v.icon className="h-6 w-6" />
                </div>
                <h3 className="font-display text-lg font-bold">{v.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.d}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section
        className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <img src={aboutGrid1} alt="" className="rounded-2xl aspect-[4/3] w-full object-cover" />
          <img src={aboutGrid2} alt="" className="rounded-2xl aspect-[4/3] w-full object-cover lg:mt-8" />
          <img src={aboutGrid3} alt="" className="rounded-2xl aspect-[4/3] w-full object-cover sm:col-span-2 lg:col-span-1" />
        </div>
      </motion.section>

      <motion.section
        className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8"
        initial={{ opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="relative overflow-hidden rounded-3xl gradient-brand px-8 py-16 text-center shadow-brand">
          <div className="absolute inset-0 [background-image:linear-gradient(to_right,oklch(1_0_0/0.04)_1px,transparent_1px),linear-gradient(to_bottom,oklch(1_0_0/0.04)_1px,transparent_1px)] [background-size:40px_40px]" />
          <div className="relative">
            <h2 className="font-display text-3xl font-bold text-white sm:text-4xl">Join the ecosystem.</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/80">
              One account. Every role. Investor, founder, mentor, or member — start where you are.
            </p>
            <Link to="/auth" search={{ mode: "signup" }}
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-primary hover:bg-white/95 transition">
              Create your account <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </motion.section>

      <SiteFooter />
    </div>
  );
}
