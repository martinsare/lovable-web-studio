import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { usePlatformStats, fmtInvestors, fmtBusinesses, fmtReturn } from "@/hooks/use-platform-stats";
import {
  Building2, ArrowRight, ChevronRight, Plus, Users,
  TrendingUp, BarChart3, MessageCircle, Zap, CheckCircle2,
  Clock, Target,
} from "lucide-react";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;
const fadeUp = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.09 } } };

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function BusinessDashboard({ name, userId }: { name: string; userId: string }) {
  const { data: business, isLoading: bizLoading } = useQuery({
    queryKey: ["dash-business", "my-biz", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id,name,industry,verified,trust_score,followers_count,slug")
        .eq("owner_id", userId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: rounds } = useQuery({
    queryKey: ["dash-business", "rounds", (business as any)?.id],
    queryFn: async () => {
      if (!(business as any)?.id) return [];
      const { data, error } = await supabase
        .from("opportunities")
        .select("id,title,goal_amount,raised_amount,status,target_return_pct,closes_at")
        .eq("business_id", (business as any).id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!(business as any)?.id,
  });

  return (
    <div className="min-h-full bg-background">
      <BusinessHero name={name} business={business} loading={bizLoading} />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          <main className="space-y-10">
            <FundingRounds rounds={rounds ?? []} business={business} />
            <RecentActivity />
          </main>
          <aside className="space-y-8">
            <CreateRoundCard business={business} />
            <QuickActions business={business} />
            <PlatformStats />
          </aside>
        </div>
      </div>
    </div>
  );
}

function BusinessHero({ name, business, loading }: { name: string; business: any; loading: boolean }) {
  const totalRaised = 0;
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
              {loading ? (
                <div className="h-10 w-48 animate-pulse rounded-xl bg-secondary/60" />
              ) : business ? (
                <>
                  <div className="flex items-center gap-2.5 mb-1">
                    {business.verified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-green/15 px-2.5 py-0.5 text-[10px] font-bold text-brand-green">
                        <CheckCircle2 className="h-3 w-3" /> Verified
                      </span>
                    )}
                    {business.industry && (
                      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                        {business.industry}
                      </span>
                    )}
                  </div>
                  <p className="font-display text-5xl font-bold tracking-tight sm:text-6xl">{business.name}</p>
                </>
              ) : (
                <>
                  <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">Your business</p>
                  <p className="mt-2 font-display text-5xl font-bold tracking-tight sm:text-6xl">Set up your listing</p>
                  <p className="mt-2.5 text-sm text-muted-foreground max-w-sm">
                    Add your business details to start raising capital from verified investors.
                  </p>
                </>
              )}
            </motion.div>
          </div>

          <motion.div variants={fadeUp} transition={{ duration: 0.44, ease: EASE }}>
            {business ? (
              <Link
                to="/my-business"
                className="hidden sm:inline-flex shrink-0 items-center gap-2 rounded-xl gradient-brand px-6 py-3 text-sm font-bold text-primary-foreground shadow-brand transition hover:opacity-90 mt-2"
              >
                Manage business <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                to="/my-business"
                className="hidden sm:inline-flex shrink-0 items-center gap-2 rounded-xl gradient-brand px-6 py-3 text-sm font-bold text-primary-foreground shadow-brand transition hover:opacity-90 mt-2"
              >
                Create listing <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </motion.div>
        </div>

        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.44, ease: EASE }}
          className="mt-10 grid grid-cols-3 border-t border-border divide-x divide-border"
        >
          {[
            { label: "Total raised", value: totalRaised > 0 ? `₦${(totalRaised / 1_000_000).toFixed(1)}M` : "₦0", icon: TrendingUp },
            { label: "Followers", value: String(business?.followers_count ?? 0), icon: Users },
            { label: "Trust score", value: business?.trust_score ? `${business.trust_score}%` : "—", icon: BarChart3 },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center gap-3 px-5 py-4 first:pl-0">
              <Icon className="h-4 w-4 shrink-0 text-muted-foreground/60" />
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
                <p className="mt-0.5 font-display text-xl font-bold">{value}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}

function FundingRounds({ rounds, business }: { rounds: any[]; business: any }) {
  return (
    <motion.section
      variants={stagger}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
    >
      <motion.div variants={fadeUp} transition={{ duration: 0.4, ease: EASE }} className="flex items-center justify-between mb-6">
        <h2 className="font-display text-lg font-bold">Funding Rounds</h2>
        {rounds.length > 0 && (
          <Link to="/my-business" className="flex items-center gap-1 text-xs font-semibold text-muted-foreground transition hover:text-foreground">
            Manage <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </motion.div>

      {rounds.length === 0 ? (
        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.42, ease: EASE }}
          className="rounded-2xl border border-dashed border-border/60 p-10 text-center"
        >
          <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center">
            <Target className="h-6 w-6 text-muted-foreground/40" />
          </div>
          <p className="font-display text-base font-semibold">No funding rounds yet</p>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-xs mx-auto">
            {business
              ? "Create your first funding round to start raising capital."
              : "First, set up your business listing, then create a funding round."}
          </p>
          <Link
            to="/my-business"
            className="mt-5 inline-flex items-center gap-2 rounded-xl gradient-brand px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-brand transition hover:opacity-90"
          >
            {business ? (
              <><Plus className="h-4 w-4" /> Create round</>
            ) : (
              <><Building2 className="h-4 w-4" /> Set up listing</>
            )}
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {rounds.map((round: any, i) => {
            const pct = Math.min(((round.raised_amount ?? 0) / (round.goal_amount ?? 1)) * 100, 100);
            return (
              <motion.div
                key={round.id}
                variants={fadeUp}
                transition={{ duration: 0.4, ease: EASE, delay: i * 0.07 }}
                className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5"
              >
                <div className="absolute top-0 inset-x-0 h-px gradient-brand" />
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${round.status === "open" ? "bg-brand-green/15 text-brand-green" : "bg-secondary text-muted-foreground"}`}>
                        {round.status === "open" && <span className="h-1.5 w-1.5 rounded-full bg-brand-green animate-pulse" />}
                        {round.status}
                      </span>
                    </div>
                    <h3 className="font-display text-sm font-bold">{round.title}</h3>
                    <div className="mt-3">
                      <div className="flex justify-between text-[10px] text-muted-foreground mb-1.5">
                        <span>{pct.toFixed(0)}% funded</span>
                        <span>₦{((round.raised_amount ?? 0) / 1_000_000).toFixed(1)}M / ₦{((round.goal_amount ?? 0) / 1_000_000).toFixed(1)}M</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full bg-brand-green transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                  <Link
                    to="/offerings/$opportunityId"
                    params={{ opportunityId: round.id }}
                    className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold transition hover:border-primary/30 hover:text-primary"
                  >
                    View
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.section>
  );
}

function RecentActivity() {
  return (
    <motion.section
      variants={stagger}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
    >
      <motion.h2 variants={fadeUp} transition={{ duration: 0.4, ease: EASE }} className="font-display text-lg font-bold mb-6">
        Recent Activity
      </motion.h2>
      <motion.div variants={fadeUp} transition={{ duration: 0.42, ease: EASE }} className="rounded-2xl border border-dashed border-border/60 p-8 text-center">
        <Clock className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
        <p className="text-sm font-semibold">No activity yet</p>
        <p className="mt-1 text-xs text-muted-foreground">Investor inquiries and updates will appear here.</p>
      </motion.div>
    </motion.section>
  );
}

function CreateRoundCard({ business }: { business: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE, delay: 0.15 }}
      className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5"
    >
      <div className="absolute top-0 inset-x-0 h-px gradient-brand" />
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl gradient-brand">
        <Zap className="h-5 w-5 text-primary-foreground" />
      </div>
      <h3 className="font-display text-sm font-bold">
        {business ? "Launch a new round" : "Get started"}
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        {business
          ? "Open a new funding round to attract more investors."
          : "Create your business profile to begin raising capital."}
      </p>
      <Link
        to="/my-business"
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl gradient-brand py-2.5 text-sm font-bold text-primary-foreground shadow-brand transition hover:opacity-90"
      >
        <Plus className="h-4 w-4" />
        {business ? "New round" : "Create listing"}
      </Link>
    </motion.div>
  );
}

function QuickActions({ business }: { business: any }) {
  const actions = [
    { to: "/my-business", icon: Building2, label: "My business", desc: "Manage your listing" },
    { to: "/browse", icon: TrendingUp, label: "Browse deals", desc: "See active opportunities" },
    { to: "/community", icon: MessageCircle, label: "Community", desc: "Connect with investors" },
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
