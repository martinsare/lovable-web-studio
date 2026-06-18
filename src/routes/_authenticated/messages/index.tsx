import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/app-layout";
import {
  MessageCircle, Search, PenSquare, X, ArrowRight, Users,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/messages/")({
  head: () => ({ meta: [{ title: "Messages · CoFund" }] }),
  component: MessagesPage,
});

const db = supabase as any;
const EASE = [0.25, 0.46, 0.45, 0.94] as const;

function MessagesPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [showNewMsg, setShowNewMsg] = useState(false);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["conversations", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await db
        .from("conversations")
        .select(`
          id,
          participant_a,
          participant_b,
          last_message_at,
          last_message_preview
        `)
        .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
        .order("last_message_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id,
    refetchInterval: 10000,
  });

  const otherIds = conversations.map((c: any) =>
    c.participant_a === user?.id ? c.participant_b : c.participant_a
  );

  const { data: profileMap = {} } = useQuery({
    queryKey: ["conv-profiles", otherIds.join(",")],
    queryFn: async () => {
      if (otherIds.length === 0) return {};
      const { data } = await supabase
        .from("profiles")
        .select("id,full_name,username,avatar_url")
        .in("id", otherIds);
      const map: Record<string, any> = {};
      (data ?? []).forEach((p) => { map[p.id] = p; });
      return map;
    },
    enabled: otherIds.length > 0,
  });

  const filtered = conversations.filter((c: any) => {
    if (!search) return true;
    const otherId = c.participant_a === user?.id ? c.participant_b : c.participant_a;
    const profile = profileMap[otherId];
    const name = (profile?.full_name ?? profile?.username ?? "").toLowerCase();
    return name.includes(search.toLowerCase());
  });

  function fmtTime(ts: string) {
    const d = new Date(ts);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return d.toLocaleDateString([], { weekday: "short" });
    return d.toLocaleDateString([], { day: "numeric", month: "short" });
  }

  return (
    <AppLayout>
      <div className="min-h-full">
        {/* Header */}
        <div className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-xl">
          <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6">
            <div className="flex items-center justify-between mb-3">
              <h1 className="font-display text-xl font-bold">Messages</h1>
              <button
                onClick={() => setShowNewMsg(true)}
                className="inline-flex items-center gap-1.5 rounded-xl gradient-brand px-3 py-2 text-xs font-bold text-primary-foreground shadow-brand transition hover:opacity-90"
              >
                <PenSquare className="h-3.5 w-3.5" /> New message
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search conversations…"
                className="w-full rounded-xl border border-border bg-card pl-9 pr-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground/40 focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-2xl px-4 py-4 sm:px-6">
          {isLoading ? (
            <div className="space-y-1 mt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3.5 rounded-2xl p-3.5">
                  <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-secondary" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-28 animate-pulse rounded bg-secondary" />
                    <div className="h-3 w-4/5 animate-pulse rounded bg-secondary" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: EASE }}
              className="flex flex-col items-center justify-center py-24 text-center"
            >
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
                <MessageCircle className="h-7 w-7 text-muted-foreground/40" />
              </div>
              <p className="font-display text-lg font-bold">
                {search ? "No conversations found" : "No messages yet"}
              </p>
              <p className="mt-1.5 text-sm text-muted-foreground max-w-xs">
                {search
                  ? "Try a different name."
                  : "Message someone from their profile or start a new conversation."}
              </p>
              {!search && (
                <button
                  onClick={() => setShowNewMsg(true)}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl gradient-brand px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-brand transition hover:opacity-90"
                >
                  <PenSquare className="h-4 w-4" /> Start a conversation
                </button>
              )}
            </motion.div>
          ) : (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.05 } } }}
              className="space-y-0.5 mt-1"
            >
              {filtered.map((conv: any) => {
                const otherId = conv.participant_a === user?.id ? conv.participant_b : conv.participant_a;
                const profile = profileMap[otherId];
                const displayName = profile?.full_name ?? profile?.username ?? "Member";
                const initial = displayName.charAt(0).toUpperCase();
                return (
                  <motion.div
                    key={conv.id}
                    variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
                    transition={{ duration: 0.3, ease: EASE }}
                  >
                    <Link
                      to="/messages/$conversationId"
                      params={{ conversationId: conv.id }}
                      className="group flex items-center gap-3.5 rounded-2xl px-3 py-3.5 transition hover:bg-secondary/50"
                    >
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt={displayName} className="h-11 w-11 shrink-0 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full gradient-brand text-sm font-bold text-primary-foreground">
                          {initial}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold truncate">{displayName}</p>
                          {conv.last_message_at && (
                            <span className="shrink-0 text-[11px] text-muted-foreground">
                              {fmtTime(conv.last_message_at)}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground truncate">
                          {conv.last_message_preview ?? "No messages yet"}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showNewMsg && (
          <NewMessageModal
            userId={user?.id ?? ""}
            onClose={() => setShowNewMsg(false)}
            onConversationCreated={(id) => navigate({ to: "/messages/$conversationId", params: { conversationId: id } })}
          />
        )}
      </AnimatePresence>
    </AppLayout>
  );
}

function NewMessageModal({
  userId,
  onClose,
  onConversationCreated,
}: {
  userId: string;
  onClose: () => void;
  onConversationCreated: (id: string) => void;
}) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const { data: results = [], isLoading } = useQuery({
    queryKey: ["user-search", q],
    queryFn: async () => {
      if (q.trim().length < 2) return [];
      const { data } = await supabase
        .from("profiles")
        .select("id,full_name,username,avatar_url,occupation")
        .or(`full_name.ilike.%${q}%,username.ilike.%${q}%`)
        .neq("id", userId)
        .limit(8);
      return data ?? [];
    },
    enabled: q.trim().length >= 2,
  });

  async function startConversation(otherUserId: string) {
    const a = userId < otherUserId ? userId : otherUserId;
    const b = userId < otherUserId ? otherUserId : userId;
    const existing = await (db as any)
      .from("conversations")
      .select("id")
      .eq("participant_a", a)
      .eq("participant_b", b)
      .maybeSingle();
    if (existing.data) {
      onConversationCreated(existing.data.id);
      return;
    }
    const { data, error } = await (db as any)
      .from("conversations")
      .insert({ participant_a: a, participant_b: b })
      .select("id")
      .single();
    if (error) throw error;
    onConversationCreated(data.id);
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98 }}
        transition={{ duration: 0.25, ease: EASE }}
        className="fixed inset-x-4 top-24 z-50 mx-auto max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-display text-base font-bold">New message</h2>
          <button onClick={onClose} className="rounded-lg p-1 text-muted-foreground hover:text-foreground transition">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search people by name or username…"
              className="w-full rounded-xl border border-border bg-background pl-9 pr-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground/40 focus:border-primary/40 focus:ring-2 focus:ring-primary/10 transition"
            />
          </div>
        </div>

        <div className="pb-2 max-h-72 overflow-y-auto">
          {q.trim().length < 2 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <Users className="mb-2 h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Type at least 2 characters to search</p>
            </div>
          ) : isLoading ? (
            <div className="space-y-1 px-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 rounded-xl p-3">
                  <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-secondary" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-24 animate-pulse rounded bg-secondary" />
                    <div className="h-3 w-16 animate-pulse rounded bg-secondary" />
                  </div>
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-sm text-muted-foreground">No users found for "{q}"</p>
            </div>
          ) : (
            <div className="space-y-0.5 px-2">
              {(results as any[]).map((p) => (
                <button
                  key={p.id}
                  onClick={() => startConversation(p.id)}
                  className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-secondary/60"
                >
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt={p.full_name} className="h-9 w-9 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full gradient-brand text-xs font-bold text-primary-foreground">
                      {(p.full_name ?? p.username ?? "U").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">{p.full_name ?? p.username ?? "Member"}</p>
                    {p.username && <p className="text-xs text-muted-foreground">@{p.username}</p>}
                    {p.occupation && <p className="text-xs text-muted-foreground truncate">{p.occupation}</p>}
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );
}
