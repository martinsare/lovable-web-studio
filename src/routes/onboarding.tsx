import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { toast } from "sonner";
import logo from "@/assets/cofund-logo.png.asset.json";
import { TrendingUp, Briefcase, Rocket, GraduationCap, Wrench, Users, Check } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  head: () => ({ meta: [{ title: "Get started · CoFund" }] }),
  component: Onboarding,
});

const ROLES: { id: AppRole; title: string; desc: string; icon: any }[] = [
  { id: "investor", title: "Investor", desc: "Discover and back verified African businesses.", icon: TrendingUp },
  { id: "business_owner", title: "Business Owner", desc: "List your business, raise capital, and grow.", icon: Briefcase },
  { id: "startup_builder", title: "Startup Builder", desc: "Share your idea and find co-founders & mentors.", icon: Rocket },
  { id: "mentor", title: "Mentor", desc: "Guide founders with your experience.", icon: GraduationCap },
  { id: "professional", title: "Professional", desc: "Offer services — legal, accounting, design, dev.", icon: Wrench },
  { id: "community_member", title: "Community Member", desc: "Learn, follow, and connect.", icon: Users },
];

function Onboarding() {
  const navigate = useNavigate();
  const { user, loading, profile, refresh } = useAuth();
  const [selected, setSelected] = useState<Set<AppRole>>(new Set(["community_member"]));
  const [busy, setBusy] = useState(false);

  if (!loading && !user) throw redirect({ to: "/auth", search: { mode: "signin" } });
  if (!loading && profile?.onboarded) throw redirect({ to: "/home" });

  function toggle(r: AppRole) {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(r)) n.delete(r);
      else n.add(r);
      return n;
    });
  }

  async function submit() {
    if (!user || selected.size === 0) return;
    setBusy(true);
    try {
      const rows = [...selected].map((role) => ({ user_id: user.id, role }));
      const { error: rErr } = await supabase.from("user_roles").upsert(rows, { onConflict: "user_id,role" });
      if (rErr) throw rErr;
      const { error: pErr } = await supabase.from("profiles").update({ onboarded: true }).eq("id", user.id);
      if (pErr) throw pErr;
      await refresh();
      toast.success("You're all set!");
      navigate({ to: "/home" });
    } catch (e: any) {
      toast.error(e.message ?? "Could not save");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-secondary/40">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <div className="mb-8 flex items-center gap-2.5">
          <img src={logo.url} alt="CoFund" className="h-9 w-9" />
          <span className="font-display text-xl font-bold">CoFund</span>
        </div>
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">What brings you to CoFund today?</h1>
        <p className="mt-2 text-muted-foreground">Pick one or more — you can change this anytime in your profile.</p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {ROLES.map((r) => {
            const active = selected.has(r.id);
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => toggle(r.id)}
                className={`relative rounded-2xl border p-5 text-left transition ${
                  active
                    ? "border-primary bg-primary/5 shadow-soft"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${active ? "gradient-brand text-white" : "bg-muted text-foreground"}`}>
                    <r.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-display text-base font-bold">{r.title}</h3>
                    <p className="mt-0.5 text-sm text-muted-foreground">{r.desc}</p>
                  </div>
                  {active && (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={submit}
          disabled={busy || selected.size === 0}
          className="gradient-brand mt-8 w-full rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-soft disabled:opacity-50 sm:w-auto"
        >
          {busy ? "Setting up…" : "Continue"}
        </button>
      </div>
    </div>
  );
}