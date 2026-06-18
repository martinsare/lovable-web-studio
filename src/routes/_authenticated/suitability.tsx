import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, ShieldCheck } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { assessSuitability, suitabilityQuestions, type SuitabilityAnswerSet } from "@/lib/suitability";

export const Route = createFileRoute("/_authenticated/suitability")({
  head: () => ({ meta: [{ title: "Investor Suitability - CoFund" }] }),
  component: SuitabilityPage,
});

function SuitabilityPage() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
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
      const { error } = await (supabase as any).from("investor_suitability_assessments").insert({
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
        existingMetadata.compliance && typeof existingMetadata.compliance === "object" && !Array.isArray(existingMetadata.compliance)
          ? { ...(existingMetadata.compliance as Record<string, unknown>) }
          : {};

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          metadata: {
            ...existingMetadata,
            compliance: {
              ...compliance,
              suitability: {
                outcome: result.outcome,
                score: result.score,
                assessedAt: new Date().toISOString(),
                answers,
              },
            },
          },
        })
        .eq("id", user.id);

      if (profileError) throw profileError;
    },
    onSuccess: async () => {
      toast.success("Suitability assessment saved.");
      await queryClient.invalidateQueries({ queryKey: ["suitability", user?.id] });
    },
    onError: (error: any) => {
      toast.error(error?.message ?? "Unable to save the assessment.");
    },
  });

  return (
    <PageShell
      eyebrow="Investor controls"
      title="Appropriateness and Suitability"
      description="Private-market investing should stay behind a real suitability screen. This assessment records experience, loss capacity, time horizon, and risk tolerance before capital moves."
    >
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-3xl border border-border bg-card p-6">
          <div className="grid gap-5">
            <SelectRow label="Jurisdiction" value={answers.jurisdiction} onChange={(value) => setAnswers((current) => ({ ...current, jurisdiction: value }))} options={["Nigeria", "United Kingdom", "United States", "Other"]} />
            <SelectRow label="Investment experience" value={answers.experienceLevel} onChange={(value) => setAnswers((current) => ({ ...current, experienceLevel: value }))} options={suitabilityQuestions.experienceLevels.map((item) => ({ value: item.value, label: item.label }))} />
            <SelectRow label="Loss capacity" value={answers.lossCapacity} onChange={(value) => setAnswers((current) => ({ ...current, lossCapacity: value }))} options={suitabilityQuestions.lossCapacity.map((item) => ({ value: item.value, label: item.label }))} />
            <SelectRow label="Liquidity needs" value={answers.liquidityNeeds} onChange={(value) => setAnswers((current) => ({ ...current, liquidityNeeds: value }))} options={suitabilityQuestions.liquidityNeeds.map((item) => ({ value: item.value, label: item.label }))} />
            <SelectRow label="Investment horizon" value={answers.investmentHorizon} onChange={(value) => setAnswers((current) => ({ ...current, investmentHorizon: value }))} options={suitabilityQuestions.investmentHorizons.map((item) => ({ value: item.value, label: item.label }))} />
            <SelectRow label="Risk tolerance" value={answers.riskTolerance} onChange={(value) => setAnswers((current) => ({ ...current, riskTolerance: value }))} options={suitabilityQuestions.riskTolerance.map((item) => ({ value: item.value, label: item.label }))} />
            <InputRow label="Annual income range" value={answers.annualIncomeRange} onChange={(value) => setAnswers((current) => ({ ...current, annualIncomeRange: value }))} placeholder="e.g. $50,000 - $100,000" />
            <InputRow label="Net worth range" value={answers.netWorthRange} onChange={(value) => setAnswers((current) => ({ ...current, netWorthRange: value }))} placeholder="e.g. $250,000 - $500,000" />
            <CheckRow label="I understand private-business investments are illiquid and high risk." checked={answers.understandsPrivateMarketRisk} onChange={(checked) => setAnswers((current) => ({ ...current, understandsPrivateMarketRisk: checked }))} />
            <CheckRow label="I can bear a total loss of this capital without immediate hardship." checked={answers.canBearTotalLoss} onChange={(checked) => setAnswers((current) => ({ ...current, canBearTotalLoss: checked }))} />
            <button
              type="button"
              onClick={() => void saveAssessment.mutateAsync()}
              disabled={saveAssessment.isPending}
              className="gradient-brand rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-brand disabled:opacity-50"
            >
              {saveAssessment.isPending ? "Saving assessment..." : "Save assessment"}
            </button>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h2 className="font-display text-xl font-bold">Assessment result</h2>
            </div>
            <p className="mt-4 font-display text-5xl font-bold">{result.score}</p>
            <StatusBadge outcome={result.outcome} />
            <div className="mt-4 grid gap-2">
              {result.reasons.length === 0 ? (
                <p className="text-sm text-muted-foreground">No immediate concerns flagged by the current answers.</p>
              ) : (
                result.reasons.map((reason) => (
                  <p key={reason} className="text-sm text-muted-foreground">
                    - {reason}
                  </p>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6">
            <h2 className="font-display text-xl font-bold">Latest recorded assessment</h2>
            {!latestAssessment ? (
              <p className="mt-3 text-sm text-muted-foreground">No suitability assessment has been recorded yet.</p>
            ) : (
              <div className="mt-4 grid gap-3">
                <Summary label="Outcome" value={String(latestAssessment.outcome).replaceAll("_", " ")} />
                <Summary label="Score" value={String(latestAssessment.score)} />
                <Summary label="Jurisdiction" value={latestAssessment.jurisdiction} />
                <Summary label="Created" value={new Date(latestAssessment.created_at).toLocaleString()} />
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-400" />
              <p className="text-sm text-muted-foreground">
                High-risk or ambiguous answers should flow into manual review. This screen gives CoFund a real suitability record instead of relying only on accreditation checkboxes.
              </p>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}

function SelectRow({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<string | { value: string; label: string }>;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={inputCls}>
        <option value="">Select...</option>
        {options.map((option) => {
          if (typeof option === "string") {
            return (
              <option key={option} value={option}>
                {option}
              </option>
            );
          }
          return (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          );
        })}
      </select>
    </label>
  );
}

function InputRow({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (value: string) => void; placeholder: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className={inputCls} />
    </label>
  );
}

function CheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-start gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-1" />
      <span>{label}</span>
    </label>
  );
}

function StatusBadge({ outcome }: { outcome: string }) {
  const style =
    outcome === "passed"
      ? "bg-brand-green/10 text-brand-green"
      : outcome === "needs_review"
        ? "bg-amber-500/10 text-amber-400"
        : "bg-destructive/10 text-destructive";
  const Icon = outcome === "passed" ? CheckCircle2 : AlertTriangle;
  return (
    <span className={`mt-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold ${style}`}>
      <Icon className="h-4 w-4" /> {outcome.replaceAll("_", " ")}
    </span>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

const inputCls = "w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary";
