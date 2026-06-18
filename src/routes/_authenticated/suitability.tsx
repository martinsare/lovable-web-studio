import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, ShieldCheck, ChevronRight } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  assessSuitability,
  suitabilityQuestions,
  type SuitabilityAnswerSet,
} from "@/lib/suitability";

export const Route = createFileRoute("/_authenticated/suitability")({
  head: () => ({ meta: [{ title: "Investor Suitability · CoFund" }] }),
  component: SuitabilityPage,
});

const STEPS = [
  { id: "background", label: "Background" },
  { id: "financial", label: "Financial profile" },
  { id: "risk", label: "Risk tolerance" },
  { id: "declarations", label: "Declarations" },
];

function SuitabilityPage() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<SuitabilityAnswerSet>({
    jurisdiction: profile?.country ?? "Nigeria",
    experienceLevel: "",
    annualIncomeRange: "",
    netWorthRange: "",
    lossCapacity: "",
    liquidityNeeds: "",
    investmentHorizon: "",
    riskTolerance: "",
    understandsPrivateMarketRisk: false,
    canBearTotalLoss: false,
  });

  const result = useMemo(() => assessSuitability(answers), [answers]);

  const { data: latestAssessment } = useQuery({
    enabled: !!user?.id,
    queryKey: ["suitability", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("investor_suitability_assessments")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const saveAssessment = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("You must be signed in.");
      const { error } = await (supabase as any)
        .from("investor_suitability_assessments")
        .insert({
          user_id: user.id,
          jurisdiction: answers.jurisdiction,
          experience_level: answers.experienceLevel,
          annual_income_range: answers.annualIncomeRange,
          net_worth_range: answers.netWorthRange,
          loss_capacity: answers.lossCapacity,
          liquidity_needs: answers.liquidityNeeds,
          investment_horizon: answers.investmentHorizon,
          risk_tolerance: answers.riskTolerance,
          answers,
          score: result.score,
          outcome: result.outcome,
          notes: result.reasons.join(" "),
        });
      if (error) throw error;

      const existingMetadata =
        profile?.metadata && typeof profile.metadata === "object" && !Array.isArray(profile.metadata)
          ? { ...(profile.metadata as Record<string, unknown>) }
          : {};
      const compliance =
        existingMetadata.compliance &&
        typeof existingMetadata.compliance === "object" &&
        !Array.isArray(existingMetadata.compliance)
          ? { ...(existingMetadata.compliance as Record<string, unknown>) }
          : {};
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          metadata: {
            ...existingMetadata,
            compliance: {
              ...compliance,
              suitability: { outcome: result.outcome, score: result.score, assessedAt: new Date().toISOString(), answers },
            },
          },
        })
        .eq("id", user.id);
      if (profileError) throw profileError;
    },
    onSuccess: async () => {
      toast.success("Assessment saved.");
      await queryClient.invalidateQueries({ queryKey: ["suitability", user?.id] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Unable to save the assessment."),
  });

  function patch(update: Partial<SuitabilityAnswerSet>) {
    setAnswers((prev) => ({ ...prev, ...update }));
  }

  const scoreColor =
    result.outcome === "passed"
      ? "text-brand-green"
      : result.outcome === "needs_review"
        ? "text-amber-400"
        : "text-destructive";

  const scoreBg =
    result.outcome === "passed"
      ? "bg-brand-green/10"
      : result.outcome === "needs_review"
        ? "bg-amber-400/10"
        : "bg-destructive/10";

  return (
    <PageShell
      eyebrow="Investor Controls"
      title="Suitability Assessment"
      description="Private-market investing stays behind a real suitability screen. This records your experience, loss capacity, time horizon, and risk tolerance before capital moves."
    >
      <div className="max-w-4xl">

          {/* Previous assessment banner */}
          {latestAssessment && (
            <div className="mb-6 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-green" />
              <p className="text-sm">
                <span className="font-semibold">Last assessment: </span>
                <span className="text-muted-foreground capitalize">{String(latestAssessment.outcome).replaceAll("_", " ")} · score {latestAssessment.score} · {new Date(latestAssessment.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
              </p>
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
            {/* Assessment form */}
            <div>
              {/* Step progress */}
              <div className="mb-8 flex items-center gap-0">
                {STEPS.map((s, i) => (
                  <div key={s.id} className="flex items-center flex-1 last:flex-none">
                    <button
                      type="button"
                      onClick={() => setStep(i)}
                      className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold transition ${
                        i < step
                          ? "bg-brand-green text-primary-foreground"
                          : i === step
                            ? "gradient-brand text-primary-foreground shadow-brand"
                            : "bg-secondary text-muted-foreground"
                      }`}
                    >
                      {i < step ? <CheckCircle2 className="h-3.5 w-3.5" /> : i + 1}
                    </button>
                    {i < STEPS.length - 1 && (
                      <div className={`flex-1 h-px mx-2 ${i < step ? "bg-brand-green" : "bg-border"}`} />
                    )}
                  </div>
                ))}
              </div>
              <p className="mb-6 text-sm font-bold text-foreground">{STEPS[step].label}</p>

              {step === 0 && (
                <div className="space-y-5">
                  <FieldGroup label="Country / jurisdiction">
                    <select value={answers.jurisdiction} onChange={(e) => patch({ jurisdiction: e.target.value })} className={sel}>
                      {["Nigeria", "United Kingdom", "United States", "Other"].map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </FieldGroup>
                  <FieldGroup label="Investment experience">
                    <select value={answers.experienceLevel} onChange={(e) => patch({ experienceLevel: e.target.value })} className={sel}>
                      <option value="">Select…</option>
                      {suitabilityQuestions.experienceLevels.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </FieldGroup>
                  <FieldGroup label="Investment horizon">
                    <select value={answers.investmentHorizon} onChange={(e) => patch({ investmentHorizon: e.target.value })} className={sel}>
                      <option value="">Select…</option>
                      {suitabilityQuestions.investmentHorizons.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </FieldGroup>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-5">
                  <FieldGroup label="Annual income range" hint="Used to assess investment size relative to income.">
                    <input
                      value={answers.annualIncomeRange}
                      onChange={(e) => patch({ annualIncomeRange: e.target.value })}
                      placeholder="e.g. ₦5,000,000 – ₦10,000,000"
                      className={inp}
                    />
                  </FieldGroup>
                  <FieldGroup label="Net worth range" hint="Approximate total assets minus liabilities.">
                    <input
                      value={answers.netWorthRange}
                      onChange={(e) => patch({ netWorthRange: e.target.value })}
                      placeholder="e.g. ₦25,000,000+"
                      className={inp}
                    />
                  </FieldGroup>
                  <FieldGroup label="Liquidity needs">
                    <select value={answers.liquidityNeeds} onChange={(e) => patch({ liquidityNeeds: e.target.value })} className={sel}>
                      <option value="">Select…</option>
                      {suitabilityQuestions.liquidityNeeds.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </FieldGroup>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <FieldGroup label="Risk tolerance">
                    <select value={answers.riskTolerance} onChange={(e) => patch({ riskTolerance: e.target.value })} className={sel}>
                      <option value="">Select…</option>
                      {suitabilityQuestions.riskTolerance.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </FieldGroup>
                  <FieldGroup label="Loss capacity">
                    <select value={answers.lossCapacity} onChange={(e) => patch({ lossCapacity: e.target.value })} className={sel}>
                      <option value="">Select…</option>
                      {suitabilityQuestions.lossCapacity.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </FieldGroup>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Please confirm you have read and understood the following before proceeding.
                  </p>
                  {[
                    {
                      key: "understandsPrivateMarketRisk" as const,
                      label: "I understand that private-market investments are illiquid, high risk, and not covered by any deposit protection scheme.",
                    },
                    {
                      key: "canBearTotalLoss" as const,
                      label: "I can bear a total loss of the capital I invest without causing significant financial hardship.",
                    },
                  ].map(({ key, label }) => (
                    <label
                      key={key}
                      className={`flex items-start gap-4 rounded-xl border px-5 py-4 cursor-pointer transition-colors ${
                        answers[key] ? "border-brand-green/30 bg-brand-green/5" : "border-border bg-card"
                      }`}
                    >
                      <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition ${
                        answers[key] ? "border-brand-green bg-brand-green" : "border-border"
                      }`}>
                        {answers[key] && <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />}
                      </div>
                      <input
                        type="checkbox"
                        checked={answers[key]}
                        onChange={(e) => patch({ [key]: e.target.checked })}
                        className="sr-only"
                      />
                      <p className="text-sm leading-relaxed">{label}</p>
                    </label>
                  ))}

                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={() => void saveAssessment.mutateAsync()}
                      disabled={saveAssessment.isPending || !answers.understandsPrivateMarketRisk || !answers.canBearTotalLoss}
                      className="w-full gradient-brand rounded-xl py-3.5 text-sm font-bold text-primary-foreground shadow-brand disabled:opacity-40"
                    >
                      {saveAssessment.isPending ? "Saving assessment…" : "Submit & save assessment"}
                    </button>
                  </div>
                </div>
              )}

              {/* Step nav */}
              <div className="mt-8 flex justify-between">
                {step > 0 ? (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s - 1)}
                    className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition"
                  >
                    Back
                  </button>
                ) : <div />}
                {step < STEPS.length - 1 && (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s + 1)}
                    className="flex items-center gap-1.5 gradient-brand rounded-xl px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-brand"
                  >
                    Continue <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Live result panel */}
            <div className="space-y-5">
              <div className={`rounded-2xl border ${scoreBg} p-6`}>
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck className={`h-5 w-5 ${scoreColor}`} />
                  <p className="text-sm font-bold">Live assessment</p>
                </div>
                <p className={`font-display text-6xl font-bold ${scoreColor}`}>{result.score}</p>
                <p className={`mt-1 text-sm font-bold capitalize ${scoreColor}`}>
                  {result.outcome.replaceAll("_", " ")}
                </p>
                {result.reasons.length > 0 ? (
                  <div className="mt-4 space-y-1.5">
                    {result.reasons.map((r) => (
                      <div key={r} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">No concerns flagged by current answers.</p>
                )}
              </div>

              <div className="rounded-2xl border border-amber-400/20 bg-amber-400/5 p-5">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    High-risk or ambiguous answers trigger manual compliance review. This creates a real suitability record beyond a simple checkbox.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
    </PageShell>
  );
}

function FieldGroup({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold">{label}</span>
      {hint && <p className="mb-2 text-xs text-muted-foreground">{hint}</p>}
      {children}
    </label>
  );
}

const sel = "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary appearance-none";
const inp = "w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary placeholder:text-muted-foreground/50";
