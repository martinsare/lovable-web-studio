                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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
import { PageShell } from "@/components/page-shell";
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
  const openAmount = Number(opportunity?.goal_amount ?? 0) - Number(opportunity?.raised_amount ?? 0);

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
      toast.success(`${getRailLabel(data.rail)} instructions created`);
      void queryClient.invalidateQueries({ queryKey: ["portfolio", "commitments"] });
      void queryClient.invalidateQueries({ queryKey: ["checkout", "wallet", user?.id] });
    },
    onError: (error: any) => {
      toast.error(error?.message ?? "We couldn't create that commitment.");
    },
  });

  if (isLoading) {
    return (
      <PageShell eyebrow="Invest" title="Investment Checkout" description="Preparing the investment room for this opportunity.">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="h-80 animate-pulse rounded-3xl bg-card" />
          <div className="h-80 animate-pulse rounded-3xl bg-card" />
        </div>
      </PageShell>
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
    (!walletTooLow) &&
    (investingAs === "individual" || Boolean(businessEntityId));

  return (
    <PageShell
      eyebrow="Invest"
      title="Investment Checkout"
      description="Commit capital, choose a funding rail, and move funds into escrow with the right references."
      actions={
        <div className="hidden gap-2 sm:flex">
          <Link to="/offerings/$opportunityId" params={{ opportunityId }} className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground">
            Offering room
          </Link>
          <Link to="/browse" className="rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to browse
          </Link>
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-3xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-primary">Opportunity</p>
              <h2 className="mt-2 font-display text-2xl font-bold">{opportunity.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {opportunity.businesses?.name} {opportunity.businesses?.industry ? `- ${opportunity.businesses.industry}` : ""}
              </p>
            </div>
            {opportunity.businesses?.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-brand-green/10 px-3 py-1 text-xs font-semibold text-brand-green">
                <BadgeCheck className="h-3.5 w-3.5" /> Verified business
              </span>
            )}
          </div>

          {opportunity.summary && (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{opportunity.summary}</p>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <MetricCard label="Goal" value={formatMoney(Number(opportunity.goal_amount ?? 0))} />
            <MetricCard label="Raised" value={formatMoney(Number(opportunity.raised_amount ?? 0))} />
            <MetricCard label="Still open" value={formatMoney(Math.max(openAmount, 0))} />
          </div>

          {!readiness.canInvestNow && (
            <div className="mt-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-400" />
                <div>
                  <p className="text-sm font-semibold text-amber-100">Funding is still locked on this account.</p>
                  <div className="mt-2 grid gap-2">
                    {readiness.checklist
                      .filter((item) => !item.done)
                      .map((item) => (
                        <p key={item.label} className="text-xs text-amber-50/80">
                          Pending: {item.label}
                        </p>
                      ))}
                  </div>
                  <Link to="/portfolio" className="mt-3 inline-flex text-sm font-semibold text-white underline underline-offset-4">
                    Review funding readiness
                  </Link>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Link to="/suitability" className="rounded-xl border border-white/20 px-3 py-2 text-xs font-semibold text-white/90">
                      Suitability
                    </Link>
                    <Link to="/security" className="rounded-xl border border-white/20 px-3 py-2 text-xs font-semibold text-white/90">
                      Security
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 grid gap-6">
            <div>
              <p className="text-sm font-semibold">1. Choose who is investing</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <ChoiceCard
                  active={investingAs === "individual"}
                  title="Individual investor"
                  description="Use your approved personal KYC profile."
                  onClick={() => {
                    setInvestingAs("individual");
                    setBusinessEntityId("");
                  }}
                />
                <ChoiceCard
                  active={investingAs === "business_entity"}
                  disabled={!businessEntityOptions.length}
                  title="Business entity"
                  description={businessEntityOptions.length ? "Invest through an approved company or SPV." : "No approved entity available yet."}
                  onClick={() => setInvestingAs("business_entity")}
                />
              </div>
              {investingAs === "business_entity" && (
                <select
                  value={businessEntityId}
                  onChange={(event) => setBusinessEntityId(event.target.value)}
                  className="mt-3 w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                >
                  <option value="">Select an approved entity</option>
                  {businessEntityOptions.map((entity) => (
                    <option key={entity.id} value={entity.id}>
                      {entity.legal_name} - {entity.registration_number}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <p className="text-sm font-semibold">2. Set your commitment amount</p>
              <label className="mt-3 block">
                <span className="mb-2 block text-xs uppercase tracking-widest text-muted-foreground">Amount in NGN</span>
                <input
                  type="number"
                  min="50000"
                  step="1000"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  className="w-full rounded-2xl border border-border bg-background px-4 py-3 text-base font-semibold outline-none focus:border-primary"
                />
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {[100000, 250000, 500000, 1000000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setAmount(String(preset))}
                    className="rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
                  >
                    {formatMoney(preset)}
                  </button>
                ))}
              </div>
              {amountNumber > openAmount && (
                <p className="mt-2 text-sm text-destructive">This amount is higher than the remaining open allocation.</p>
              )}
            </div>

            <div>
              <p className="text-sm font-semibold">3. Pick a funding rail</p>
              <div className="mt-3 grid gap-3">
                {checkoutRails.map((item) => {
                  const readinessRail = derivedRails.find((railItem) => railItem.id === item.id);
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
                      className={`rounded-2xl border p-4 text-left transition ${
                        rail === item.id
                          ? "border-primary bg-primary/5"
                          : "border-border bg-background hover:border-primary/30"
                      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold">{item.label}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                          <p className="mt-2 text-xs text-muted-foreground">{item.note}</p>
                        </div>
                        <RailIcon rail={item.id} />
                      </div>
                    </button>
                  );
                })}
              </div>
              {rail === "wallet_balance" && (
                <p className="mt-3 text-sm text-muted-foreground">
                  Available wallet balance: <span className="font-semibold text-foreground">{formatMoney(walletBalance)}</span>
                </p>
              )}
              {walletTooLow && (
                <p className="mt-2 text-sm text-destructive">Your wallet does not have enough available balance for this commitment.</p>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-background p-4">
              <label className="flex items-start gap-3 text-sm">
                <input type="checkbox" checked={acceptRisk} onChange={(event) => setAcceptRisk(event.target.checked)} className="mt-1" />
                <span>I understand private investments are illiquid, can lose value, and remain subject to compliance review and offering-specific risk disclosures.</span>
              </label>
              <label className="mt-3 flex items-start gap-3 text-sm">
                <input type="checkbox" checked={acceptTerms} onChange={(event) => setAcceptTerms(event.target.checked)} className="mt-1" />
                <span>I accept the instrument summary, escrow process, and payment reconciliation rules for this commitment.</span>
              </label>
            </div>

            <button
              type="button"
              disabled={!canSubmit || createCommitment.isPending}
              onClick={() => void createCommitment.mutateAsync()}
              className="gradient-brand rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-brand transition disabled:cursor-not-allowed disabled:opacity-50"
            >
              {createCommitment.isPending ? "Creating commitment..." : `Create ${selectedRail?.label ?? "funding"} instructions`}
            </button>
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h3 className="font-display text-xl font-bold">Checkout summary</h3>
            </div>
            <div className="mt-5 grid gap-3 text-sm">
              <SummaryRow label="Investor" value={investingAs === "individual" ? "Individual" : "Business entity"} />
              <SummaryRow label="Amount" value={formatMoney(amountNumber || 0)} />
              <SummaryRow label="Funding rail" value={selectedRail?.label ?? "-"} />
              <SummaryRow label="Wallet available" value={formatMoney(walletBalance)} />
              <SummaryRow label="Escrow model" value="Funds move into escrow, not directly to the business." />
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6">
            <p className="text-sm font-semibold">What happens next</p>
            <div className="mt-4 grid gap-3">
              {[
                "Create the commitment and generate a unique reference code.",
                "Fund it using transfer, wire, or wallet balance.",
                "Operations reconcile the payment and mark it in escrow.",
                "The round later closes, releases, or refunds based on the deal terms.",
              ].map((item, index) => (
                <div key={item} className="flex gap-3 rounded-2xl border border-border bg-background p-3">
                  <div className="gradient-brand flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white">
                    {index + 1}
                  </div>
                  <p className="text-sm text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>

          {result && (
            <div className="rounded-3xl border border-brand-green/30 bg-brand-green/5 p-6">
              <div className="flex items-center gap-2 text-brand-green">
                <CheckCircle2 className="h-5 w-5" />
                <p className="font-semibold">Commitment created</p>
              </div>
              <div className="mt-4 grid gap-3 text-sm">
                <SummaryRow label="Commitment ID" value={result.commitment_id} />
                <SummaryRow label="Reference code" value={result.reference_code} />
                <SummaryRow label="Status" value={result.status.replaceAll("_", " ")} />
                <SummaryRow label="Rail" value={getRailLabel(result.rail)} />
              </div>
              <InstructionPanel instructions={result.instructions} rail={result.rail} />
              <Link to="/portfolio" className="mt-4 inline-flex text-sm font-semibold text-brand-green underline underline-offset-4">
                View this in Portfolio
              </Link>
            </div>
          )}
        </section>
      </div>
    </PageShell>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-xl font-bold">{value}</p>
    </div>
  );
}

function ChoiceCard({
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
      className={`rounded-2xl border p-4 text-left transition ${
        active ? "border-primary bg-primary/5" : "border-border bg-background hover:border-primary/30"
      } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </button>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 py-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}

function RailIcon({ rail }: { rail: CheckoutRail }) {
  if (rail === "bank_transfer") return <Landmark className="h-5 w-5 text-primary" />;
  if (rail === "wire") return <RadioTower className="h-5 w-5 text-primary" />;
  return <Wallet className="h-5 w-5 text-primary" />;
}

function InstructionPanel({ instructions, rail }: { instructions: Record<string, any> | null; rail: CheckoutRail }) {
  if (!instructions) return null;

  return (
    <div className="mt-5 rounded-2xl border border-brand-green/20 bg-background p-4 text-sm">
      <p className="font-semibold">Funding instructions</p>
      {rail === "bank_transfer" && (
        <div className="mt-3 grid gap-2">
          <SummaryRow label="Account name" value={instructions.account_name ?? "-"} />
          <SummaryRow label="Bank" value={instructions.bank_name ?? "-"} />
          <SummaryRow label="Account number" value={instructions.account_number ?? "-"} />
          <SummaryRow label="Reference" value={instructions.reference_code ?? "-"} />
        </div>
      )}
      {rail === "wire" && (
        <div className="mt-3 grid gap-2">
          <SummaryRow label="Beneficiary" value={instructions.beneficiary_name ?? "-"} />
          <SummaryRow label="Bank" value={instructions.bank_name ?? "-"} />
          <SummaryRow label="SWIFT" value={instructions.swift_code ?? "-"} />
          <SummaryRow label="IBAN" value={instructions.iban ?? "-"} />
          <SummaryRow label="Reference" value={instructions.reference_code ?? "-"} />
        </div>
      )}
      {rail === "wallet_balance" && (
        <div className="mt-3 grid gap-2">
          <SummaryRow label="Wallet hold" value={formatMoney(Number(instructions.wallet_hold_amount ?? 0))} />
          <SummaryRow label="Reference" value={instructions.reference_code ?? "-"} />
          <SummaryRow label="Settlement status" value={instructions.status ?? "-"} />
        </div>
      )}
      {Array.isArray(instructions.metadata?.steps) && (
        <div className="mt-4 grid gap-2">
          {instructions.metadata.steps.map((step: string) => (
            <p key={step} className="text-muted-foreground">
              - {step}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
