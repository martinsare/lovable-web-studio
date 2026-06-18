import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { fetchPostsWithAuthors } from "@/lib/post-feed";
import { usePlatformStats, fmtInvestors, fmtBusinesses, fmtReturn } from "@/hooks/use-platform-stats";
import {
  Users, ArrowRight, ChevronRight, TrendingUp, Building2,
  MessageCircle, Send, Sparkles,
} from "lucide-react";
import { useState } from "react";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;
const fadeUp = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.09 } } };

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export function CommunityDashboard({ name }: { name: string }) {
  return (
    <div className="min-h-full bg-background">
      <CommunityHero name={name} />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
          <main>
            <CommunityFeed />
          </main>
          <aside className="space-y-8">
            <LevelUpCards />
            <PlatformStats />
          </aside>
        </div>
      </div>
    </div>
  );
}

function CommunityHero({ name }: { name: string }) {
  const { data: stats } = usePlatformStats();
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
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-secondary/50 px-3 py-1 mb-4">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[11px] font-bold text-muted-foreground">Community Member</span>
              </div>
              <h1 className="font-display text-5xl font-bold tracking-tight sm:text-6xl">
                Welcome to{" "}
                <span className="text-brand-green">CoFund</span>
              </h1>
              <p className="mt-3 text-sm text-muted-foreground max-w-sm">
                Follow African businesses, join discussions, and discover investment opportunities.
              </p>
            </motion.div>
          </div>
          <motion.div variants={fadeUp} transition={{ duration: 0.44, ease: EASE }}>
            <Link
              to="/community"
              className="hidden sm:inline-flex shrink-0 items-center gap-2 rounded-xl gradient-brand px-6 py-3 text-sm font-bold text-primary-foreground shadow-brand transition hover:opacity-90 mt-2"
            >
              Explore community <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>
        </div>

        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.44, ease: EASE }}
          className="mt-10 grid grid-cols-3 border-t border-border divide-x divide-border"
        >
          {[
            { label: "Active investors", value: fmtInvestors(stats?.investorCount ?? null), icon: TrendingUp },
            { label: "Verified businesses", value: fmtBusinesses(stats?.verifiedBusinessCount ?? null), icon: Building2 },
            { label: "Avg. return", value: fmtReturn(stats?.avgTargetReturn ?? null), icon: Sparkles },
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

function CommunityFeed() {
  const [draft, setDraft] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["dash-community", "feed"],
    queryFn: async () => {
      try { return await fetchPostsWithAuthors(12); } catch { return []; }
    },
  });

  return (
    <motion.section
      variants={stagger}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
    >
      <motion.div variants={fadeUp} transition={{ duration: 0.4, ease: EASE }} className="flex items-center justify-between mb-6">
        <h2 className="font-display text-lg font-bold">Community Feed</h2>
        <Link to="/community" className="flex items-center gap-1 text-xs font-semibold text-muted-foreground transition hover:text-foreground">
          Full feed <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </motion.div>

      <motion.div variants={fadeUp} transition={{ duration: 0.4, ease: EASE }} className="mb-8 flex items-start gap-3">
        <div className="h-8 w-8 shrink-0 rounded-full gradient-brand flex items-center justify-center text-xs font-bold text-primary-foreground">
          {/* avatar */}
        </div>
        <div className="flex-1 rounded-2xl border border-border bg-card px-4 py-3">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Share something with the community…"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
          />
          {draft.length > 0 && (
            <div className="mt-3 flex justify-end">
              <Link to="/community" className="inline-flex items-center gap-1.5 rounded-lg gradient-brand px-3 py-1.5 text-xs font-bold text-primary-foreground">
                <Send className="h-3 w-3" /> Post
              </Link>
            </div>
          )}
        </div>
      </motion.div>

      {isLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3.5">
              <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-secondary" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 w-28 animate-pulse rounded bg-secondary" />
                <div className="h-3 w-full animate-pulse rounded bg-secondary" />
                <div className="h-3 w-4/5 animate-pulse rounded bg-secondary" />
              </div>
            </div>
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="py-12 text-center">
          <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-secondary flex items-center justify-center">
            <MessageCircle className="h-6 w-6 text-muted-foreground/50" />
          </div>
          <p className="font-display text-base font-semibold">Nothing here yet</p>
          <p className="mt-1.5 text-sm text-muted-foreground">Be the first to post something.</p>
          <Link to="/community" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
            Go to community <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-border/60">
          {(data as any[]).map((p) => (
            <div key={p.id} className="flex items-start gap-3.5 py-5 first:pt-0">
              {p.profile?.username ? (
                <Link to="/users/$username" params={{ username: p.profile.username }} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full gradient-brand text-xs font-bold text-primary-foreground transition hover:opacity-80">
                  {(p.profile?.full_name ?? "U").charAt(0)}
                </Link>
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full gradient-brand text-xs font-bold text-primary-foreground">
                  {(p.profile?.full_name ?? "U").charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  {p.profile?.username ? (
                    <Link to="/users/$username" params={{ username: p.profile.username }} className="text-sm font-semibold leading-none hover:text-primary transition-colors">
                      {p.profile?.full_name ?? "Member"}
                    </Link>
                  ) : (
                    <p className="text-sm font-semibold leading-none">{p.profile?.full_name ?? "Member"}</p>
                  )}
                  {p.created_at && (
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-3">{p.content}</p>
                <div className="mt-3 flex items-center gap-4">
                  <button className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition">
                    <MessageCircle className="h-3.5 w-3.5" /> Reply
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.section>
  );
}

function LevelUpCards() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE, delay: 0.2 }}
      className="space-y-3"
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Level up</p>

      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-4">
        <div className="absolute top-0 inset-x-0 h-px gradient-brand" />
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 shrink-0 rounded-xl gradient-brand flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">Start investing</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Back verified African businesses and earn returns.</p>
            <Link
              to="/browse"
              className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary"
            >
              Browse deals <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-4">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 shrink-0 rounded-xl bg-secondary flex items-center justify-center">
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">Register a business</p>
            <p className="mt-0.5 text-xs text-muted-foreground">List your company and raise capital from investors.</p>
            <Link
              to="/my-business"
              className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary"
            >
              Get started <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
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
