import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/app-layout";
import { toast } from "sonner";
import {
  Home,
  Rocket,
  Users,
  BookOpen,
  Flame,
  Send,
  MessageCircle,
  Hash,
  Heart,
  MoreHorizontal,
  Pencil,
  Trash2,
  X,
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

const CIRCLES = [
  { name: "Agriculture", emoji: "🌾" },
  { name: "Technology", emoji: "💻" },
  { name: "Healthcare", emoji: "🏥" },
  { name: "Fintech", emoji: "💳" },
  { name: "Real Estate", emoji: "🏘️" },
  { name: "Energy", emoji: "⚡" },
  { name: "Hospitality", emoji: "🏨" },
  { name: "Manufacturing", emoji: "🏭" },
  { name: "Retail", emoji: "🛍️" },
  { name: "Education", emoji: "📚" },
  { name: "Startup", emoji: "🚀" },
  { name: "Logistics", emoji: "🚚" },
];

type PostData = {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
  category?: string | null;
  profile: { full_name: string | null; avatar_url?: string | null } | null;
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
};

type CommentRow = {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
  profile?: { full_name: string | null } | null;
};

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateStr).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
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

  const [profilesRes, likesRes, myLikesRes, commentsRes] = await Promise.allSettled([
    supabase.from("profiles").select("id, full_name, avatar_url").in("id", authorIds),
    supabase.from("post_likes").select("post_id").in("post_id", ids),
    supabase.from("post_likes").select("post_id").in("post_id", ids).eq("user_id", userId),
    supabase.from("post_comments").select("post_id").in("post_id", ids),
  ]);

  const profiles = profilesRes.status === "fulfilled" ? (profilesRes.value.data ?? []) : [];
  const likes = likesRes.status === "fulfilled" ? (likesRes.value.data ?? []) : [];
  const myLikes = myLikesRes.status === "fulfilled" ? (myLikesRes.value.data ?? []) : [];
  const comments = commentsRes.status === "fulfilled" ? (commentsRes.value.data ?? []) : [];

  const profileMap = new Map(profiles.map((p) => [p.id, p]));
  const likeMap = new Map<string, number>();
  const commentMap = new Map<string, number>();
  const myLikeSet = new Set(myLikes.map((l) => l.post_id));

  for (const l of likes) likeMap.set(l.post_id, (likeMap.get(l.post_id) ?? 0) + 1);
  for (const c of comments) commentMap.set(c.post_id, (commentMap.get(c.post_id) ?? 0) + 1);

  let result: PostData[] = posts.map((p) => ({
    ...p,
    profile: profileMap.get(p.author_id) ?? null,
    like_count: likeMap.get(p.id) ?? 0,
    comment_count: commentMap.get(p.id) ?? 0,
    liked_by_me: myLikeSet.has(p.id),
  }));

  if (opts.sortByLikes) result = result.sort((a, b) => b.like_count - a.like_count);
  return result;
}

function CommunityPage() {
  const [tab, setTab] = useState<Tab>("feed");
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [circleFilter, setCircleFilter] = useState<string | null>(null);

  return (
    <AppLayout>
      <div className="min-h-full bg-background">
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
              {tab === "feed" && <FeedTab activeTopic={activeTopic} />}
              {tab === "startup-hub" && <StartupHubTab />}
              {tab === "circles" && (
                <CirclesTab circleFilter={circleFilter} setCircleFilter={setCircleFilter} />
              )}
              {tab === "knowledge" && <KnowledgeTab />}
              {tab === "trending" && <TrendingTab />}
            </main>

            <aside className="hidden lg:block space-y-6">
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

function Compose({
  onPosted,
  category,
  placeholder,
}: {
  onPosted: () => void;
  category?: string;
  placeholder?: string;
}) {
  const { user, profile } = useAuth();
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);
  const initial = (profile?.full_name ?? user?.email ?? "U").charAt(0).toUpperCase();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !content.trim()) return;
    setBusy(true);
    const { error } = await supabase
      .from("posts")
      .insert({ author_id: user.id, content: content.trim(), category: category ?? "discussion" });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setContent("");
    onPosted();
    toast.success("Posted!");
  }

  return (
    <form onSubmit={submit} className="mb-6 flex items-start gap-3">
      <div className="gradient-brand flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-primary-foreground">
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder ?? "Share something with the community…"}
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
              <Send className="h-3.5 w-3.5" />
              Post
            </button>
          </div>
        )}
      </div>
    </form>
  );
}

function CommentThread({
  postId,
  userId,
  userInitial,
  onCountChange,
}: {
  postId: string;
  userId: string;
  userInitial: string;
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
        .select("id, full_name")
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
    const { error } = await supabase
      .from("post_comments")
      .update({ content: editText.trim() })
      .eq("id", id);
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
    <div className="mt-4 border-l-2 border-border pl-4 space-y-3">
      {isLoading ? (
        <p className="text-xs text-muted-foreground animate-pulse">Loading replies…</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground">No replies yet — be first.</p>
      ) : (
        comments.map((c) => (
          <div key={c.id} className="flex items-start gap-2.5">
            <div className="gradient-brand flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-primary-foreground">
              {(c.profile?.full_name ?? "U").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold">{c.profile?.full_name ?? "Member"}</span>
                  <span className="text-[10px] text-muted-foreground">{relativeTime(c.created_at)}</span>
                </div>
                {c.author_id === userId && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => { setEditingId(c.id); setEditText(c.content); }}
                      className="text-muted-foreground hover:text-foreground transition"
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => deleteComment(c.id)}
                      className="text-muted-foreground hover:text-destructive transition"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
              {editingId === c.id ? (
                <div className="mt-1">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    rows={2}
                    className="w-full resize-none rounded-lg border border-primary/40 bg-secondary px-2.5 py-1.5 text-xs outline-none"
                    autoFocus
                  />
                  <div className="mt-1 flex gap-2">
                    <button
                      onClick={() => saveEdit(c.id)}
                      className="text-[10px] font-bold text-primary"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="text-[10px] text-muted-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="mt-0.5 text-xs leading-relaxed text-foreground/80">{c.content}</p>
              )}
            </div>
          </div>
        ))
      )}

      <div className="flex items-center gap-2 pt-1">
        <div className="gradient-brand flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-primary-foreground">
          {userInitial}
        </div>
        <div className="flex flex-1 items-center gap-2 rounded-xl border border-border bg-card px-3 py-2">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                postComment();
              }
            }}
            placeholder="Write a reply…"
            className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground/50"
          />
          {newComment.trim() && (
            <button
              onClick={postComment}
              disabled={sending}
              className="shrink-0 text-primary disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

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
  const [showComments, setShowComments] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(post.content);
  const isOwn = post.author_id === userId;

  async function toggleLike() {
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLikeCount((c) => c + (wasLiked ? -1 : 1));
    if (wasLiked) {
      await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", userId);
    } else {
      await supabase.from("post_likes").insert({ post_id: post.id, user_id: userId });
    }
  }

  async function saveEdit() {
    if (!editText.trim() || editText.trim() === post.content) {
      setEditing(false);
      return;
    }
    const { error } = await supabase
      .from("posts")
      .update({ content: editText.trim() })
      .eq("id", post.id);
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

  const authorInitial = (post.profile?.full_name ?? "U").charAt(0).toUpperCase();

  return (
    <article className="py-5 first:pt-0">
      <div className="flex items-start gap-3">
        <div className="gradient-brand flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-primary-foreground">
          {authorInitial}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-bold leading-none">{post.profile?.full_name ?? "Member"}</p>
              <span className="text-[11px] text-muted-foreground">{relativeTime(post.created_at)}</span>
              {post.category && post.category !== "discussion" && (
                <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  {post.category}
                </span>
              )}
            </div>

            {isOwn && (
              <div className="relative shrink-0">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-8 z-20 w-36 overflow-hidden rounded-xl border border-border bg-card shadow-elevated">
                    <button
                      onClick={() => { setEditing(true); setMenuOpen(false); }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-semibold hover:bg-secondary transition"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Edit post
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false); deletePost(); }}
                      className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-semibold text-destructive hover:bg-destructive/10 transition"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

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
                <button
                  onClick={saveEdit}
                  className="gradient-brand rounded-lg px-3 py-1.5 text-xs font-bold text-primary-foreground"
                >
                  Save
                </button>
                <button
                  onClick={() => { setEditing(false); setEditText(post.content); }}
                  className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
                >
                  <X className="h-3 w-3" />
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm leading-relaxed text-foreground/80 whitespace-pre-wrap">
              {post.content}
            </p>
          )}

          <div className="mt-3 flex items-center gap-4">
            <button
              onClick={toggleLike}
              className={`flex items-center gap-1.5 text-[12px] font-semibold transition-colors ${
                liked ? "text-rose-500" : "text-muted-foreground hover:text-rose-400"
              }`}
            >
              <Heart className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`} />
              {likeCount > 0 ? likeCount : "Like"}
            </button>
            <button
              onClick={() => setShowComments((v) => !v)}
              className="flex items-center gap-1.5 text-[12px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              {commentCount > 0
                ? `${commentCount} ${commentCount === 1 ? "reply" : "replies"}`
                : "Reply"}
            </button>
          </div>

          {showComments && (
            <CommentThread
              postId={post.id}
              userId={userId}
              userInitial={userInitial}
              onCountChange={setCommentCount}
            />
          )}
        </div>
      </div>
    </article>
  );
}

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
      <div className="py-16 text-center">
        <MessageCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground/20" />
        <p className="font-display text-base font-semibold">Nothing here yet</p>
        <p className="mt-2 text-sm text-muted-foreground">
          {emptyMessage ?? "Be the first to post in this feed."}
        </p>
      </div>
    );
  }
  return (
    <div className="divide-y divide-border/40">
      {posts.map((p) => (
        <PostCard key={p.id} post={p} userId={userId} userInitial={userInitial} qk={qk} />
      ))}
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-5">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-secondary" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-3 w-24 animate-pulse rounded bg-secondary" />
            <div className="h-3 w-full animate-pulse rounded bg-secondary" />
            <div className="h-3 w-3/4 animate-pulse rounded bg-secondary" />
          </div>
        </div>
      ))}
    </div>
  );
}

function FeedTab({ activeTopic }: { activeTopic: string | null }) {
  const { user, profile } = useAuth();
  const qc = useQueryClient();
  const userId = user?.id ?? "";
  const userInitial = (profile?.full_name ?? user?.email ?? "U").charAt(0).toUpperCase();
  const qk = ["community", "feed", activeTopic];

  const { data = [], isLoading } = useQuery({
    queryKey: qk,
    enabled: !!userId,
    queryFn: () =>
      fetchEnrichedPosts(userId, {
        category: activeTopic?.toLowerCase() ?? undefined,
      }),
  });

  if (isLoading) return <FeedSkeleton />;

  return (
    <div>
      <Compose onPosted={() => qc.invalidateQueries({ queryKey: qk })} />
      <PostList
        posts={data}
        userId={userId}
        userInitial={userInitial}
        qk={qk}
        emptyMessage="Be the first to share something with the community."
      />
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
      <div className="mb-5 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4">
        <p className="font-display text-base font-bold">🚀 Startup Hub</p>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
          Share your idea, look for co-founders, mentors, or early-stage capital.
          All posts here are tagged as <span className="font-semibold text-foreground">startup</span>.
        </p>
      </div>
      <Compose
        category="startup"
        placeholder="Share your startup idea, looking for co-founder, need mentorship…"
        onPosted={() => qc.invalidateQueries({ queryKey: qk })}
      />
      {isLoading ? (
        <FeedSkeleton />
      ) : (
        <PostList
          posts={data}
          userId={userId}
          userInitial={userInitial}
          qk={qk}
          emptyMessage="No startup posts yet. Share your idea first."
        />
      )}
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
      <div>
        <p className="mb-5 text-sm text-muted-foreground">
          Join an industry circle to see posts, deals, and discussions from your sectors.
        </p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {CIRCLES.map((c) => (
            <button
              key={c.name}
              onClick={() => setCircleFilter(c.name)}
              className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card px-4 py-6 font-semibold hover:border-primary/40 hover:bg-secondary/40 transition-all"
            >
              <span className="text-3xl">{c.emoji}</span>
              <span className="text-sm">{c.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const circle = CIRCLES.find((c) => c.name === circleFilter);

  return (
    <div>
      <div className="mb-5 flex items-center gap-3">
        <button
          onClick={() => setCircleFilter(null)}
          className="text-sm font-semibold text-muted-foreground hover:text-foreground transition"
        >
          ← Circles
        </button>
        <span className="text-muted-foreground">/</span>
        <span className="text-sm font-bold">
          {circle?.emoji} {circleFilter}
        </span>
      </div>
      <Compose
        category={circleFilter.toLowerCase()}
        placeholder={`Post about ${circleFilter}…`}
        onPosted={() => qc.invalidateQueries({ queryKey: qk })}
      />
      {isLoading ? (
        <FeedSkeleton />
      ) : (
        <PostList
          posts={data}
          userId={userId}
          userInitial={userInitial}
          qk={qk}
          emptyMessage={`No posts in the ${circleFilter} circle yet.`}
        />
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

  if (isLoading) return <FeedSkeleton />;

  return (
    <div>
      <div className="mb-5 flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3">
        <Flame className="h-4 w-4 text-amber-400 shrink-0" />
        <span className="text-sm text-muted-foreground">Posts sorted by most likes.</span>
      </div>
      <PostList
        posts={data}
        userId={userId}
        userInitial={userInitial}
        qk={qk}
        emptyMessage="No posts yet — be the first to share something."
      />
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
      <div className="grid gap-5 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-2xl bg-card" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="py-20 text-center">
        <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground/20" />
        <p className="font-display text-base font-semibold">No articles yet</p>
        <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
          Business resources and learning content will appear here as they're published.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {data.map((a: any) => (
        <article
          key={a.id}
          className="group overflow-hidden rounded-2xl border border-border bg-card hover:border-primary/20 transition-colors"
        >
          {a.cover_url ? (
            <img src={a.cover_url} alt="" className="aspect-video w-full object-cover" />
          ) : (
            <div className="aspect-video w-full gradient-mesh" />
          )}
          <div className="p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">{a.category}</p>
            <h3 className="mt-1.5 font-display text-base font-bold group-hover:text-primary transition-colors">
              {a.title}
            </h3>
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{a.excerpt}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
