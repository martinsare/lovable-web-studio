import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/app-layout";
import { ArrowLeft, Send, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/messages/$conversationId")({
  head: () => ({ meta: [{ title: "Conversation · CoFund" }] }),
  component: ConversationPage,
});

const db = supabase as any;
const EASE = [0.25, 0.46, 0.45, 0.94] as const;

function ConversationPage() {
  const { conversationId } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { data: conversation } = useQuery({
    queryKey: ["conversation", conversationId],
    queryFn: async () => {
      const { data, error } = await db
        .from("conversations")
        .select("id,participant_a,participant_b")
        .eq("id", conversationId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!conversationId,
  });

  const otherId = conversation
    ? conversation.participant_a === user?.id
      ? conversation.participant_b
      : conversation.participant_a
    : null;

  const { data: otherProfile } = useQuery({
    queryKey: ["profile-mini", otherId],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id,full_name,username,avatar_url,occupation")
        .eq("id", otherId!)
        .maybeSingle();
      return data;
    },
    enabled: !!otherId,
  });

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: async () => {
      const { data, error } = await db
        .from("messages")
        .select("id,sender_id,body,created_at,read_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!conversationId,
  });

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "instant" });
  }, []);

  useEffect(() => { scrollToBottom(false); }, [messages.length]);

  // Real-time subscription
  useEffect(() => {
    if (!conversationId) return;
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ["messages", conversationId] });
          qc.invalidateQueries({ queryKey: ["conversations", user?.id] });
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId, qc, user?.id]);

  async function send() {
    const body = draft.trim();
    if (!body || !conversationId || !user?.id || sending) return;
    setSending(true);
    setDraft("");
    try {
      const { error } = await db.from("messages").insert({
        conversation_id: conversationId,
        sender_id: user.id,
        body,
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["messages", conversationId] });
      qc.invalidateQueries({ queryKey: ["conversations", user.id] });
      setTimeout(() => scrollToBottom(), 100);
    } catch {
      setDraft(body);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function fmtTime(ts: string) {
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  function fmtDate(ts: string) {
    const d = new Date(ts);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  }

  const displayName = otherProfile?.full_name ?? otherProfile?.username ?? "Member";
  const initial = displayName.charAt(0).toUpperCase();

  // Group messages by date
  const grouped: { date: string; msgs: any[] }[] = [];
  for (const msg of messages as any[]) {
    const date = new Date(msg.created_at).toDateString();
    if (!grouped.length || grouped[grouped.length - 1].date !== date) {
      grouped.push({ date, msgs: [msg] });
    } else {
      grouped[grouped.length - 1].msgs.push(msg);
    }
  }

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-var(--header-height,60px))] flex-col">
        {/* Header */}
        <div className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-xl">
          <div className="mx-auto max-w-2xl px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <Link
                to="/messages"
                className="rounded-xl p-1.5 text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>

              {otherProfile ? (
                <Link
                  to="/users/$username"
                  params={{ username: otherProfile.username ?? "" }}
                  className="flex items-center gap-2.5 hover:opacity-80 transition"
                >
                  {otherProfile.avatar_url ? (
                    <img src={otherProfile.avatar_url} alt={displayName} className="h-9 w-9 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full gradient-brand text-sm font-bold text-primary-foreground">
                      {initial}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-bold leading-none">{displayName}</p>
                    {otherProfile.occupation && (
                      <p className="mt-0.5 text-xs text-muted-foreground truncate">{otherProfile.occupation}</p>
                    )}
                  </div>
                </Link>
              ) : (
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-secondary" />
                  <div className="h-4 w-28 animate-pulse rounded bg-secondary" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                    <div className={`h-10 animate-pulse rounded-2xl bg-secondary ${i % 2 === 0 ? "w-48" : "w-40"}`} />
                  </div>
                ))}
              </div>
            ) : messages.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
                  <MessageCircle className="h-7 w-7 text-muted-foreground/40" />
                </div>
                <p className="font-display text-base font-bold">Start the conversation</p>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  Say hello to {displayName}!
                </p>
              </motion.div>
            ) : (
              <div className="space-y-6">
                {grouped.map(({ date, msgs }) => (
                  <div key={date}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-[11px] font-semibold text-muted-foreground">
                        {fmtDate(msgs[0].created_at)}
                      </span>
                      <div className="h-px flex-1 bg-border" />
                    </div>

                    <div className="space-y-1.5">
                      {msgs.map((msg: any, i: number) => {
                        const isMine = msg.sender_id === user?.id;
                        const prevMine = i > 0 && msgs[i - 1].sender_id === user?.id;
                        const isFirst = !prevMine || i === 0;

                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, ease: EASE }}
                            className={`flex items-end gap-2 ${isMine ? "justify-end" : "justify-start"} ${isFirst ? "mt-3" : "mt-0.5"}`}
                          >
                            {!isMine && isFirst && (
                              <div className="mb-0.5 shrink-0">
                                {otherProfile?.avatar_url ? (
                                  <img src={otherProfile.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
                                ) : (
                                  <div className="flex h-6 w-6 items-center justify-center rounded-full gradient-brand text-[10px] font-bold text-primary-foreground">
                                    {initial}
                                  </div>
                                )}
                              </div>
                            )}
                            {!isMine && !isFirst && <div className="w-6 shrink-0" />}

                            <div className="group flex flex-col items-end gap-0.5 max-w-[75%]">
                              <div
                                className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                                  isMine
                                    ? "gradient-brand text-primary-foreground rounded-br-md"
                                    : "bg-card border border-border/60 text-foreground rounded-bl-md"
                                }`}
                              >
                                {msg.body}
                              </div>
                              <span className="text-[10px] text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity px-1">
                                {fmtTime(msg.created_at)}
                              </span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <div ref={bottomRef} />
              </div>
            )}
          </div>
        </div>

        {/* Composer */}
        <div className="border-t border-border bg-background/95 backdrop-blur-xl">
          <div className="mx-auto max-w-2xl px-4 py-3 sm:px-6">
            <div className="flex items-end gap-2.5">
              <div className="flex-1 rounded-2xl border border-border bg-card px-4 py-3 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition">
                <textarea
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder={`Message ${displayName}…`}
                  rows={1}
                  className="w-full resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground/40 max-h-36"
                  style={{ fieldSizing: "content" } as React.CSSProperties}
                />
              </div>
              <button
                onClick={send}
                disabled={!draft.trim() || sending}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl gradient-brand text-primary-foreground shadow-brand transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground/40 text-center">
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
