import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  BadgeCheck,
  CheckCircle2,
  Fingerprint,
  MailCheck,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  XCircle,
} from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { useAuth } from "@/hooks/use-auth";
import { useSecurity } from "@/hooks/use-security";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/security")({
  head: () => ({ meta: [{ title: "Security · CoFund" }] }),
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
  ].filter((f) => f.status === "verified");

  const setupNeeded = !security?.emailVerified || (security?.verifiedFactors ?? 0) === 0 || !security?.canAccessFundingActions;

  const checks = [
    {
      label: "Email verified",
      ok: !!security?.emailVerified,
      note: security?.emailVerified ? "Your email address is confirmed." : "Check your inbox to verify your email.",
    },
    {
      label: "Two-factor auth",
      ok: (security?.verifiedFactors ?? 0) > 0,
      note: (security?.verifiedFactors ?? 0) > 0 ? "At least one second factor is active." : "Add a TOTP app or phone number for stronger security.",
    },
    {
      label: "Funding access",
      ok: !!security?.canAccessFundingActions,
      note: security?.canAccessFundingActions ? "Your account is ready for investment actions." : "Complete email verification and add 2FA to unlock funding.",
    },
  ];

  const passedCount = checks.filter((c) => c.ok).length;
  const strengthPct = Math.round((passedCount / checks.length) * 100);
  const strengthLabel = strengthPct === 100 ? "Strong" : strengthPct >= 67 ? "Fair" : "Weak";
  const strengthColor = strengthPct === 100 ? "bg-brand-green" : strengthPct >= 67 ? "bg-amber-400" : "bg-destructive";

  return (
    <AppLayout>
      <div className="min-h-full bg-background">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">

          {/* Security score header */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-5 p-6">
              <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl ${
                setupNeeded ? "bg-amber-500/10" : "bg-brand-green/10"
              }`}>
                {setupNeeded
                  ? <ShieldAlert className="h-8 w-8 text-amber-400" />
                  : <ShieldCheck className="h-8 w-8 text-brand-green" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <p className="font-display text-xl font-bold">Account Security</p>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    setupNeeded ? "bg-amber-400/10 text-amber-400" : "bg-brand-green/10 text-brand-green"
                  }`}>
                    {strengthLabel}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {setupNeeded
                    ? "Complete the checks below to protect your investment account."
                    : "Your account meets all security requirements for investing."}
                </p>
                {/* Strength bar */}
                <div className="mt-3 h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${strengthColor}`}
                    style={{ width: `${strengthPct}%` }}
                  />
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">{passedCount} of {checks.length} checks passed</p>
              </div>
            </div>

            {/* Security checklist */}
            <div className="border-t border-border divide-y divide-border">
              {checks.map((check) => (
                <div key={check.label} className="flex items-start gap-4 px-6 py-4">
                  {check.ok
                    ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-green" />
                    : <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{check.label}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{check.note}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-bold ${check.ok ? "text-brand-green" : "text-destructive"}`}>
                    {check.ok ? "Done" : "Action needed"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Next recommended action */}
          {security?.recommendedActions?.length ? (
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-5 py-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                <div>
                  <p className="text-sm font-bold text-amber-400">Next step</p>
                  <p className="mt-1 text-sm text-muted-foreground">{security.recommendedActions[0]}</p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Two-factor methods */}
          <Section icon={<Smartphone className="h-4 w-4" />} title="Two-factor methods">
            {verifiedFactors.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border py-8 text-center">
                <Shield className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm font-semibold">No 2FA configured</p>
                <p className="mt-1 text-xs text-muted-foreground">Add a TOTP authenticator app or phone number to secure your account.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {verifiedFactors.map((factor) => (
                  <div key={factor.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-green/10 text-brand-green">
                      <BadgeCheck className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold capitalize">{factor.factor_type} authenticator</p>
                      <p className="text-xs text-muted-foreground">Verified and active</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 rounded-xl bg-secondary/50 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
              CoFund may require step-up authentication before funding actions or sensitive account changes.
            </div>
          </Section>

          {/* Signed-in account */}
          <Section icon={<MailCheck className="h-4 w-4" />} title="Signed-in account">
            <div className="divide-y divide-border">
              {[
                { label: "Email", value: user?.email ?? "—" },
                { label: "Current session", value: "This browser" },
                { label: "Session assurance", value: security?.assuranceLevel ?? "unknown" },
                { label: "Funding readiness", value: security?.canAccessFundingActions ? "Ready" : "Not ready" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between gap-3 py-3 text-sm first:pt-0 last:pb-0">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-semibold">{value}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* Activity log */}
          <Section icon={<Fingerprint className="h-4 w-4" />} title="Recent security activity">
            {!events.length ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No security events yet. MFA setup and step-up approvals will appear here.
              </p>
            ) : (
              <div className="divide-y divide-border">
                {events.map((event) => (
                  <div key={event.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold">{formatEventLabel(event.event_type)}</p>
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    {event.note && <p className="mt-0.5 text-xs text-muted-foreground">{event.note}</p>}
                  </div>
                ))}
              </div>
            )}
          </Section>
        </div>
      </div>
    </AppLayout>
  );
}

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-border">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
          {icon}
        </div>
        <h2 className="text-sm font-bold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function formatEventLabel(eventType: string) {
  return eventType.replaceAll("_", " ").replace(/\b\w/g, (m) => m.toUpperCase());
}
