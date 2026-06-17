import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/cofund-logo.png.asset.json";
import { useAuth } from "@/hooks/use-auth";

const searchSchema = z.object({ mode: z.enum(["signin", "signup"]).default("signin") });

export const Route = createFileRoute("/auth")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({ meta: [{ title: "Sign in · CoFund" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);

  if (!loading && user) {
    throw redirect({ to: profile?.onboarded ? "/home" : "/onboarding" });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("Welcome to CoFund!");
        navigate({ to: "/onboarding" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
        navigate({ to: "/home" });
      }
    } catch (err: any) {
      toast.error(err.message ?? "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-secondary/40">
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-4 py-12">
        <Link to="/" className="mb-8 flex items-center gap-2.5">
          <img src={logo.url} alt="CoFund" className="h-10 w-10" />
          <span className="font-display text-2xl font-bold">CoFund</span>
        </Link>
        <div className="w-full rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8">
          <h1 className="font-display text-2xl font-bold">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mode === "signup" ? "Join Africa's business ecosystem." : "Sign in to continue."}
          </p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <Field label="Full name" type="text" value={fullName} onChange={setFullName} required />
            )}
            <Field label="Email" type="email" value={email} onChange={setEmail} required />
            <Field label="Password" type="password" value={password} onChange={setPassword} required minLength={6} />
            <button
              type="submit"
              disabled={busy}
              className="gradient-brand w-full rounded-lg px-4 py-2.5 text-sm font-semibold text-white shadow-soft transition hover:opacity-90 disabled:opacity-50"
            >
              {busy ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signup" ? (
              <>
                Already a member?{" "}
                <Link to="/auth" search={{ mode: "signin" }} className="font-semibold text-primary">
                  Sign in
                </Link>
              </>
            ) : (
              <>
                New to CoFund?{" "}
                <Link to="/auth" search={{ mode: "signup" }} className="font-semibold text-primary">
                  Create an account
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  required,
  minLength,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        minLength={minLength}
        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}