import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/icon.png";
import { authHero } from "@/assets/images";
import { useAuth } from "@/hooks/use-auth";
import { ShieldCheck, BadgeCheck, TrendingUp } from "lucide-react";

const searchSchema = z.object({ mode: z.enum(["signin", "signup"]).default("signin") });

export const Route = createFileRoute("/auth")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({ meta: [{ title: "Sign in - CoFund" }] }),
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
  const [otpBusy, setOtpBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);
  const passwordChecks = getPasswordChecks(password);
  const passwordStrong = passwordChecks.every((item) => item.valid);

  if (!loading && user) {
    throw redirect({ to: profile?.onboarded ? "/home" : "/onboarding" });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        if (!passwordStrong) throw new Error("Use a stronger password to protect investment access");
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("Check your email to verify and activate your account");
        navigate({ to: "/auth", search: { mode: "signin" } });
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

  async function sendMagicLink() {
    if (!email) {
      toast.error("Enter your email first");
      return;
    }
    setOtpBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        },
      });
      if (error) throw error;
      toast.success("Magic link sent to your email");
    } catch (err: any) {
      toast.error(err.message ?? "Could not send magic link");
    } finally {
      setOtpBusy(false);
    }
  }

  async function sendResetLink() {
    if (!email) {
      toast.error("Enter your email first");
      return;
    }
    setResetBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      });
      if (error) throw error;
      toast.success("Password reset link sent");
    } catch (err: any) {
      toast.error(err.message ?? "Could not send reset email");
    } finally {
      setResetBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="hidden relative overflow-hidden p-12 lg:flex">
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
            <div className="absolute inset-0 gradient-mesh opacity-60" />
          </div>

          <div className="relative z-10 flex min-h-full w-full flex-col justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <img src={logo} alt="CoFund" className="h-10 w-10 object-contain" />
              <span className="font-display text-xl font-bold">CoFund</span>
            </Link>

            <div className="mx-auto w-full max-w-xl">
              <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-card/40 shadow-soft backdrop-blur-sm">
                <img
                  src={authHero}
                  alt="Investors collaborating"
                  className="h-[28rem] w-full object-cover object-center"
                />
              </div>

              <div className="mt-8">
                <blockquote className="font-display text-2xl font-bold leading-snug">
                  "The platform where Africa's next great businesses get funded - and investors find real opportunities."
                </blockquote>
                <div className="mt-8 space-y-3">
                  {[
                    { Icon: ShieldCheck, text: "Escrow-protected investments" },
                    { Icon: BadgeCheck, text: "Every business KYC verified" },
                    { Icon: TrendingUp, text: "Track returns & milestones live" },
                  ].map(({ Icon, text }) => (
                    <div key={text} className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Icon className="h-4 w-4 text-brand-green" /> {text}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center px-4 py-12 sm:px-8">
          <div className="w-full max-w-sm">
            <Link to="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
              <img src={logo} alt="CoFund" className="h-9 w-9 object-contain" />
              <span className="font-display text-lg font-bold">CoFund</span>
            </Link>

            <h1 className="font-display text-2xl font-bold">
              {mode === "signup" ? "Create your account" : "Welcome back"}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {mode === "signup" ? "Join Africa's business ecosystem." : "Sign in to continue your journey."}
            </p>
            <div className="mt-4 rounded-2xl border border-primary/15 bg-primary/5 p-4 text-sm text-muted-foreground">
              Investment actions should require verified email, MFA, and approved KYC/KYB before money can move.
            </div>

            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              {mode === "signup" && (
                <Field label="Full name" type="text" value={fullName} onChange={setFullName} required />
              )}
              <Field label="Email address" type="email" value={email} onChange={setEmail} required />
              <Field label="Password" type="password" value={password} onChange={setPassword} required minLength={mode === "signup" ? 12 : 6} />
              {mode === "signup" && (
                <div className="rounded-xl border border-border bg-card/60 p-3 text-xs text-muted-foreground">
                  <p className="font-medium text-foreground">Password standard</p>
                  <div className="mt-2 grid gap-1">
                    {passwordChecks.map((item) => (
                      <p key={item.label} className={item.valid ? "text-brand-green" : ""}>
                        {item.valid ? "Passed" : "Pending"}: {item.label}
                      </p>
                    ))}
                  </div>
                </div>
              )}
              <button
                type="submit"
                disabled={busy}
                className="gradient-brand mt-2 w-full rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-brand transition hover:opacity-90 disabled:opacity-50"
              >
                {busy ? "Please wait..." : mode === "signup" ? "Create account" : "Sign in"}
              </button>
            </form>

            {mode === "signin" && (
              <div className="mt-4 grid gap-2">
                <button
                  type="button"
                  onClick={sendMagicLink}
                  disabled={otpBusy}
                  className="w-full rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary disabled:opacity-50"
                >
                  {otpBusy ? "Sending magic link..." : "Email me a magic link"}
                </button>
                <button
                  type="button"
                  onClick={sendResetLink}
                  disabled={resetBusy}
                  className="w-full text-sm text-muted-foreground transition hover:text-foreground disabled:opacity-50"
                >
                  {resetBusy ? "Sending reset link..." : "Forgot password?"}
                </button>
              </div>
            )}

            <p className="mt-6 text-center text-sm text-muted-foreground">
              {mode === "signup" ? (
                <>
                  Already a member?{" "}
                  <Link to="/auth" search={{ mode: "signin" }} className="font-semibold text-primary hover:text-foreground">
                    Sign in
                  </Link>
                </>
              ) : (
                <>
                  New to CoFund?{" "}
                  <Link to="/auth" search={{ mode: "signup" }} className="font-semibold text-primary hover:text-foreground">
                    Create an account
                  </Link>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function getPasswordChecks(password: string) {
  return [
    { label: "At least 12 characters", valid: password.length >= 12 },
    { label: "Uppercase and lowercase letters", valid: /[A-Z]/.test(password) && /[a-z]/.test(password) },
    { label: "At least one number", valid: /\d/.test(password) },
    { label: "At least one symbol", valid: /[^A-Za-z0-9]/.test(password) },
  ];
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
        className="w-full rounded-xl border border-white/10 bg-card px-3.5 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}
