import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageShell, EmptyState } from "@/components/page-shell";
import { toast } from "sonner";
import { Home, Rocket, Users, BookOpen, Flame, Send } from "lucide-react";

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

function CommunityPage() {
  const [tab, setTab] = useState<Tab>("feed");
  return (
    <PageShell eyebrow="Connect & grow" title="Community" description="Share, learn, and connect with founders, investors and operators across Africa.">
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-white/[0.06] bg-card p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              tab === t.id ? "gradient-brand text-white shadow-soft" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_260px]">
        <div className="min-w-0">
          {tab === "feed" && <Feed />}
          {tab === "startup-hub" && <StartupHub />}
          {tab === "circles" && <Circles />}
          {tab === "knowledge" && <Knowledge />}
          {tab === "trending" && <Trending />}
        </div>
        <aside className="space-y-4">
          <SidebarCard title="Topics" items={["Hospitality", "Agriculture", "Manufacturing", "Technology", "Healthcare", "Retail"]} />
          <SidebarCard title="Locations" items={["Lagos", "Abuja", "Ibadan", "Port Harcourt", "Kano"]} />
        </aside>
      </div>
    </PageShell>
  );
}

function SidebarCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-card p-5">
      <p className="text-xs font-semibold uppercase tracking-widest text-primary">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((i) => (
          <span key={i} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-foreground/80 cursor-pointer hover:text-foreground transition">{i}</span>
        ))}
      </div>
    </div>
  );
}

function Feed() {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["community", "feed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("id,content,category,created_at,profiles(full_name,avatar_url)")
        .order("created_at", { ascending: false }).limit(30);
      if (error) throw error;
      return data ?? [];
    },
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !content.trim()) return;
    setBusy(true);
    const { error } = await supabase.from("posts").insert({ author_id: user.id, content: content.trim(), category: "discussion" });
    setBusy(false);
    if (error) return toast.error(error.message);
    setContent("");
    qc.invalidateQueries({ queryKey: ["community", "feed"] });
    toast.success("Posted");
  }

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="rounded-2xl border border-white/[0.06] bg-card p-5">
        <div className="flex items-start gap-3">
          <div className="gradient-brand flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white">
            {(profile?.full_name ?? "U").charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share an update, ask a question, or start a discussion…"
              rows={2}
              className="w-full resize-none rounded-xl border border-white/10 bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                disabled={busy || !content.trim()}
                className="gradient-brand inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                <Send className="h-3.5 w-3.5" /> Post
              </button>
            </div>
          </div>
        </div>
      </form>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-card" />)}</div>
      ) : !data || data.length === 0 ? (
        <EmptyState title="The feed is quiet" hint="Be the first to share something with the community." />
      ) : (
        data.map((p: any) => (
          <article key={p.id} className="rounded-2xl border border-white/[0.06] bg-card p-5">
            <div className="flex items-start gap-3">
              <div className="gradient-brand flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white">
                {(p.profiles?.full_name ?? "U").charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{p.profiles?.full_name ?? "Member"}</p>
                  <span className="text-xs text-muted-foreground">· {new Date(p.created_at).toLocaleDateString()}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/80 leading-relaxed">{p.content}</p>
              </div>
            </div>
          </article>
        ))
      )}
    </div>
  );
}

function StartupHub() {
  return <EmptyState title="Startup Hub — coming next" hint="Publish ideas, find co-founders, mentors, designers and capital. We're wiring this up next." />;
}
function Circles() {
  return <EmptyState title="Circles — coming next" hint="Industry circles, local circles, founder circles, and private project circles." />;
}
function Knowledge() {
  const { data, isLoading } = useQuery({
    queryKey: ["community", "articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learning_articles")
        .select("id,title,excerpt,category,cover_url")
        .eq("published", true)
        .order("created_at", { ascending: false }).limit(12);
      if (error) throw error;
      return data ?? [];
    },
  });
  if (isLoading) return <div className="h-40 animate-pulse rounded-2xl bg-card" />;
  if (!data || data.length === 0)
    return <EmptyState title="No articles yet" hint="Business resources will appear here as they're published." />;
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {data.map((a: any) => (
        <article key={a.id} className="overflow-hidden rounded-2xl border border-white/[0.06] bg-card">
          {a.cover_url && <img src={a.cover_url} alt="" className="aspect-video w-full object-cover" />}
          <div className="p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">{a.category}</p>
            <h3 className="mt-1 font-display text-base font-bold">{a.title}</h3>
            <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{a.excerpt}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
function Trending() {
  return <EmptyState title="Trending — coming next" hint="Top businesses, posts, funding rounds, ideas and discussions of the week." />;
}
