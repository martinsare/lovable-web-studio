import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/app-layout";
import { fetchPostsWithAuthors } from "@/lib/post-feed";
import { toast } from "sonner";
import {
  Home,
  Rocket,
  Users,
  BookOpen,
  Flame,
  Send,
  MessageCircle,
  ArrowRight,
  Hash,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/community")({
  head: () => ({ meta: [{ title: "Community · CoFund" }] }),
  component: CommunityPage,
});

type Tab = "feed" | "startup-hub" | "circles" | "knowledge" | "trending";

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "feed", label: "Feed", icon: Home },
  { id: "startup-hub", label: "Startup Hub", icon: Rocket },
  { id: "circles", label: "Circles", icon: Users },
  { id: "knowledge", label: "Knowledge", icon: BookOpen },
  { id: "trending", label: "Trending", icon: Flame },
];

const TOPICS = ["Hospitality", "Agriculture", "Manufacturing", "Technology", "Healthcare", "Retail", "Fintech", "Energy", "Real Estate"];
const LOCATIONS = ["Lagos", "Abuja", "Ibadan", "Port Harcourt", "Kano", "Accra", "Nairobi"];

function CommunityPage() {
  const [tab, setTab] = useState<Tab>("feed");
  const [activeTopic, setActiveTopic] = useState<string | null>(null);

  return (
    <AppLayout>
      <div className="min-h-full bg-background">
        {/* Community header */}
        <div className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-xl">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-6 overflow-x-auto scrollbar-hide py-1">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex shrink-0 items-center gap-1.5 py-3.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                    tab === t.id
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_240px]">
            <main className="min-w-0">
              {tab === "feed" && <Feed activeTopic={activeTopic} />}
              {tab === "startup-hub" && <ComingSoon title="Startup Hub" desc="Publish ideas, find co-founders, mentors, designers and capital." />}
              {tab === "circles" && <ComingSoon title="Circles" desc="Industry circles, local circles, founder circles, and private project circles." />}
              {tab === "knowledge" && <Knowledge />}
              {tab === "trending" && <ComingSoon title="Trending" desc="Top businesses, posts, funding rounds, ideas and discussions of the week." />}
            </main>

            <aside className="space-y-6 hidden lg:block">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Topics</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TOPICS.map((topic) => (
                    <button
                      key={topic}
                      onClick={() => setActiveTopic(activeTopic === topic ? null : topic)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                        activeTopic === topic
                          ? "bg-primary text-primary-foreground"
                          : "border border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                      }`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Cities</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {LOCATIONS.map((loc) => (
                    <button
                      key={loc}
                      className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 transition"
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border/60 bg-card p-4">
                <p className="text-xs font-bold text-muted-foreground mb-1">Community</p>
                <p className="font-display text-2xl font-bold">2,400+</p>
                <p className="text-xs text-muted-foreground mt-0.5">investors & founders</p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function Feed({ activeTopic }: { activeTopic: string | null }) {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["community", "feed"],
    queryFn: async () => {
      try { return await fetchPostsWithAuthors(30); }
      catch { return []; }
    },
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !content.trim()) return;
    setBusy(true);
    const { error } = await supabase
      .from("posts")
      .insert({ author_id: user.id, content: content.trim(), category: "discussion" });
    setBusy(false);
    if (error) return toast.error(error.message);
    setContent("");
    qc.invalidateQueries({ queryKey: ["community", "feed"] });
    toast.success("Posted!");
  }

  return (
    <div>
      {/* Compose */}
      <form onSubmit={submit} className="mb-6 flex items-start gap-3">
        <div className="gradient-brand flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-primary-foreground">
          {(profile?.full_name ?? "U").charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share something with the community…"
            rows={content.length > 60 ? 3 : 1}
            className="w-full resize-none rounded-2xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary/60 placeholder:text-muted-foreground/50 transition-all"
          />
          {content.trim() && (
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                disabled={busy}
                className="gradient-brand inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-primary-foreground shadow-brand disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" /> Post
              </button>
            </div>
          )}
        </div>
      </form>

      {/* Feed */}
      {isLoading ? (
        <div className="space-y-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-secondary" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 w-24 animate-pulse rounded bg-secondary" />
                <div className="h-3 w-full animate-pulse rounded bg-secondary" />
                <div className="h-3 w-4/5 animate-pulse rounded bg-secondary" />
              </div>
            </div>
          ))}
        </div>
      ) : !data || data.length === 0 ? (
        <div className="py-16 text-center">
          <MessageCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground/20" />
          <p className="font-display text-base font-semibold">The feed is quiet</p>
          <p className="mt-2 text-sm text-muted-foreground">Be the first to share something with the community.</p>
        </div>
      ) : (
        <div className="divide-y divide-border/40">
          {data.map((p: any) => (
            <article key={p.id} className="py-5 first:pt-0">
              <div className="flex items-start gap-3">
                <div className="gradient-brand flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-primary-foreground">
                  {(p.profile?.full_name ?? "U").charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold leading-none">{p.profile?.full_name ?? "Member"}</p>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
                    {p.content}
                  </p>
                  <button className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground transition">
                    <MessageCircle className="h-3.5 w-3.5" /> Reply
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function Knowledge() {
  const { data, isLoading } = useQuery({
    queryKey: ["community", "articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learning_articles")
        .select("id,title,excerpt,category,cover_url")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      return data ?? [];
    },
  });

  if (isLoading)
    return (
      <div className="grid gap-5 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-2xl bg-card" />
        ))}
      </div>
    );

  if (!data || data.length === 0)
    return <ComingSoon title="No articles yet" desc="Business resources and learning content will appear here as they're published." />;

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {data.map((a: any) => (
        <article key={a.id} className="group overflow-hidden rounded-2xl border border-border bg-card hover:border-primary/20 transition-colors">
          {a.cover_url ? (
            <img src={a.cover_url} alt="" className="aspect-video w-full object-cover" />
          ) : (
            <div className="aspect-video w-full gradient-mesh" />
          )}
          <div className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{a.category}</p>
            <h3 className="mt-1.5 font-display text-base font-bold group-hover:text-primary transition-colors">{a.title}</h3>
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{a.excerpt}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function ComingSoon({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="py-20 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
        <ArrowRight className="h-7 w-7 text-muted-foreground/50" />
      </div>
      <p className="font-display text-base font-semibold">{title} — coming soon</p>
      <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">{desc}</p>
    </div>
  );
}
