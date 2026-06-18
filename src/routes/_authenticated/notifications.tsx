import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";
import { PageShell, EmptyState } from "@/components/page-shell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { markNotificationRead } from "@/lib/notifications";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({ meta: [{ title: "Notifications - CoFund" }] }),
  component: NotificationsPage,
});

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

    if (item.action_href) {
      window.location.assign(item.action_href);
    }
  }

  async function markAllRead() {
    const unreadIds = notifications.filter((item) => !item.read_at).map((item) => item.id);
    if (!unreadIds.length) return;

    const { error } = await (supabase as any)
      .from("user_notifications")
      .update({ read_at: new Date().toISOString() })
      .in("id", unreadIds);
    if (error) throw error;

    await queryClient.invalidateQueries({ queryKey: ["notifications", user?.id] });
    await queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count", user?.id] });
  }

  return (
    <PageShell
      eyebrow="Inbox"
      title="Notifications"
      description="Uploads, approvals, issuer updates, and investor record delivery should all leave a visible trail here."
      actions={
        <button
          type="button"
          onClick={() => void markAllRead()}
          className="hidden rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground sm:inline-flex"
        >
          <CheckCheck className="mr-2 h-4 w-4" />
          Mark all read
        </button>
      }
    >
      {!notifications.length ? (
        <EmptyState title="No notifications yet" hint="Workflow alerts, admin reviews, and issuer updates will appear here." />
      ) : (
        <div className="grid gap-3">
          {notifications.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => void openNotification(item)}
              className={`rounded-2xl border p-5 text-left transition ${
                item.read_at ? "border-border bg-card" : "border-primary/30 bg-primary/5"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    {item.body ? <p className="mt-1 text-sm text-muted-foreground">{item.body}</p> : null}
                    <p className="mt-2 text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  {!item.read_at ? (
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">Unread</span>
                  ) : null}
                  {item.action_href ? (
                    <span className="text-xs font-semibold text-primary">
                      {item.action_label ?? "Open"}
                    </span>
                  ) : null}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="mt-6 text-sm text-muted-foreground">
        Need portfolio records too? Visit <Link to="/portfolio" className="font-semibold text-primary">Portfolio</Link>.
      </div>
    </PageShell>
  );
}
