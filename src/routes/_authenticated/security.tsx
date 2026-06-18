import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Fingerprint, Lock, MailCheck, ShieldCheck, Smartphone } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { useAuth } from "@/hooks/use-auth";
import { useSecurity } from "@/hooks/use-security";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/security")({
  head: () => ({ meta: [{ title: "Security Center - CoFund" }] }),
  component: SecurityCenterPage,
});

function SecurityCenterPage() {
  const { user } = useAuth();
  const { security } = useSecurity();
  const queryClient = useQueryClient();

  const { data: factors } = useQuery({
    enabled: !!user?.id,
    queryKey: ["security", "factors", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;
      return data;
    },
  });

  const { data: events = [] } = useQuery({
    enabled: !!user?.id,
    queryKey: ["security", "events", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("security_events")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(12);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const recordSecurityEvent = useMutation({
    mutationFn: async (payload: { event_type: string; note: string; metadata?: Record<string, unknown> }) => {
      if (!user?.id) throw new Error("You must be signed in.");
      const { error } = await (supabase as any).from("security_events").insert({
        user_id: user.id,
        event_type: payload.event_type,
        note: payload.note,
        metadata: payload.metadata ?? {},
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Security event recorded.");
      await queryClient.invalidateQueries({ queryKey: ["security", "events", user?.id] });
    },
    onError: (error: any) => {
      toast.error(error?.message ?? "Could not record that security action.");
    },
  });

  const verifiedFactors = [
    ...(factors?.totp ?? []),
    ...(factors?.phone ?? []),
    ...(factors?.webauthn ?? []),
  ].filter((factor) => factor.status === "verified");

  return (
    <PageShell
      eyebrow="Security"
      title="Security Center"
      description="Funding access should sit behind visible account security, MFA status, and step-up controls. This is the operator-ready security surface for money movement."
    >
      <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
        <section className="space-y-6">
          <Card
            icon={<ShieldCheck className="h-5 w-5 text-primary" />}
            title="Funding security posture"
            description="These checks should be complete before any transfer, wire, or wallet-funded commitment."
          >
            <div className="grid gap-3">
              <StatusRow label="Email verified" value={security?.emailVerified ? "Yes" : "No"} />
              <StatusRow label="Assurance level" value={security?.assuranceLevel ?? "unknown"} />
              <StatusRow label="Verified MFA factors" value={String(security?.verifiedFactors ?? 0)} />
              <StatusRow label="Funding actions allowed" value={security?.canAccessFundingActions ? "Yes" : "No"} />
            </div>
          </Card>

          <Card icon={<Lock className="h-5 w-5 text-primary" />} title="Recommended actions">
            <div className="grid gap-3">
              {(security?.recommendedActions ?? ["No open security recommendations right now."]).map((item) => (
                <div key={item} className="rounded-2xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                  {item}
                </div>
              ))}
            </div>
          </Card>

          <Card icon={<Fingerprint className="h-5 w-5 text-primary" />} title="Security event log">
            <div className="grid gap-3">
              {!events.length ? (
                <p className="text-sm text-muted-foreground">No security events have been recorded yet.</p>
              ) : (
                events.map((event) => (
                  <div key={event.id} className="rounded-2xl border border-border bg-background px-4 py-3">
                    <p className="text-sm font-semibold">{event.event_type.replaceAll("_", " ")}</p>
                    {event.note && <p className="mt-1 text-sm text-muted-foreground">{event.note}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(event.created_at).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </section>

        <section className="space-y-6">
          <Card icon={<Smartphone className="h-5 w-5 text-primary" />} title="MFA factors">
            <div className="grid gap-3">
              {verifiedFactors.length === 0 ? (
                <p className="text-sm text-muted-foreground">No verified second factors are enrolled yet.</p>
              ) : (
                verifiedFactors.map((factor) => (
                  <div key={factor.id} className="rounded-2xl border border-border bg-background px-4 py-3 text-sm">
                    <p className="font-semibold">{factor.factor_type}</p>
                    <p className="text-muted-foreground">Verified factor</p>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  void recordSecurityEvent.mutateAsync({
                    event_type: "mfa_enrollment_requested",
                    note: "User opened MFA enrollment flow from the security center.",
                  })
                }
                className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground"
              >
                Record MFA enrollment intent
              </button>
              <button
                type="button"
                onClick={() =>
                  void recordSecurityEvent.mutateAsync({
                    event_type: "step_up_requested",
                    note: "User requested a step-up challenge before a sensitive action.",
                  })
                }
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Record step-up request
              </button>
            </div>
          </Card>

          <Card icon={<MailCheck className="h-5 w-5 text-primary" />} title="Current session">
            <div className="grid gap-3">
              <StatusRow label="Signed-in email" value={user?.email ?? "-"} />
              <StatusRow label="Session assurance" value={security?.assuranceLevel ?? "unknown"} />
              <StatusRow label="Current device" value="This browser session" />
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Supabase handles session issuance. CoFund should still keep a product-visible audit trail of key security actions, step-up requests, and future session/device changes.
            </p>
          </Card>
        </section>
      </div>
    </PageShell>
  );
}

function Card({ icon, title, description, children }: { icon: ReactNode; title: string; description?: string; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="font-display text-xl font-bold">{title}</h2>
      </div>
      {description && <p className="mt-2 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-5">{children}</div>
    </div>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
