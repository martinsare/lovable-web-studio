import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useReferenceData, useRefValues } from "@/hooks/use-reference-data";
import { AppLayout } from "@/components/app-layout";
import { toast } from "sonner";
import {
  MessageCircle,
  Heart,
  MoreHorizontal,
  Pencil,
  Trash2,
  Bookmark,
  Share2,
  Search,
  BookOpen,
  Users,
  Flame,
  Rocket,
  Home,
  Send,
  X,
} from "lucide-react";
import { EmptyFeedIllustration } from "@/components/animated-illustration";

export const Route = createFileRoute("/_authenticated/community")({
  head: () => ({ meta: [{ title: "Community · CoFund" }] }),
  component: CommunityPage,
});

type Tab = "feed" | "startup-hub" | "trending" | "knowledge" | "circles";

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "feed", label: "For You", icon: Home },
  { id: "startup-hub", label: "Startup Hub", icon: Rocket },
  { id: "trending", label: "Trending", icon: Flame },
  { id: "knowledge", label: "Knowledge", icon: BookOpen },
  { id: "circles", label: "Circles", icon: Users },
];


type PostData = {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
  category?: string | null;
  profile: { full_name: string | null; username?: string | null; avatar_url?: string | null } | null;
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
  bookmarked_by_me: boolean;
};

type CommentRow = {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
  profile?: { full_name: string | null; username?: string | null } | null;
};

function relativeTime(d: string): string {
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function fmtCount(n: number): string {
  if (n <= 0) return "";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

async function fetchEnrichedPosts(
  userId: string,
  opts: { category?: string; sortByLikes?: boolean } = {}
): Promise<PostData[]> {
  let query = supabase
    .from("posts")
    .select("id, author_id, content, created_at, category, business_id")
    .is("business_id", null)
    .limit(40);

  if (opts.category) query = query.ilike("category", opts.category);
  if (!opts.sortByLikes) query = query.order("created_at", { ascending: false });

  const { data: posts, error } = await query;
  if (error) throw error;
  if (!posts?.length) return [];

  const ids = posts.map((p) => p.id);
  const authorIds = [...new Set(posts.map((p) => p.author_id))];

  const [pRes, lRes, mlRes, cRes, bmRes] = await Promise.allSettled([
    supabase.from("profiles").select("id, full_name, username, avatar_url").in("id", authorIds),
    supabase.from("post_likes").select("post_id").in("post_id", ids),
    supabase.from("post_likes").select("post_id").in("post_id", ids).eq("user_id", userId),
    supabase.from("post_comments").select("post_id").in("post_id", ids),
    supabase.from("post_bookmarks").select("post_id").in("post_id", ids).eq("user_id", userId),
  ]);

  const profiles = pRes.status === "fulfilled" ? (pRes.value.data ?? []) : [];
  const likes = lRes.status === "fulfilled" ? (lRes.value.data ?? []) : [];
  const myLikes = mlRes.status === "fulfilled" ? (mlRes.value.data ?? []) : [];
  const comments = cRes.status === "fulfilled" ? (cRes.value.data ?? []) : [];
  const myBookmarks = bmRes.status === "fulfilled" ? (bmRes.value.data ?? []) : [];

  const pm = new Map(profiles.map((p) => [p.id, p]));
  const likeMap = new Map<string, number>();
  const cmtMap = new Map<string, number>();
  const mySet = new Set(myLikes.map((l) => l.post_id));
  const myBmSet = new Set(myBookmarks.map((b) => b.post_id));

  for (const l of likes) likeMap.set(l.post_id, (likeMap.get(l.post_id) ?? 0) + 1);
  for (const c of comments) cmtMap.set(c.post_id, (cmtMap.get(c.post_id) ?? 0) + 1);

  let result: PostData[] = posts.map((p) => ({
    ...p,
    profile: pm.get(p.author_id) ?? null,
    like_count: likeMap.get(p.id) ?? 0,
    comment_count: cmtMap.get(p.id) ?? 0,
    liked_by_me: mySet.has(p.id),
    bookmarked_by_me: myBmSet.has(p.id),
  }));

  if (opts.sortByLikes) result = result.sort((a, b) => b.like_count - a.like_count);
  return result;
}

// ─────────────────────────────────────────────────────────────
//  Page
// ─────────────────────────────────────────────────────────────
function CommunityPage() {
  const [tab, setTab] = useState<Tab>("feed");
  const [circleFilter, setCircleFilter] = useState<string | null>(null);

  return (
    <AppLayout>
      <div className="flex min-h-full">
        <div className="flex w-full">

          {/* ── Center column ── */}
          <div className="flex-1 min-w-0 border-r border-border">

            {/* Sticky tab bar */}
            <div className="sticky top-0 z-10 flex border-b border-border bg-background/95 backdrop-blur-xl">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative flex flex-1 flex-col items-center justify-center py-3.5 text-xs font-bold transition-colors ${
                    tab === t.id
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/30"
                  }`}
                >
                  <t.icon className="h-4 w-4 mb-0.5" />
                  <span className="hidden sm:block">{t.label}</span>
                  {tab === t.id && (
                    <span className="absolute bottom-0 left-1/2 h-[3px] w-8 -translate-x-1/2 rounded-full bg-primary" />
                  )}
                </button>
              ))}
            </div>

            {tab === "feed" && <FeedTab />}
            {tab === "startup-hub" && <StartupHubTab />}
            {tab === "trending" && <TrendingTab />}
            {tab === "knowledge" && <KnowledgeTab />}
            {tab === "circles" && (
              <CirclesTab circleFilter={circleFilter} setCircleFilter={setCircleFilter} />
            )}
          </div>

          {/* ── Right sidebar ── */}
          <aside className="hidden xl:block w-[300px] shrink-0">
            <div className="sticky top-0 max-h-screen overflow-y-auto p-5 space-y-4">
              <RightSidebar />
            </div>
          </aside>
        </div>
      </div>
    </AppLayout>
  );
}

// ─────────────────────────────────────────────────────────────
//  Right sidebar
// ─────────────────────────────────────────────────────────────
function RightSidebar() {
  const [q, setQ] = useState("");

  const { data: trending = [] } = useQuery({
    queryKey: ["community", "trending-categories"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("posts")
        .select("category")
        .not("category", "is", null)
        .is("business_id", null);
      const counts: Record<string, number> = {};
      for (const p of data ?? []) {
        if (p.category && p.category !== "discussion") {
          counts[p.category] = (counts[p.category] ?? 0) + 1;
        }
      }
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([cat, count], i) => ({ cat, count, rank: i + 1 }));
    },
  });

  const { data: members = [] } = useQuery({
    queryKey: ["community", "active-members"],
    staleTime: 120_000,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url")
        .not("full_name", "is", null)
        .limit(4);
      return data ?? [];
    },
  });

  return (
    <>
      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search CoFund…"
          className="w-full rounded-full border border-border bg-secondary pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary/50 focus:bg-background transition placeholder:text-muted-foreground/60"
        />
      </div>

      {/* Trending topics */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <p className="border-b border-border px-4 py-3.5 font-display text-[15px] font-bold">
          Trending in CoFund
        </p>
        {trending.length === 0 ? (
          <p className="px-4 py-5 text-xs text-muted-foreground">No trending topics yet.</p>
        ) : (
          <div className="divide-y divide-border/50">
            {trending.map(({ cat, count, rank }) => (
              <div key={cat} className="px-4 py-3 hover:bg-secondary/40 transition-colors cursor-default">
                <p className="text-[10px] text-muted-foreground">#{rank} · Investment sector</p>
                <p className="mt-0.5 text-sm font-bold capitalize">{cat}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {count} {count === 1 ? "post" : "posts"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active members */}
      {members.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <p className="border-b border-border px-4 py-3.5 font-display text-[15px] font-bold">
            Active Members
          </p>
          <div className="divide-y divide-border/50">
            {members.map((m: any) => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/40 transition-colors">
                <div className="gradient-brand flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-primary-foreground">
                  {(m.full_name ?? "U").charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{m.full_name}</p>
                  {m.username && (
                    <p className="truncate text-xs text-muted-foreground">@{m.username}</p>
                  )}
                </div>
                <div className="h-2 w-2 shrink-0 rounded-full bg-primary" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stat card */}
      <div className="rounded-2xl border border-border/60 bg-card p-4">
        <p className="text-xs font-bold text-muted-foreground">Community size</p>
        <p className="mt-1 font-display text-2xl font-bold">2,400+</p>
        <p className="text-xs text-muted-foreground">investors & founders</p>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
//  Compose
// ─────────────────────────────────────────────────────────────
function XCompose({
  onPosted,
  defaultCategory = "discussion",
  placeholder,
}: {
  onPosted: () => void;
  defaultCategory?: string;
  placeholder?: string;
}) {
  const { user, profile } = useAuth();
  const [content, setContent] = useState("");
  const [category, setCategory] = useState(defaultCategory);
  const [busy, setBusy] = useState(false);
  const categories = useRefValues("community_category");
  const limit = 500;
  const initial = (profile?.full_name ?? user?.email ?? "U").charAt(0).toUpperCase();

  async function submit() {
    if (!user || !content.trim()) return;
    setBusy(true);
    const { error } = await supabase
      .from("posts")
      .insert({ author_id: user.id, content: content.trim(), category });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setContent("");
    onPosted();
    toast.success("Posted!");
  }

  return (
    <div className="border-b border-border px-4 py-4">
      <div className="flex gap-3">
        <div className="gradient-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-primary-foreground">
          {initial}
        </div>
        <div className="flex-1 min-w-0">
          <textarea
            value={content}
            onChange={(e) => { if (e.target.value.length <= limit) setContent(e.target.value); }}
            placeholder={placeholder ?? "What's happening in your world?"}
            rows={content.length > 80 ? 4 : 2}
            className="w-full resize-none bg-transparent text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground/50"
          />

          {content.trim() && (
            <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-full border border-primary/30 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>

              <div className="flex items-center gap-3">
                {limit - content.length <= 80 && (
                  <span className={`text-xs font-bold tabular-nums ${limit - content.length <= 20 ? "text-destructive" : "text-amber-400"}`}>
                    {limit - content.length}
                  </span>
                )}
                <button
                  onClick={submit}
                  disabled={busy || !content.trim()}
                  className="gradient-brand rounded-full px-5 py-2 text-sm font-bold text-primary-foreground shadow-brand disabled:opacity-50"
                >
                  {busy ? "Posting…" : "Post"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Comment thread
// ─────────────────────────────────────────────────────────────
function CommentThread({
  postId,
  userId,
  userInitial,
  authorName,
  onCountChange,
}: {
  postId: string;
  userId: string;
  userInitial: string;
  authorName: string;
  onCountChange: (fn: (n: number) => number) => void;
}) {
  const qc = useQueryClient();
  const qk = ["comments", postId];
  const [newComment, setNewComment] = useState("");
  const [sending, setSending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const { data: comments = [], isLoading } = useQuery<CommentRow[]>({
    queryKey: qk,
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("post_comments")
        .select("id, author_id, content, created_at")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (error || !rows?.length) return [];
      const authorIds = [...new Set(rows.map((r) => r.author_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, username")
        .in("id", authorIds);
      const pm = new Map((profiles ?? []).map((p) => [p.id, p]));
      return rows.map((r) => ({ ...r, profile: pm.get(r.author_id) ?? null }));
    },
  });

  async function postComment() {
    if (!newComment.trim()) return;
    setSending(true);
    const { error } = await supabase
      .from("post_comments")
      .insert({ post_id: postId, author_id: userId, content: newComment.trim() });
    setSending(false);
    if (error) { toast.error("Could not post reply."); return; }
    setNewComment("");
    qc.invalidateQueries({ queryKey: qk });
    onCountChange((n) => n + 1);
  }

  async function saveEdit(id: string) {
    if (!editText.trim()) return;
    const { error } = await supabase.from("post_comments").update({ content: editText.trim() }).eq("id", id);
    if (error) { toast.error("Could not update."); return; }
    setEditingId(null);
    qc.invalidateQueries({ queryKey: qk });
  }

  async function deleteComment(id: string) {
    const { error } = await supabase.from("post_comments").delete().eq("id", id);
    if (error) { toast.error("Could not delete."); return; }
    qc.invalidateQueries({ queryKey: qk });
    onCountChange((n) => Math.max(0, n - 1));
    toast.success("Reply deleted.");
  }

  return (
    <div className="mt-3 border-t border-border/40 pt-3">
      <p className="mb-3 text-xs text-muted-foreground">
        Replying to <span className="font-semibold text-primary">{authorName}</span>
      </p>

      {isLoading ? (
        <div className="space-y-3 pb-3">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-2.5">
              <div className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-secondary" />
              <div className="flex-1 space-y-1.5 pt-0.5">
                <div className="h-2.5 w-20 animate-pulse rounded bg-secondary" />
                <div className="h-2.5 w-3/4 animate-pulse rounded bg-secondary" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="mb-3 text-xs text-muted-foreground">No replies yet.</p>
      ) : (
        <div className="space-y-4 pb-3">
          {comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <div className="gradient-brand flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-primary-foreground">
                {(c.profile?.full_name ?? "U").charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-sm font-bold">{c.profile?.full_name ?? "Member"}</span>
                    {c.profile?.username && (
                      <span className="text-xs text-muted-foreground">@{c.profile.username}</span>
                    )}
                    <span className="text-[11px] text-muted-foreground">· {relativeTime(c.created_at)}</span>
                  </div>
                  {c.author_id === userId && (
                    <div className="flex shrink-0 gap-1">
                      <button
                        onClick={() => { setEditingId(c.id); setEditText(c.content); }}
                        className="rounded-full p-1 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => deleteComment(c.id)}
                        className="rounded-full p-1 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
                {editingId === c.id ? (
                  <div className="mt-1.5">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={2}
                      autoFocus
                      className="w-full resize-none rounded-xl border border-primary/40 bg-secondary px-3 py-2 text-sm outline-none"
                    />
                    <div className="mt-1.5 flex gap-3">
                      <button onClick={() => saveEdit(c.id)} className="text-xs font-bold text-primary">Save</button>
                      <button onClick={() => setEditingId(null)} className="text-xs text-muted-foreground">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-1 text-sm leading-relaxed text-foreground/85">{c.content}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reply compose pill */}
      <div className="flex gap-2.5 pt-1">
        <div className="gradient-brand flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-primary-foreground">
          {userInitial}
        </div>
        <div className="flex flex-1 items-center gap-2 rounded-full border border-border bg-secondary/40 px-4 py-2">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); postComment(); } }}
            placeholder="Post your reply…"
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
          />
          {newComment.trim() && (
            <button onClick={postComment} disabled={sending} className="shrink-0 text-primary disabled:opacity-40">
              <Send className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Post card
// ─────────────────────────────────────────────────────────────
function PostCard({
  post,
  userId,
  userInitial,
  qk,
}: {
  post: PostData;
  userId: string;
  userInitial: string;
  qk: unknown[];
}) {
  const qc = useQueryClient();
  const [liked, setLiked] = useState(post.liked_by_me);
  const [likeCount, setLikeCount] = useState(post.like_count);
  const [commentCount, setCommentCount] = useState(post.comment_count);
  const [showReplies, setShowReplies] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.content);
  const [bookmarked, setBookmarked] = useState(post.bookmarked_by_me);

  const isOwn = post.author_id === userId;
  const authorName = post.profile?.full_name ?? "Member";
  const authorHandle = post.profile?.username;

  async function toggleBookmark() {
    const was = bookmarked;
    setBookmarked(!was);
    toast.success(was ? "Removed from bookmarks" : "Saved to bookmarks");
    if (was) {
      await supabase
        .from("post_bookmarks")
        .delete()
        .eq("post_id", post.id)
        .eq("user_id", userId);
    } else {
      await supabase
        .from("post_bookmarks")
        .insert({ post_id: post.id, user_id: userId });
    }
  }

  function sharePost() {
    const text = `${authorName} on CoFund: "${post.content.slice(0, 120)}${post.content.length > 120 ? "…" : ""}"`;
    navigator.clipboard?.writeText(text).then(() => toast.success("Copied to clipboard"));
  }

  async function toggleLike() {
    const was = liked;
    setLiked(!was);
    setLikeCount((c) => c + (was ? -1 : 1));
    if (was) {
      await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", userId);
    } else {
      await supabase.from("post_likes").insert({ post_id: post.id, user_id: userId });
    }
  }

  async function saveEdit() {
    if (!editText.trim() || editText.trim() === post.content) { setEditing(false); return; }
    const { error } = await supabase.from("posts").update({ content: editText.trim() }).eq("id", post.id);
    if (error) { toast.error("Could not save."); return; }
    setEditing(false);
    qc.invalidateQueries({ queryKey: qk });
    toast.success("Post updated.");
  }

  async function deletePost() {
    const { error } = await supabase.from("posts").delete().eq("id", post.id);
    if (error) { toast.error("Could not delete."); return; }
    qc.invalidateQueries({ queryKey: qk });
    toast.success("Post deleted.");
  }

  return (
    <article className="border-b border-border/50 px-4 py-4 transition-colors hover:bg-secondary/10">
      <div className="flex gap-3">

        {/* Avatar col with optional thread line */}
        <div className="flex shrink-0 flex-col items-center">
          <div className="gradient-brand flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-primary-foreground">
            {authorName.charAt(0).toUpperCase()}
          </div>
          {showReplies && <div className="mt-1 w-0.5 flex-1 bg-border/60" />}
        </div>

        {/* Content col */}
        <div className="min-w-0 flex-1">

          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
              <span className="text-[15px] font-bold leading-none">{authorName}</span>
              {authorHandle && (
                <span className="text-sm text-muted-foreground">@{authorHandle}</span>
              )}
              <span className="text-muted-foreground">·</span>
              <span className="text-sm text-muted-foreground">{relativeTime(post.created_at)}</span>
              {post.category && post.category !== "discussion" && (
                <span className="ml-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                  {post.category}
                </span>
              )}
            </div>

            {/* Menu */}
            <div className="relative shrink-0">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-9 z-30 w-44 overflow-hidden rounded-2xl border border-border bg-card shadow-elevated">
                  {isOwn && (
                    <>
                      <button
                        onClick={() => { setEditing(true); setMenuOpen(false); }}
                        className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-semibold hover:bg-secondary transition"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit post
                      </button>
                      <button
                        onClick={() => { setMenuOpen(false); deletePost(); }}
                        className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-semibold text-destructive hover:bg-destructive/10 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Delete post
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => { sharePost(); setMenuOpen(false); }}
                    className="flex w-full items-center gap-2.5 px-4 py-3 text-sm font-semibold hover:bg-secondary transition"
                  >
                    <Share2 className="h-3.5 w-3.5" /> Copy text
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Body */}
          {editing ? (
            <div className="mt-2">
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                autoFocus
                className="w-full resize-none rounded-xl border border-primary/40 bg-secondary px-3 py-2.5 text-sm outline-none"
              />
              <div className="mt-2 flex items-center gap-2">
                <button onClick={saveEdit} className="gradient-brand rounded-full px-4 py-1.5 text-xs font-bold text-primary-foreground">
                  Save
                </button>
                <button
                  onClick={() => { setEditing(false); setEditText(post.content); }}
                  className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
                >
                  <X className="h-3 w-3" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-1.5 break-words text-[15px] leading-relaxed text-foreground/90 whitespace-pre-wrap">
              {post.content}
            </p>
          )}

          {/* Action bar — X-style circular hover zones */}
          <div className="mt-3 flex items-center gap-0.5">

            {/* Reply */}
            <button onClick={() => setShowReplies((v) => !v)} className="group flex items-center gap-0.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors group-hover:bg-sky-500/10 group-hover:text-sky-500">
                <MessageCircle className="h-[18px] w-[18px]" />
              </span>
              {commentCount > 0 && (
                <span className="min-w-[20px] text-xs text-muted-foreground transition-colors group-hover:text-sky-500">
                  {fmtCount(commentCount)}
                </span>
              )}
            </button>

            {/* Like */}
            <button onClick={toggleLike} className="group flex items-center gap-0.5 ml-1">
              <span className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors group-hover:bg-rose-500/10 ${liked ? "text-rose-500" : "text-muted-foreground group-hover:text-rose-500"}`}>
                <Heart className={`h-[18px] w-[18px] ${liked ? "fill-current" : ""}`} />
              </span>
              {likeCount > 0 && (
                <span className={`min-w-[20px] text-xs transition-colors ${liked ? "text-rose-500" : "text-muted-foreground group-hover:text-rose-500"}`}>
                  {fmtCount(likeCount)}
                </span>
              )}
            </button>

            {/* Bookmark */}
            <button onClick={toggleBookmark} className="group ml-1">
              <span className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors group-hover:bg-amber-400/10 ${bookmarked ? "text-amber-400" : "text-muted-foreground group-hover:text-amber-400"}`}>
                <Bookmark className={`h-[18px] w-[18px] ${bookmarked ? "fill-current" : ""}`} />
              </span>
            </button>

            {/* Share */}
            <button onClick={sharePost} className="group ml-auto">
              <span className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors group-hover:bg-secondary group-hover:text-foreground">
                <Share2 className="h-[18px] w-[18px]" />
              </span>
            </button>
          </div>

          {/* Inline reply thread */}
          {showReplies && (
            <CommentThread
              postId={post.id}
              userId={userId}
              userInitial={userInitial}
              authorName={authorName}
              onCountChange={setCommentCount}
            />
          )}
        </div>
      </div>
    </article>
  );
}

// ─────────────────────────────────────────────────────────────
//  Post list + skeleton
// ─────────────────────────────────────────────────────────────
function PostList({
  posts,
  userId,
  userInitial,
  qk,
  emptyMessage,
}: {
  posts: PostData[];
  userId: string;
  userInitial: string;
  qk: unknown[];
  emptyMessage?: string;
}) {
  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <EmptyFeedIllustration />
        <p className="mt-5 font-display text-base font-semibold">Nothing here yet</p>
        <p className="mt-2 text-sm text-muted-foreground max-w-xs leading-relaxed">
          {emptyMessage ?? "Be the first to post."}
        </p>
      </div>
    );
  }
  return (
    <div>
      {posts.map((p) => (
        <PostCard key={p.id} post={p} userId={userId} userInitial={userInitial} qk={qk} />
      ))}
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-3 border-b border-border/50 px-4 py-4">
          <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-secondary" />
          <div className="flex-1 space-y-2.5 pt-1">
            <div className="flex gap-2">
              <div className="h-3 w-24 animate-pulse rounded-full bg-secondary" />
              <div className="h-3 w-16 animate-pulse rounded-full bg-secondary" />
            </div>
            <div className="h-4 w-full animate-pulse rounded bg-secondary" />
            <div className="h-4 w-4/5 animate-pulse rounded bg-secondary" />
            <div className="flex gap-6 pt-0.5">
              <div className="h-3 w-8 animate-pulse rounded bg-secondary" />
              <div className="h-3 w-8 animate-pulse rounded bg-secondary" />
              <div className="h-3 w-8 animate-pulse rounded bg-secondary" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
//  Tab views
// ─────────────────────────────────────────────────────────────
function FeedTab() {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id ?? "";
  const userInitial = (profile?.full_name ?? user?.email ?? "U").charAt(0).toUpperCase();
  const qk = ["community", "feed"];

  const { data = [], isLoading } = useQuery({
    queryKey: qk,
    enabled: !!userId,
    queryFn: () => fetchEnrichedPosts(userId),
  });

  return (
    <div>
      <XCompose onPosted={() => qc.invalidateQueries({ queryKey: qk })} />
      {isLoading ? <FeedSkeleton /> : (
        <PostList posts={data} userId={userId} userInitial={userInitial} qk={qk}
          emptyMessage="Be the first to share something with the community." />
      )}
    </div>
  );
}

function StartupHubTab() {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id ?? "";
  const userInitial = (profile?.full_name ?? user?.email ?? "U").charAt(0).toUpperCase();
  const qk = ["community", "startup-hub"];

  const { data = [], isLoading } = useQuery({
    queryKey: qk,
    enabled: !!userId,
    queryFn: () => fetchEnrichedPosts(userId, { category: "startup" }),
  });

  return (
    <div>
      <div className="border-b border-border bg-primary/5 px-4 py-4">
        <p className="font-display text-sm font-bold">🚀 Startup Hub</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Share your idea, find co-founders, mentors, and early-stage capital.
        </p>
      </div>
      <XCompose
        defaultCategory="startup"
        placeholder="Share your startup idea or connect with the ecosystem…"
        onPosted={() => qc.invalidateQueries({ queryKey: qk })}
      />
      {isLoading ? <FeedSkeleton /> : (
        <PostList posts={data} userId={userId} userInitial={userInitial} qk={qk}
          emptyMessage="No startup posts yet — share your idea first." />
      )}
    </div>
  );
}

function TrendingTab() {
  const { user, profile } = useAuth();
  const userId = user?.id ?? "";
  const userInitial = (profile?.full_name ?? user?.email ?? "U").charAt(0).toUpperCase();
  const qk = ["community", "trending"];

  const { data = [], isLoading } = useQuery({
    queryKey: qk,
    enabled: !!userId,
    queryFn: () => fetchEnrichedPosts(userId, { sortByLikes: true }),
  });

  return (
    <div>
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Flame className="h-4 w-4 text-amber-400 shrink-0" />
        <p className="text-sm font-bold">Most liked posts</p>
      </div>
      {isLoading ? <FeedSkeleton /> : (
        <PostList posts={data} userId={userId} userInitial={userInitial} qk={qk}
          emptyMessage="Nothing trending yet — start posting!" />
      )}
    </div>
  );
}

function KnowledgeTab() {
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

  if (isLoading) {
    return (
      <div className="grid gap-4 p-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-2xl bg-secondary" />
        ))}
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <BookOpen className="mb-4 h-12 w-12 text-muted-foreground/20" />
        <p className="font-display text-base font-semibold">No articles yet</p>
        <p className="mt-2 text-sm text-muted-foreground">Learning content will appear here.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 p-4 sm:grid-cols-2">
      {data.map((a: any) => (
        <article key={a.id} className="group overflow-hidden rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors">
          {a.cover_url ? (
            <img src={a.cover_url} alt="" className="aspect-video w-full object-cover" />
          ) : (
            <div className="aspect-video w-full gradient-mesh" />
          )}
          <div className="p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{a.category}</p>
            <h3 className="mt-1.5 font-display text-base font-bold leading-snug group-hover:text-primary transition-colors">
              {a.title}
            </h3>
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{a.excerpt}</p>
          </div>
        </article>
      ))}
    </div>
  );
}

function CirclesTab({
  circleFilter,
  setCircleFilter,
}: {
  circleFilter: string | null;
  setCircleFilter: (v: string | null) => void;
}) {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const { data: circlesData = [] } = useReferenceData("community_circle");
  const userId = user?.id ?? "";
  const userInitial = (profile?.full_name ?? user?.email ?? "U").charAt(0).toUpperCase();
  const qk = ["community", "circles", circleFilter];

  const { data = [], isLoading } = useQuery({
    queryKey: qk,
    enabled: !!userId && !!circleFilter,
    queryFn: () =>
      fetchEnrichedPosts(userId, { category: circleFilter?.toLowerCase() ?? undefined }),
  });

  if (!circleFilter) {
    return (
      <div className="p-4">
        <p className="mb-4 text-sm text-muted-foreground">
          Choose an industry circle to connect with founders, investors, and operators.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {circlesData.map((c) => (
            <button
              key={c.value}
              onClick={() => setCircleFilter(c.label)}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-4 text-left transition-all hover:border-primary/40 hover:bg-secondary/40"
            >
              <span className="text-2xl">{c.metadata?.emoji}</span>
              <span className="text-sm font-semibold">{c.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const circle = circlesData.find((c) => c.label === circleFilter);

  return (
    <div>
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <button
          onClick={() => setCircleFilter(null)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <Users className="h-3.5 w-3.5" /> Circles
        </button>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-bold">{circle?.metadata?.emoji} {circleFilter}</span>
      </div>
      <XCompose
        defaultCategory={circle?.metadata?.cat ?? circleFilter.toLowerCase()}
        placeholder={`Post about ${circleFilter}…`}
        onPosted={() => qc.invalidateQueries({ queryKey: qk })}
      />
      {isLoading ? <FeedSkeleton /> : (
        <PostList posts={data} userId={userId} userInitial={userInitial} qk={qk}
          emptyMessage={`No posts in ${circleFilter} yet.`} />
      )}
    </div>
  );
}
