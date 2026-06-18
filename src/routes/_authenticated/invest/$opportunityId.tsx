import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Building2,
  CheckCircle2,
  Landmark,
  RadioTower,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useSecurity } from "@/hooks/use-security";
import { buildInvestmentReadiness } from "@/lib/investment-readiness";
import { checkoutRails, formatMoney, getRailLabel, type CheckoutRail } from "@/lib/investment-checkout";

export const Route = createFileRoute("/_authenticated/invest/$opportunityId")({
  head: () => ({ meta: [{ title: "Investment Checkout - CoFund" }] }),
  component: InvestmentCheckoutPage,
});

type CheckoutResponse = {
  commitment_id: string;
  status: string;
  reference_code: string;
  rail: CheckoutRail;
  instructions: Record<string, any> | null;
};

function InvestmentCheckoutPage() {
  const { opportunityId } = Route.useParams();
  const { user, profile, roles } = useAuth();
  const { security } = useSecurity();
  const readiness = buildInvestmentReadiness({ profile, roles, security });
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState("250000");
  const [rail, setRail] = useState<CheckoutRail>("bank_transfer");
  const [investingAs, setInvestingAs] = useState<"individual" | "business_entity">("individual");
  const [businessEntityId, setBusinessEntityId] = useState<string>("");
  const [acceptRisk, setAcceptRisk] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [result, setResult] = useState<CheckoutResponse | null>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; title: string; message: string } | null>(null);

  const { data: opportunity, isLoading } = useQuery({
    queryKey: ["checkout", "opportunity", opportunityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunities")
        .select("id,title,summary,goal_amount,raised_amount,target_return_pct,status,closes_at,businesses(id,name,industry,verified)")
        .eq("id", opportunityId)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data as any;
    },
  });

  const { data: wallet } = useQuery({
    enabled: !!user?.id,
    queryKey: ["checkout", "wallet", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("investor_wallets")
        .select("id,currency,ledger_balance,available_balance,status")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const { data: entities } = useQuery({
    enabled: !!user?.id && roles.includes("business_owner"),
    queryKey: ["checkout", "entities", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("business_entities")
        .select("id,legal_name,registration_number,verification_status")
        .eq("owner_user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const amountNumber = Number(amount || 0);
  const selectedRail = checkoutRails.find((item) => item.id === rail);
  const walletBalance = Number(wallet?.available_balance ?? 0);
  const goalAmount = Number(opportunity?.goal_amount ?? 0);
  const raisedAmount = Number(opportunity?.raised_amount ?? 0);
  const openAmount = goalAmount - raisedAmount;
  const progressPct = goalAmount > 0 ? Math.min(100, Math.round((raisedAmount / goalAmount) * 100)) : 0;

  const derivedRails = useMemo(() => {
    return readiness.fundingRails.filter((item) =>
      item.id === "bank_transfer" || item.id === "wire" || item.id === "wallet_balance",
    );
  }, [readiness.fundingRails]);

  const createCommitment = useMutation({
    mutationFn: async () => {
      const payload = {
        p_opportunity_id: opportunityId,
        p_business_entity_id: investingAs === "business_entity" && businessEntityId ? businessEntityId : null,
        p_investing_as: investingAs,
        p_amount: amountNumber,
        p_rail: rail,
        p_instrument_label: opportunity?.title ?? null,
        p_disclosures_accepted: acceptTerms,
        p_risk_acknowledged: acceptRisk,
      };
      const { data, error } = await (supabase as any).rpc("create_investment_commitment", payload);
      if (error) throw error;
      return (Array.isArray(data) ? data[0] : data) as CheckoutResponse;
    },
    onSuccess: (data) => {
      setResult(data);
      setNotice({ tone: "success", title: "Instructions created", message: `${getRailLabel(data.rail)} instructions created.` });
      void queryClient.invalidateQueries({ queryKey: ["portfolio", "commitments"] });
      void queryClient.invalidateQueries({ queryKey: ["checkout", "wallet", user?.id] });
    },
    onError: (error: any) => {
      setNotice({ tone: "error", title: "Could not create commitment", message: error?.message ?? "We couldn't create that commitment." });
    },
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-full bg-background">
          <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
              <div className="h-[600px] animate-pulse rounded-3xl bg-card" />
              <div className="h-80 animate-pulse rounded-3xl bg-card" />
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!opportunity) return null;

  const walletTooLow = rail === "wallet_balance" && walletBalance < amountNumber;
  const businessEntityOptions = (entities ?? []).filter((entity) => entity.verification_status === "approved");
  const canSubmit =
    readiness.canInvestNow &&
    amountNumber > 0 &&
    amountNumber <= openAmount &&
    acceptRisk &&
    acceptTerms &&
    !walletTooLow &&
    (investingAs === "individual" || Boolean(businessEntityId));

  return (
    <AppLayout>
      <div className="min-h-full bg-background pb-16">
        {/* Breadcrumb */}
        <div className="border-b border-border/40 bg-background/80 backdrop-blur-md">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
            <Link
              to="/offerings/$opportunityId"
              params={{ opportunityId }}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Back to offering
            </Link>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-sm font-semibold text-foreground">Investment Checkout</span>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          {notice && (
            <div className="mb-6">
              <Alert variant={notice.tone === "error" ? "destructive" : "default"}>
                <AlertTitle>{notice.title}</AlertTitle>
                <AlertDescription>{notice.message}</AlertDescription>
              </Alert>
            </div>
          )}
          {/* Success state */}
          {result && (
            <SuccessPanel result={result} opportunityId={opportunityId} />
          )}

          {!result && (
            <div className="grid gap-8 lg:grid-cols-[1fr_340px]">
              {/* ── Left: form ── */}
              <div className="space-y-8">
                {/* Opportunity card */}
                <div className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Opportunity</p>
                      <h1 className="mt-1.5 font-display text-2xl font-bold">{opportunity.title}</h1>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" />
                          {opportunity.businesses?.name}
                        </span>
                        {opportunity.businesses?.industry && (
                          <>
                            <span className="text-border">·</span>
                            <span>{opportunity.businesses.industry}</span>
                          </>
                        )}
                      </div>
                    </div>
                    {opportunity.businesses?.verified && (
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-green/10 px-3 py-1.5 text-xs font-bold text-brand-green">
                        <BadgeCheck className="h-3.5 w-3.5" /> Verified
                      </span>
                    )}
                  </div>

                  {/* Progress */}
                  <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{progressPct}% funded</span>
                      <span className="font-semibold">{formatMoney(raisedAmount)} raised</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-secondary">
                      <div
                        className="h-full rounded-full gradient-brand transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <div className="mt-3 flex gap-6 text-sm">
                      <span><span className="font-bold">{formatMoney(goalAmount)}</span> <span className="text-muted-foreground text-xs">goal</span></span>
                      <span><span className="font-bold text-brand-green">{formatMoney(Math.max(openAmount, 0))}</span> <span className="text-muted-foreground text-xs">still open</span></span>
                      {opportunity.target_return_pct && (
                        <span><span className="font-bold">{opportunity.target_return_pct}%</span> <span className="text-muted-foreground text-xs">target return</span></span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Readiness warning */}
                {!readiness.canInvestNow && (
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/8 px-5 py-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
                      <div>
                        <p className="text-sm font-bold text-amber-300">Your account isn't ready to invest yet</p>
                        <div className="mt-2 space-y-1">
                          {readiness.checklist.filter((item) => !item.done).map((item) => (
                            <p key={item.label} className="text-xs text-amber-200/70">• {item.label}</p>
                          ))}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Link to="/suitability" className="rounded-lg border border-amber-400/30 px-3 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-400/10">
                            Suitability
                          </Link>
                          <Link to="/security" className="rounded-lg border border-amber-400/30 px-3 py-1.5 text-xs font-semibold text-amber-300 transition hover:bg-amber-400/10">
                            Security
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 1 */}
                <StepSection number={1} title="Who is investing?">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <InvestorTypeCard
                      active={investingAs === "individual"}
                      title="Individual"
                      description="Use your approved personal KYC profile."
                      onClick={() => { setInvestingAs("individual"); setBusinessEntityId(""); }}
                    />
                    <InvestorTypeCard
                      active={investingAs === "business_entity"}
                      disabled={!businessEntityOptions.length}
                      title="Business entity"
                      description={businessEntityOptions.length ? "Invest through an approved company or SPV." : "No approved entity on file."}
                      onClick={() => setInvestingAs("business_entity")}
                    />
                  </div>
                  {investingAs === "business_entity" && (
                    <select
                      value={businessEntityId}
                      onChange={(e) => setBusinessEntityId(e.target.value)}
                      className="mt-3 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                    >
                      <option value="">Select an approved entity</option>
                      {businessEntityOptions.map((entity) => (
                        <option key={entity.id} value={entity.id}>
                          {entity.legal_name} · {entity.registration_number}
                        </option>
                      ))}
                    </select>
                  )}
                </StepSection>

                {/* Step 2 */}
                <StepSection number={2} title="Commitment amount">
                  <div className="rounded-xl border border-border bg-background focus-within:border-primary transition-colors">
                    <div className="flex items-center">
                      <span className="pl-5 pr-2 text-lg font-bold text-muted-foreground">₦</span>
                      <input
                        type="number"
                        min="50000"
                        step="1000"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="flex-1 bg-transparent py-4 pr-5 text-xl font-bold outline-none"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {[100000, 250000, 500000, 1000000].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAmount(String(preset))}
                        className={`rounded-full border px-4 py-1.5 text-xs font-bold transition ${
                          amountNumber === preset
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        }`}
                      >
                        {formatMoney(preset)}
                      </button>
                    ))}
                  </div>
                  {amountNumber > openAmount && openAmount > 0 && (
                    <p className="mt-2 text-xs font-semibold text-destructive">
                      Exceeds the remaining open allocation of {formatMoney(openAmount)}.
                    </p>
                  )}
                </StepSection>

                {/* Step 3 */}
                <StepSection number={3} title="Funding rail">
                  <div className="space-y-2.5">
                    {checkoutRails.map((item) => {
                      const readinessRail = derivedRails.find((r) => r.id === item.id);
                      const disabled =
                        !readinessRail ||
                        readinessRail.status === "disabled" ||
                        (item.id === "wallet_balance" && walletBalance <= 0);

                      return (
                        <button
                          key={item.id}
                          type="button"
                          disabled={disabled}
                          onClick={() => setRail(item.id)}
                          className={`w-full rounded-xl border p-4 text-left transition ${
                            rail === item.id
                              ? "border-primary/50 bg-primary/5"
                              : disabled
                                ? "cursor-not-allowed border-border opacity-40"
                                : "border-border bg-background hover:border-primary/30"
                          }`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition ${
                              rail === item.id ? "border-primary" : "border-muted-foreground/30"
                            }`}>
                              {rail === item.id && <div className="h-2.5 w-2.5 rounded-full bg-primary" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <RailIcon rail={item.id} />
                                <p className="text-sm font-bold">{item.label}</p>
                                {item.id === "wallet_balance" && wallet && (
                                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                                    {formatMoney(walletBalance)} available
                                  </span>
                                )}
                              </div>
                              <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
                              {item.note && <p className="mt-0.5 text-[11px] text-muted-foreground/70">{item.note}</p>}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {walletTooLow && (
                    <p className="mt-2 text-xs font-semibold text-destructive">
                      Insufficient wallet balance for this commitment.
                    </p>
                  )}
                </StepSection>

                {/* Step 4: Disclosures */}
                <StepSection number={4} title="Risk disclosures">
                  <div className="space-y-3">
                    <CustomCheckbox
                      checked={acceptRisk}
                      onChange={setAcceptRisk}
                      label="I understand private investments are illiquid, can lose value, and remain subject to compliance review and offering-specific risk disclosures."
                    />
                    <CustomCheckbox
                      checked={acceptTerms}
                      onChange={setAcceptTerms}
                      label="I accept the instrument summary, escrow process, and payment reconciliation rules for this commitment."
                    />
                  </div>
                </StepSection>
              </div>

              {/* ── Right: sticky summary ── */}
              <aside className="space-y-5 lg:sticky lg:top-4 lg:self-start">
                {/* Summary card */}
                <div className="rounded-2xl border border-border bg-card p-6">
                  <div className="flex items-center gap-2 mb-5">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <h2 className="text-sm font-bold">Checkout summary</h2>
                  </div>

                  <div className="divide-y divide-border/60 text-sm">
                    <SummaryLine label="Opportunity" value={opportunity.title} mono={false} />
                    <SummaryLine label="Investor" value={investingAs === "individual" ? "Individual" : "Business entity"} />
                    <SummaryLine label="Amount" value={formatMoney(amountNumber || 0)} highlight />
                    <SummaryLine label="Rail" value={selectedRail?.label ?? "—"} />
                    <SummaryLine label="Wallet balance" value={formatMoney(walletBalance)} />
                  </div>

                  <button
                    type="button"
                    disabled={!canSubmit || createCommitment.isPending}
                    onClick={() => void createCommitment.mutateAsync()}
                    className="mt-6 w-full gradient-brand rounded-xl px-5 py-3.5 text-sm font-bold text-primary-foreground shadow-brand transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {createCommitment.isPending
                      ? "Creating commitment…"
                      : `Confirm ${selectedRail?.label ?? "investment"}`}
                  </button>

                  {!canSubmit && !createCommitment.isPending && (
                    <p className="mt-3 text-center text-xs text-muted-foreground">
                      {!readiness.canInvestNow
                        ? "Complete account readiness to invest."
                        : !acceptRisk || !acceptTerms
                          ? "Accept the disclosures below to continue."
                          : amountNumber <= 0
                            ? "Enter a valid investment amount."
                            : "Review all fields above."}
                    </p>
                  )}
                </div>

                {/* What happens next */}
                <div className="rounded-2xl border border-border bg-card p-6">
                  <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">What happens next</p>
                  <div className="space-y-4">
                    {[
                      "We create your commitment and generate a unique reference code.",
                      "You fund it via bank transfer, wire, or wallet balance.",
                      "Operations reconcile the payment and lock it in escrow.",
                      "The round closes — then releases or refunds per deal terms.",
                    ].map((step, i) => (
                      <div key={step} className="flex gap-3">
                        <div className="gradient-brand flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-primary-foreground">
                          {i + 1}
                        </div>
                        <p className="text-xs leading-relaxed text-muted-foreground pt-0.5">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function StepSection({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-foreground text-[11px] font-bold text-background">
          {number}
        </div>
        <h2 className="text-sm font-bold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

function InvestorTypeCard({
  active,
  disabled,
  title,
  description,
  onClick,
}: {
  active: boolean;
  disabled?: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition ${
        active ? "border-primary/50 bg-primary/5" : "border-border bg-background hover:border-primary/30"
      } ${disabled ? "cursor-not-allowed opacity-40" : ""}`}
    >
      <div className="flex items-center gap-3">
        <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition ${
          active ? "border-primary" : "border-muted-foreground/30"
        }`}>
          {active && <div className="h-2 w-2 rounded-full bg-primary" />}
        </div>
        <div>
          <p className="text-sm font-bold">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
    </button>
  );
}

function CustomCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex w-full items-start gap-4 rounded-xl border p-4 text-left transition ${
        checked ? "border-primary/40 bg-primary/5" : "border-border bg-background hover:border-primary/20"
      }`}
    >
      <div className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition ${
        checked ? "border-primary bg-primary" : "border-muted-foreground/40"
      }`}>
        {checked && (
          <svg viewBox="0 0 12 10" className="h-3 w-3 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="1,5 4,9 11,1" />
          </svg>
        )}
      </div>
      <p className="text-xs leading-relaxed text-muted-foreground">{label}</p>
    </button>
  );
}

function SummaryLine({
  label,
  value,
  highlight,
  mono = true,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className={`text-right text-sm ${highlight ? "font-bold text-foreground" : "font-semibold"} ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function RailIcon({ rail }: { rail: CheckoutRail }) {
  if (rail === "bank_transfer") return <Landmark className="h-4 w-4 text-primary shrink-0" />;
  if (rail === "wire") return <RadioTower className="h-4 w-4 text-primary shrink-0" />;
  return <Wallet className="h-4 w-4 text-primary shrink-0" />;
}

function SuccessPanel({ result, opportunityId }: { result: CheckoutResponse; opportunityId: string }) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="rounded-2xl border border-brand-green/30 bg-brand-green/5 p-8">
        <div className="flex items-center gap-3 text-brand-green">
          <CheckCircle2 className="h-6 w-6" />
          <h2 className="font-display text-xl font-bold">Commitment created</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          Your investment commitment is live. Use the reference code below when making your transfer.
        </p>

        <div className="mt-6 divide-y divide-border/60 rounded-xl border border-brand-green/20 bg-background text-sm">
          {[
            { label: "Commitment ID", value: result.commitment_id },
            { label: "Reference code", value: result.reference_code },
            { label: "Status", value: result.status.replaceAll("_", " ") },
            { label: "Rail", value: getRailLabel(result.rail) },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between gap-4 px-5 py-3.5">
              <span className="text-muted-foreground">{label}</span>
              <span className="font-mono font-bold">{value}</span>
            </div>
          ))}
        </div>

        {result.instructions && (
          <InstructionPanel instructions={result.instructions} rail={result.rail} />
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/portfolio"
            className="gradient-brand inline-flex items-center rounded-xl px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-brand"
          >
            View in Portfolio
          </Link>
          <Link
            to="/offerings/$opportunityId"
            params={{ opportunityId }}
            className="inline-flex items-center rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
          >
            Back to offering
          </Link>
        </div>
      </div>
    </div>
  );
}

function InstructionPanel({ instructions, rail }: { instructions: Record<string, any> | null; rail: CheckoutRail }) {
  if (!instructions) return null;

  const rows: { label: string; value: string }[] = [];
  if (rail === "bank_transfer") {
    rows.push(
      { label: "Account name", value: instructions.account_name ?? "—" },
      { label: "Bank", value: instructions.bank_name ?? "—" },
      { label: "Account number", value: instructions.account_number ?? "—" },
      { label: "Reference", value: instructions.reference_code ?? "—" },
    );
  } else if (rail === "wire") {
    rows.push(
      { label: "Beneficiary", value: instructions.beneficiary_name ?? "—" },
      { label: "Bank", value: instructions.bank_name ?? "—" },
      { label: "SWIFT", value: instructions.swift_code ?? "—" },
      { label: "IBAN", value: instructions.iban ?? "—" },
      { label: "Reference", value: instructions.reference_code ?? "—" },
    );
  } else if (rail === "wallet_balance") {
    rows.push(
      { label: "Wallet hold", value: formatMoney(Number(instructions.wallet_hold_amount ?? 0)) },
      { label: "Reference", value: instructions.reference_code ?? "—" },
      { label: "Settlement status", value: instructions.status ?? "—" },
    );
  }

  return (
    <div className="mt-5">
      <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-brand-green/70">Funding instructions</p>
      <div className="divide-y divide-border/60 rounded-xl border border-brand-green/20 bg-background text-sm">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between gap-4 px-5 py-3.5">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-mono font-bold">{value}</span>
          </div>
        ))}
      </div>
      {Array.isArray(instructions.metadata?.steps) && (
        <div className="mt-4 space-y-1.5">
          {instructions.metadata.steps.map((step: string) => (
            <p key={step} className="text-xs text-muted-foreground">• {step}</p>
          ))}
        </div>
      )}
    </div>
  );
}
