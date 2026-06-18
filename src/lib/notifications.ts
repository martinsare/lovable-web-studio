import { supabase } from "@/integrations/supabase/client";

export type AppNotification = {
  id: string;
  user_id: string;
  category: string;
  title: string;
  body: string | null;
  action_label: string | null;
  action_href: string | null;
  read_at: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export async function createNotification(input: {
  userId: string;
  category: string;
  title: string;
  body?: string | null;
  actionLabel?: string | null;
  actionHref?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const { error } = await (supabase as any).from("user_notifications").insert({
    user_id: input.userId,
    category: input.category,
    title: input.title,
    body: input.body ?? null,
    action_label: input.actionLabel ?? null,
    action_href: input.actionHref ?? null,
    metadata: input.metadata ?? {},
  });

  if (error) throw error;
}

export async function createNotifications(
  inputs: Array<{
    userId: string;
    category: string;
    title: string;
    body?: string | null;
    actionLabel?: string | null;
    actionHref?: string | null;
    metadata?: Record<string, unknown>;
  }>,
) {
  if (!inputs.length) return;

  const { error } = await (supabase as any).from("user_notifications").insert(
    inputs.map((input) => ({
      user_id: input.userId,
      category: input.category,
      title: input.title,
      body: input.body ?? null,
      action_label: input.actionLabel ?? null,
      action_href: input.actionHref ?? null,
      metadata: input.metadata ?? {},
    })),
  );

  if (error) throw error;
}

export async function markNotificationRead(notificationId: string) {
  const { error } = await (supabase as any)
    .from("user_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", notificationId)
    .is("read_at", null);

  if (error) throw error;
}
