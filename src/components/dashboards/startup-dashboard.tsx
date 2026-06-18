import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
  Rocket, ArrowRight, ChevronRight, CheckCircle2, Circle,
  Users, Building2, TrendingUp, MessageCircle, BookOpen,
  Star, Lightbulb,
} from "lucide-react";
import { usePlatformStats, fmtInvestors, fmtBusinesses, fmtReturn } from "@/hooks/use-platform-stats";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;
const fadeUp = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.09 } } };

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function StartupDashboard({ name, userId, profileOnboarded }: { name: string; userId: string; profileOnboarded: boolean }) {
  const { data: business } = useQuery({
    queryKey: ["dash-startup", "biz", userId],
    queryFn: async () => {
      const { data } = await supabase
        .from("businesses")
        .select("id,name,verified,slug")
        .eq("owner_id", userId)
        .maybeSingle();
      return data;
    },
    enabled: !!userId,
  });

  const { data: articles } = useQuery({
    queryKey: ["dash-startup", "articles"],
    queryFn: async () => {
      const { data } = await supabase
        .from("learning_articles")
        .select("id,title,excerpt,category,slug")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(4);
      return data ?? [];
    },
  });

  const steps = [
    {
      num: 1,
      label: "Complete your profile",
      desc: "Tell the community who you are.",
      done: profileOnboarded,
      to: "/settings",
    },
    {
      num: 2,
      label: "Register your business",
      desc: "Add your idea or company to the platform.",
      done: !!business,
      to: "/my-business",
    },
    {
      num: 3,
      label: "Get business verified",
      desc: "Complete KYB to unlock investor visibility.",
      done: !!(business as any)?.verified,
      to: "/my-business",
    },
    {
      num: 4,
      label: "Launch your first round",
      desc: "Open funding and attract investors.",
      done: false,
      to: "/my-business",
    },
  ];

  const doneCount = steps.filter((s) => s.done).length;

  return (
    <div className="min-h-full bg-background">
      <StartupHero name={name} doneCount={doneCount} total={steps.length} />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          <main className="space-y-10">
            <GettingStarted steps={steps} doneCount={doneCount} />
            <LearningResources articles={articles ?? []} />
          </main>
          <aside className="space-y-8">
            <MentorCard />
            <QuickActions />
            <PlatformStats />
          </aside>
        </div>
      </div>
    </div>
  );
}

function StartupHero({ name, doneCount, total }: { name: string; doneCount: number; total: number }) {
  const pct = Math.round((doneCount / total) * 100);
  return (
    <div className="relative overflow-hidden border-b border-border/40">
      <div className="absolute inset-0 gradient-hero" />
      <div className="absolute right-0 top-0 h-64 w-96 bg-[radial-gradient(ellipse_at_top_right,oklch(0.65_0.18_160/0.10)_0%,transparent_70%)]" />
      <motion.div
        className="relative mx-auto max-w-6xl px-4 pt-8 pb-0 sm:px-6 lg:px-8"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            <motion.p variants={fadeUp} transition={{ duration: 0.4, ease: EASE }} className="text-sm text-muted-foreground">
              {greeting()},{" "}
              <span className="font-semibold text-foreground">{name}</span>
            </motion.p>
            <motion.div variants={fadeUp} transition={{ duration: 0.42, ease: EASE }} className="mt-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 mb-4">
                <Rocket className="h-3.5 w-3.5 text-primary" />
                <span className="text-[11px] font-bold text-primary">
                  {doneCount} of {total} steps complete
                </span>
              </div>
              <h1 className="font-display text-5xl font-bold tracking-tight sm:text-6xl">
                Turn your idea into a{" "}
                <span className="text-brand-green">funded business</span>
              </h1>
              <p className="mt-3 text-sm text-muted-foreground max-w-sm">
                Complete each step to unlock investor visibility and start raising capital.
              </p>
            </motion.div>
          </div>
          <motion.div variants={fadeUp} transition={{ duration: 0.44, ease: EASE }} className="hidden sm:block mt-2">
            <Link
              to="/my-business"
              className="inline-flex items-center gap-2 rounded-xl gradient-brand px-6 py-3 text-sm font-bold text-primary-foreground shadow-brand transition hover:opacity-90"
            >
              Set up business <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>

        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.44, ease: EASE }}
          className="mt-10 border-t border-border pb-0"
        >
          <div className="flex items-center gap-4 py-4">
            <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-brand-green"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: EASE, delay: 0.6 }}
              />
            </div>
            <span className="text-sm font-bold text-brand-green shrink-0">{pct}% complete</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

function GettingStarted({ steps, doneCount }: { steps: any[]; doneCount: number }) {
  return (
    <motion.section
      variants={stagger}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
    >
      <motion.div variants={fadeUp} transition={{ duration: 0.4, ease: EASE }} className="mb-6">
        <h2 className="font-display text-lg font-bold">Your roadmap</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {doneCount === steps.length
            ? "🎉 All steps complete! You're ready to grow."
            : `${steps.length - doneCount} step${steps.length - doneCount !== 1 ? "s" : ""} left to unlock full investor visibility.`}
        </p>
      </motion.div>

      <div className="space-y-3">
        {steps.map((step, i) => (
          <motion.div
            key={step.num}
            variants={fadeUp}
            transition={{ duration: 0.4, ease: EASE, delay: i * 0.08 }}
          >
            <Link
              to={step.to as never}
              className={`group flex items-center gap-4 rounded-2xl border p-5 transition hover:border-primary/30 ${
                step.done
                  ? "border-brand-green/25 bg-brand-green/5"
                  : "border-border/60 bg-card hover:bg-secondary/30"
              }`}
            >
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 transition ${
                step.done
                  ? "border-brand-green bg-brand-green/15 text-brand-green"
                  : "border-border/60 bg-secondary/50 text-muted-foreground group-hover:border-primary/40"
              }`}>
                {step.done
                  ? <CheckCircle2 className="h-5 w-5" />
                  : <span className="text-sm font-bold">{step.num}</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold ${step.done ? "text-brand-green" : "text-foreground"}`}>
                  {step.label}
                  {step.done && <span className="ml-2 text-[10px] font-bold text-brand-green">✓ Done</span>}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">{step.desc}</p>
              </div>
              {!step.done && (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
              )}
            </Link>
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}

function LearningResources({ articles }: { articles: any[] }) {
  return (
    <motion.section
      variants={stagger}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
    >
      <motion.div variants={fadeUp} transition={{ duration: 0.4, ease: EASE }} className="flex items-center justify-between mb-6">
        <h2 className="font-display text-lg font-bold">Learn & grow</h2>
        <Link to="/learn" className="flex items-center gap-1 text-xs font-semibold text-muted-foreground transition hover:text-foreground">
          All articles <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </motion.div>

      {articles.length === 0 ? (
        <motion.div variants={fadeUp} transition={{ duration: 0.4, ease: EASE }} className="rounded-2xl border border-dashed border-border/60 p-8 text-center">
          <BookOpen className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
          <p className="text-sm font-semibold">Learning resources coming soon</p>
        </motion.div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {articles.map((article: any, i) => (
            <motion.div
              key={article.id}
              variants={fadeUp}
              transition={{ duration: 0.4, ease: EASE, delay: i * 0.07 }}
            >
              <Link
                to="/learn/$slug"
                params={{ slug: article.slug }}
                className="group flex flex-col gap-2 rounded-2xl border border-border/60 bg-card p-4 transition hover:border-primary/30"
              >
                {article.category && (
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70">{article.category}</span>
                )}
                <h3 className="text-sm font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                  {article.title}
                </h3>
                {article.excerpt && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{article.excerpt}</p>
                )}
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </motion.section>
  );
}

function MentorCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE, delay: 0.2 }}
      className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5"
    >
      <div className="absolute top-0 inset-x-0 h-px gradient-brand" />
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
        <Star className="h-5 w-5 text-primary" />
      </div>
      <h3 className="font-display text-sm font-bold">Find a mentor</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Connect with experienced founders and investors who can guide your journey.
      </p>
      <Link
        to="/community"
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl gradient-brand py-2.5 text-sm font-bold text-primary-foreground shadow-brand transition hover:opacity-90"
      >
        <Users className="h-4 w-4" /> Browse mentors
      </Link>
    </motion.div>
  );
}

function QuickActions() {
  const actions = [
    { to: "/my-business", icon: Building2, label: "My business", desc: "Build your listing" },
    { to: "/community", icon: MessageCircle, label: "Community", desc: "Find co-founders & advice" },
    { to: "/browse", icon: TrendingUp, label: "Browse deals", desc: "See how others raise" },
    { to: "/learn", icon: Lightbulb, label: "Learning hub", desc: "Guides for founders" },
  ];
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3">Quick access</p>
      <div className="space-y-0.5">
        {actions.map(({ to, icon: Icon, label, desc }) => (
          <Link key={to} to={to as never} className="group flex items-center gap-3.5 rounded-xl px-3 py-2.5 transition hover:bg-secondary/60 -mx-3">
            <Icon className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-none">{label}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}

function PlatformStats() {
  const { data: stats } = usePlatformStats();
  return (
    <div className="border-t border-border pt-6">
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">Platform</p>
      <div className="space-y-3">
        {[
          { label: "Active investors", value: fmtInvestors(stats?.investorCount ?? null), icon: Users },
          { label: "Verified businesses", value: fmtBusinesses(stats?.verifiedBusinessCount ?? null), icon: Building2 },
          { label: "Avg. target return", value: fmtReturn(stats?.avgTargetReturn ?? null), icon: TrendingUp },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
              <Icon className="h-3.5 w-3.5 shrink-0" />{label}
            </div>
            <span className="text-sm font-bold text-foreground">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
