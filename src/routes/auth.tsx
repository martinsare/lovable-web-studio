import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { usePlatformStats, fmtInvestors } from "@/hooks/use-platform-stats";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/icon.png";
import { useAuth } from "@/hooks/use-auth";
import { ShieldCheck, BadgeCheck, TrendingUp, ArrowRight, Eye, EyeOff, CheckCircle2, Circle } from "lucide-react";

const EASE = [0.25, 0.46, 0.45, 0.94] as const;
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

const searchSchema = z.object({ mode: z.enum(["signin", "signup"]).default("signin") });

export const Route = createFileRoute("/auth")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({ meta: [{ title: "Sign in — CoFund" }] }),
  component: AuthPage,
});

function getChecks(password: string) {
  return [
    { label: "At least 12 characters", valid: password.length >= 12 },
    { label: "Uppercase & lowercase", valid: /[A-Z]/.test(password) && /[a-z]/.test(password) },
    { label: "At least one number", valid: /\d/.test(password) },
    { label: "At least one symbol", valid: /[^A-Za-z0-9]/.test(password) },
  ];
}

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const { data: authStats } = usePlatformStats();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);
  const [magicBusy, setMagicBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);

  const checks = getChecks(password);
  const strongEnough = checks.every((c) => c.valid);

  useEffect(() => {
    if (loading) return;
    if (user && profile?.onboarded) navigate({ to: "/home", replace: true });
    else if (user && profile && !profile.onboarded) navigate({ to: "/onboarding", replace: true });
  }, [loading, navigate, profile, user]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        if (!strongEnough) throw new Error("Please meet all password requirements");
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        toast.success("Account created! Check your email to verify.");
        navigate({ to: "/auth", search: { mode: "signin" } });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back!");
      }
    } catch (err: any) {
      toast.error(err.message ?? "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  async function sendMagicLink() {
    if (!email) { toast.error("Enter your email first"); return; }
    setMagicBusy(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false, emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined },
      });
      if (error) throw error;
      toast.success("Magic link sent — check your inbox");
    } catch (err: any) {
      toast.error(err.message ?? "Could not send magic link");
    } finally {
      setMagicBusy(false);
    }
  }

  async function sendReset() {
    if (!email) { toast.error("Enter your email first"); return; }
    setResetBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
      });
      if (error) throw error;
      toast.success("Reset link sent — check your inbox");
    } catch (err: any) {
      toast.error(err.message ?? "Could not send reset email");
    } finally {
      setResetBusy(false);
    }
  }

  return (
    <Suspense fallback={null}>
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-[0.9fr_1fr]">
        {/* Left panel */}
        <motion.div
          initial={{ opacity: 0, x: -32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.65, ease: EASE }}
          className="relative hidden flex-col justify-between overflow-hidden p-10 lg:flex"
        >
          <div className="absolute inset-0 -z-10">
            <div className="absolute inset-0 gradient-hero" />
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage:
                  "linear-gradient(to right, oklch(1 0 0 / 0.03) 1px, transparent 1px), linear-gradient(to bottom, oklch(1 0 0 / 0.03) 1px, transparent 1px)",
                backgroundSize: "48px 48px",
              }}
            />
          </div>

          <Link to="/" className="flex items-center gap-2.5">
            <img src={logo} alt="CoFund" className="h-9 w-9 object-contain" />
            <span className="font-display text-xl font-bold">CoFund</span>
          </Link>

          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            <motion.blockquote
              variants={fadeUp}
              transition={{ duration: 0.55, ease: EASE }}
              className="font-display text-3xl font-bold leading-snug text-foreground"
            >
              "Where Africa's next great businesses get funded — and investors find real opportunity."
            </motion.blockquote>
            <motion.div variants={stagger} className="mt-10 space-y-4">
              {[
                { Icon: ShieldCheck, label: "Escrow-protected", desc: "Funds held by regulated banking partners" },
                { Icon: BadgeCheck, label: "Fully verified", desc: "Every business passes KYC/KYB screening" },
                { Icon: TrendingUp, label: "Real returns", desc: "Track milestones and returns in real time" },
              ].map(({ Icon, label, desc }) => (
                <motion.div
                  key={label}
                  variants={fadeUp}
                  transition={{ duration: 0.45, ease: EASE }}
                  className="flex items-center gap-4"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5, ease: EASE }}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card/60 p-4 backdrop-blur-sm"
          >
            <div className="flex -space-x-2">
              {["A", "K", "D", "Z"].map((l) => (
                <div key={l} className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background gradient-brand text-xs font-bold text-primary-foreground">
                  {l}
                </div>
              ))}
            </div>
            <div>
              <p className="text-sm font-semibold">{fmtInvestors(authStats?.investorCount ?? null)} investors active</p>
              <p className="text-xs text-muted-foreground">Join Africa's investment community</p>
            </div>
          </motion.div>
        </motion.div>

        {/* Right panel */}
        <div className="flex flex-col items-center justify-center px-5 py-12 sm:px-10">
          <motion.div
            className="w-full max-w-[400px]"
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeUp} transition={{ duration: 0.4, ease: EASE }}>
              <Link to="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
                <img src={logo} alt="CoFund" className="h-8 w-8 object-contain" />
                <span className="font-display text-lg font-bold">CoFund</span>
              </Link>
            </motion.div>

            <motion.div variants={fadeUp} transition={{ duration: 0.45, ease: EASE }}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <h1 className="font-display text-2xl font-bold tracking-tight">
                    {mode === "signup" ? "Create your account" : "Welcome back"}
                  </h1>
                  <p className="mt-1.5 text-sm text-muted-foreground">
                    {mode === "signup"
                      ? "Join Africa's leading investment platform."
                      : "Sign in to continue your journey."}
                  </p>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            <motion.form
              variants={fadeUp}
              transition={{ duration: 0.45, ease: EASE }}
              onSubmit={onSubmit}
              className="mt-8 space-y-4"
            >
              {mode === "signup" && (
                <Field
                  label="Full name"
                  type="text"
                  value={fullName}
                  onChange={setFullName}
                  placeholder="Ada Okafor"
                  required
                />
              )}
              <Field
                label="Email address"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                required
              />
              <div>
                <label className="block">
                  <span className="mb-1.5 block text-sm font-medium text-foreground">Password</span>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={mode === "signup" ? 12 : 6}
                      placeholder={mode === "signup" ? "Min. 12 characters" : "Your password"}
                      className="w-full rounded-xl border border-border bg-card px-4 py-3 pr-11 text-sm outline-none transition placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/15"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </label>
                {mode === "signup" && password && (
                  <div className="mt-2.5 grid grid-cols-2 gap-1.5">
                    {checks.map((c) => (
                      <div key={c.label} className={`flex items-center gap-1.5 text-xs ${c.valid ? "text-brand-green" : "text-muted-foreground"}`}>
                        {c.valid
                          ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                          : <Circle className="h-3.5 w-3.5 shrink-0" />
                        }
                        {c.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={busy}
                className="mt-2 w-full rounded-xl gradient-brand py-3 text-sm font-bold text-primary-foreground shadow-brand transition hover:opacity-90 active:scale-[0.99] disabled:opacity-50"
              >
                {busy
                  ? "Please wait…"
                  : mode === "signup"
                  ? "Create account"
                  : "Sign in"}
              </button>
            </motion.form>

            {mode === "signin" && (
              <div className="mt-4 grid gap-2">
                <div className="relative flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">or</span>
                  <div className="h-px flex-1 bg-border" />
                </div>
                <button
                  onClick={sendMagicLink}
                  disabled={magicBusy}
                  className="w-full rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground/80 transition hover:border-primary/30 hover:text-foreground disabled:opacity-50"
                >
                  {magicBusy ? "Sending…" : "Email me a magic link"}
                </button>
                <button
                  onClick={sendReset}
                  disabled={resetBusy}
                  className="w-full rounded-xl px-4 py-2 text-sm text-muted-foreground transition hover:text-foreground disabled:opacity-50"
                >
                  {resetBusy ? "Sending…" : "Forgot password?"}
                </button>
              </div>
            )}

            <div className="mt-8 text-center text-sm text-muted-foreground">
              {mode === "signup" ? (
                <>
                  Already a member?{" "}
                  <Link to="/auth" search={{ mode: "signin" }} className="font-semibold text-primary hover:text-foreground transition">
                    Sign in
                  </Link>
                </>
              ) : (
                <>
                  New to CoFund?{" "}
                  <Link to="/auth" search={{ mode: "signup" }} className="font-semibold text-primary hover:text-foreground transition">
                    Create an account
                  </Link>
                </>
              )}
            </div>

            <motion.p
              variants={fadeUp}
              transition={{ duration: 0.4, ease: EASE }}
              className="mt-8 text-center text-[11px] text-muted-foreground/60"
            >
              By continuing, you agree to our{" "}
              <Link to="/terms" className="underline underline-offset-2 hover:text-muted-foreground">Terms</Link>{" "}
              and{" "}
              <Link to="/privacy" className="underline underline-offset-2 hover:text-muted-foreground">Privacy Policy</Link>.
              Investing involves risk.
            </motion.p>
          </motion.div>
        </div>
      </div>
    </div>
    </Suspense>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  placeholder,
  required,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        placeholder={placeholder}
        className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none transition placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/15"
      />
    </label>
  );
}
