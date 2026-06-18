import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CheckCheck,
  ChevronRight,
  FileText,
  TrendingUp,
  Star,
  AlertCircle,
  Info,
} from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { markNotificationRead } from "@/lib/notifications";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications · CoFund" }] }),
  component: NotificationsPage,
});

function categoryIcon(category: string) {
  if (category?.includes("mentor")) return Star;
  if (category?.includes("document") || category?.includes("statement")) return FileText;
  if (category?.includes("investment") || category?.includes("fund")) return TrendingUp;
  if (category?.includes("alert") || category?.includes("security")) return AlertCircle;
  return Info;
}

function NotificationsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    enabled: !!user?.id,
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("user_notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  async function openNotification(item: any) {
    if (!item.read_at) {
      await markNotificationRead(item.id);
      await queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
      await queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count", user?.id] });
    }
    if (item.action_href) window.location.assign(item.action_href);
  }

  async function markAllRead() {
    const unreadIds = notifications.filter((n) => !n.read_at).map((n) => n.id);
    if (!unreadIds.length) return;
    await (supabase as any)
      .from("user_notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", unreadIds);
    await queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    await queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count", user?.id] });
  }

  const unread = notifications.filter((n) => !n.read_at).length;

  return (
    <AppLayout>
      <div className="min-h-full bg-background">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">

          {/* Inbox header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="font-display text-2xl font-bold">Inbox</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {unread > 0 ? (
                  <><span className="font-semibold text-primary">{unread} unread</span> · {notifications.length} total</>
                ) : (
                  `${notifications.length} notification${notifications.length !== 1 ? "s" : ""}`
                )}
              </p>
            </div>
            {unread > 0 && (
              <button
                type="button"
                onClick={() => void markAllRead()}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="py-20 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
                <Bell className="h-7 w-7 text-muted-foreground/50" />
              </div>
              <p className="font-display text-base font-semibold">You're all caught up</p>
              <p className="mt-2 text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Workflow alerts, admin reviews, and issuer updates will appear here.
              </p>
            </div>
          ) : (
            <div>
              {/* Group by unread / read */}
              {unread > 0 && (
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">New</p>
              )}
              <div className="divide-y divide-border/40">
                {notifications.map((item, index) => {
                  const Icon = categoryIcon(item.category ?? "");
                  const isRead = !!item.read_at;
                  const showReadLabel = unread > 0 && !isRead === false && index === unread;

                  return (
                    <div key={item.id}>
                      {showReadLabel && (
                        <p className="py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Earlier</p>
                      )}
                      <button
                        type="button"
                        onClick={() => void openNotification(item)}
                        className={`group w-full flex items-start gap-4 py-4 text-left transition-colors hover:bg-secondary/30 rounded-xl px-3 -mx-3 ${
                          isRead ? "opacity-70" : ""
                        }`}
                      >
                        {/* Unread dot */}
                        <div className="relative mt-1 shrink-0">
                          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
                            isRead
                              ? "bg-secondary text-muted-foreground"
                              : "bg-primary/10 text-primary"
                          }`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          {!isRead && (
                            <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-primary border-2 border-background" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <p className={`text-sm leading-snug ${isRead ? "font-medium text-muted-foreground" : "font-bold text-foreground"}`}>
                              {item.title}
                            </p>
                            <span className="shrink-0 text-[11px] text-muted-foreground">
                              {new Date(item.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                            </span>
                          </div>
                          {item.body && (
                            <p className="mt-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                              {item.body}
                            </p>
                          )}
                          {item.action_href && (
                            <div className="mt-2 flex items-center gap-1 text-xs font-semibold text-primary">
                              {item.action_label ?? "Open"} <ChevronRight className="h-3.5 w-3.5" />
                            </div>
                          )}
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
            Looking for investment records?{" "}
            <Link to="/portfolio" className="font-semibold text-primary hover:text-foreground transition">
              Visit your portfolio →
            </Link>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
