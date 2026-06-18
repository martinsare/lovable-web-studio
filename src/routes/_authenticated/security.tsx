import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, BadgeCheck, Fingerprint, MailCheck, ShieldCheck, Smartphone } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { useAuth } from "@/hooks/use-auth";
import { useSecurity } from "@/hooks/use-security";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/security")({
  head: () => ({ meta: [{ title: "Account Security - CoFund" }] }),
  component: SecurityCenterPage,
});

function SecurityCenterPage() {
  const { user } = useAuth();
  const { security } = useSecurity();

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

  const verifiedFactors = [
    ...(factors?.totp ?? []),
    ...(factors?.phone ?? []),
    ...(factors?.webauthn ?? []),
  ].filter((factor) => factor.status === "verified");
  const setupNeeded = !security?.emailVerified || (security?.verifiedFactors ?? 0) === 0 || !security?.canAccessFundingActions;

  return (
    <PageShell
      eyebrow="Settings"
      title="Account Security"
      description="Check your sign-in protection, two-factor setup, and whether your account is ready for funding actions."
    >
      <div className="grid gap-6">
        <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {setupNeeded ? <AlertCircle className="h-3.5 w-3.5 text-amber-500" /> : <BadgeCheck className="h-3.5 w-3.5 text-emerald-500" />}
                {setupNeeded ? "Setup recommended" : "Protected"}
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                We keep this area simple on purpose. It tells you whether your account is ready for investing and what to finish next.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-background px-4 py-3 text-sm">
              <p className="text-muted-foreground">Funding readiness</p>
              <p className="mt-1 text-lg font-bold">{security?.canAccessFundingActions ? "Ready" : "Not ready"}</p>
            </div>
          </div>
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
        <section className="space-y-6">
          <Card
            icon={<ShieldCheck className="h-5 w-5 text-primary" />}
            title="Account safety"
            description="A quick view of the checks that matter before you invest."
          >
            <div className="grid gap-3 sm:grid-cols-2">
              <StatusTile label="Email status" value={security?.emailVerified ? "Verified" : "Not verified"} tone={security?.emailVerified ? "good" : "warn"} />
              <StatusTile label="Two-factor auth" value={(security?.verifiedFactors ?? 0) > 0 ? "Enabled" : "Not set up"} tone={(security?.verifiedFactors ?? 0) > 0 ? "good" : "warn"} />
              <StatusTile label="Funding access" value={security?.canAccessFundingActions ? "Enabled" : "Locked"} tone={security?.canAccessFundingActions ? "good" : "warn"} />
              <StatusTile label="Session level" value={security?.assuranceLevel ?? "unknown"} tone="neutral" />
            </div>
            {security?.recommendedActions?.length ? (
              <div className="mt-4 rounded-2xl border border-border bg-background p-4">
                <p className="text-sm font-semibold">Next step</p>
                <p className="mt-1 text-sm text-muted-foreground">{security.recommendedActions[0]}</p>
              </div>
            ) : null}
          </Card>

          <Card icon={<Fingerprint className="h-5 w-5 text-primary" />} title="Recent activity">
            <div className="grid gap-3">
              {!events.length ? (
                <p className="text-sm text-muted-foreground">No security activity yet. Actions like MFA setup and step-up approvals will appear here.</p>
              ) : (
                events.map((event) => (
                  <div key={event.id} className="rounded-2xl border border-border bg-background px-4 py-3">
                    <p className="text-sm font-semibold">{formatEventLabel(event.event_type)}</p>
                    {event.note && <p className="mt-1 text-sm text-muted-foreground">{event.note}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">{new Date(event.created_at).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card icon={<MailCheck className="h-5 w-5 text-primary" />} title="Signed-in account">
            <div className="grid gap-3">
              <StatusRow label="Email" value={user?.email ?? "-"} />
              <StatusRow label="Current device" value="This browser session" />
              <StatusRow label="Session assurance" value={security?.assuranceLevel ?? "unknown"} />
            </div>
          </Card>
        </section>

        <section className="space-y-6">
          <Card icon={<Smartphone className="h-5 w-5 text-primary" />} title="Two-factor methods">
            <div className="grid gap-3">
              {verifiedFactors.length === 0 ? (
                <p className="text-sm text-muted-foreground">You do not have a verified second factor yet.</p>
              ) : (
                verifiedFactors.map((factor) => (
                  <div key={factor.id} className="rounded-2xl border border-border bg-background px-4 py-3 text-sm">
                    <p className="font-semibold">{factor.factor_type}</p>
                    <p className="text-muted-foreground">Verified and active</p>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4 rounded-2xl border border-border bg-background p-4">
              <p className="text-sm font-semibold">Why this matters</p>
              <p className="mt-1 text-sm text-muted-foreground">
                CoFund may ask for a stronger sign-in before you move money or approve a sensitive action.
              </p>
            </div>
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

function StatusTile({ label, value, tone }: { label: string; value: string; tone: "good" | "warn" | "neutral" }) {
  const toneClasses =
    tone === "good"
      ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
      : tone === "warn"
        ? "border-amber-500/20 bg-amber-500/5 text-amber-700 dark:text-amber-300"
        : "border-border bg-background text-foreground";

  return (
    <div className={`rounded-2xl border px-4 py-3 ${toneClasses}`}>
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 text-base font-semibold">{value}</p>
    </div>
  );
}

function formatEventLabel(eventType: string) {
  return eventType
    .replaceAll("_", " ")
    .replace(/\b\w/g, (match) => match.toUpperCase());
}
