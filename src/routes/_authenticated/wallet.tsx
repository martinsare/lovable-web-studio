import { createFileRoute } from "@tanstack/react-router";
import { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  ChevronRight,
  Clock,
  Copy,
  RefreshCw,
  Wallet,
  X,
  Building2,
} from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney } from "@/lib/investment-checkout";

export const Route = createFileRoute("/_authenticated/wallet")({
  head: () => ({ meta: [{ title: "Wallet · CoFund" }] }),
  component: WalletPage,
});

type LedgerTab = "deposits" | "withdrawals" | "transactions";
type DepositStep = "amount" | "details" | "done";
type WithdrawStep = "form" | "review" | "done";
type Modal = "none" | "deposit" | "withdraw";

const QUICK_AMOUNTS = [25_000, 50_000, 100_000, 250_000, 500_000, 1_000_000];

const NIGERIAN_BANKS = [
  "Access Bank", "Citibank Nigeria", "Ecobank Nigeria", "Fidelity Bank",
  "First Bank of Nigeria", "FCMB", "GTBank", "Heritage Bank",
  "Keystone Bank", "OPay", "PalmPay", "Polaris Bank",
  "Providus Bank", "Stanbic IBTC", "Standard Chartered", "Sterling Bank",
  "UBA", "Union Bank", "Unity Bank", "Wema Bank", "Zenith Bank",
];

function copyText(text: string, label = "Copied") {
  navigator.clipboard.writeText(text).then(() => toast.success(label));
}

function WalletPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<Modal>("none");
  const [ledgerTab, setLedgerTab] = useState<LedgerTab>("transactions");

  // Deposit state
  const [depositStep, setDepositStep] = useState<DepositStep>("amount");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositRef, setDepositRef] = useState("");

  // Withdraw state
  const [withdrawStep, setWithdrawStep] = useState<WithdrawStep>("form");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawBank, setWithdrawBank] = useState("");
  const [withdrawAccNum, setWithdrawAccNum] = useState("");
  const [withdrawAccName, setWithdrawAccName] = useState("");

  function openDeposit() {
    setDepositStep("amount");
    setDepositAmount("");
    setDepositRef("");
    setModal("deposit");
  }

  function openWithdraw() {
    setWithdrawStep("form");
    setWithdrawAmount("");
    setWithdrawBank("");
    setWithdrawAccNum("");
    setWithdrawAccName("");
    setModal("withdraw");
  }

  function closeModal() {
    setModal("none");
  }

  const { data: wallet, isLoading: walletLoading } = useQuery({
    enabled: !!user?.id,
    queryKey: ["wallet", user?.id],
    queryFn: async () => {
      await (supabase as any)
        .from("investor_wallets")
        .upsert({ user_id: user!.id, currency: "NGN" }, { onConflict: "user_id" });
      const { data, error } = await (supabase as any)
        .from("investor_wallets")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const { data: deposits = [] } = useQuery({
    enabled: !!user?.id,
    queryKey: ["wallet", "deposits", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("wallet_deposit_requests")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const { data: withdrawals = [] } = useQuery({
    enabled: !!user?.id,
    queryKey: ["wallet", "withdrawals", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("wallet_withdrawal_requests")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const { data: transactions = [] } = useQuery({
    enabled: !!wallet?.id,
    queryKey: ["wallet", "transactions", wallet?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("wallet_transactions")
        .select("*")
        .eq("wallet_id", wallet!.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const createDeposit = useMutation({
    mutationFn: async (ref: string) => {
      const amount = Number(depositAmount.replace(/,/g, ""));
      const { error } = await (supabase as any).from("wallet_deposit_requests").insert({
        wallet_id: wallet?.id ?? null,
        user_id: user!.id,
        amount,
        rail: "bank_transfer",
        status: "submitted",
        reference_code: ref,
        note: "Investor-initiated wallet top-up via bank transfer.",
        metadata: {
          bank_name: "Settlement Partner Bank",
          account_name: "CoFund Wallet Collections",
          account_number: "2039485761",
        },
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["wallet", "deposits", user?.id] }),
        queryClient.invalidateQueries({ queryKey: ["wallet", user?.id] }),
      ]);
      setDepositStep("done");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not record deposit request."),
  });

  const createWithdrawal = useMutation({
    mutationFn: async () => {
      const amount = Number(withdrawAmount.replace(/,/g, ""));
      const avail = Number(wallet?.available_balance ?? 0);
      if (amount > avail) throw new Error("Amount exceeds available balance.");
      if (!withdrawBank) throw new Error("Select your bank.");
      if (withdrawAccNum.length !== 10) throw new Error("Account number must be 10 digits.");
      if (!withdrawAccName.trim()) throw new Error("Account name is required.");
      const { error } = await (supabase as any).from("wallet_withdrawal_requests").insert({
        wallet_id: wallet?.id ?? null,
        user_id: user!.id,
        amount,
        destination_label: `${withdrawBank} · ${withdrawAccNum}`,
        destination_details: {
          bank_name: withdrawBank,
          account_number: withdrawAccNum,
          account_name: withdrawAccName,
        },
        status: "submitted",
        note: "Investor-initiated withdrawal to registered bank account.",
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["wallet", "withdrawals", user?.id] });
      setWithdrawStep("done");
    },
    onError: (e: any) => toast.error(e?.message ?? "Unable to create withdrawal request."),
  });

  function generateRef(): string {
    return `CFW-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  }

  function handleDepositContinue() {
    const amount = Number(depositAmount.replace(/,/g, ""));
    if (!amount || amount < 1000) { toast.error("Minimum deposit is ₦1,000."); return; }
    const ref = generateRef();
    setDepositRef(ref);
    setDepositStep("details");
  }

  function handleDepositDone() {
    void createDeposit.mutateAsync(depositRef);
  }

  const available = Number(wallet?.available_balance ?? 0);
  const ledger = Number(wallet?.ledger_balance ?? 0);
  const pending = Math.max(0, ledger - available);

  const ledgerData: Record<LedgerTab, any[]> = { deposits, withdrawals, transactions };

  return (
    <AppLayout>
      <div className="min-h-full bg-background">
        <div className="mx-auto max-w-xl px-4 py-8 sm:px-6">

          {/* Balance card */}
          <div
            className="relative overflow-hidden rounded-3xl p-7 shadow-elevated"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.22 0.07 160) 0%, oklch(0.16 0.05 200) 55%, oklch(0.13 0.09 160) 100%)",
            }}
          >
            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  "radial-gradient(circle, white 1px, transparent 1px)",
                backgroundSize: "28px 28px",
              }}
            />
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-brand-green/10 blur-3xl" />

            <div className="relative">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-white/50" />
                  <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/50">
                    CoFund Wallet
                  </span>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                    wallet?.status === "active"
                      ? "bg-brand-green/20 text-brand-green"
                      : "bg-white/10 text-white/50"
                  }`}
                >
                  {wallet?.status ?? "active"}
                </span>
              </div>

              <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/40 mb-1.5">
                Available balance
              </p>
              <p className="font-display text-5xl font-bold text-white tracking-tight">
                {walletLoading ? "—" : formatMoney(available)}
              </p>

              <div className="mt-6 flex items-center gap-8 border-t border-white/10 pt-5">
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">Ledger</p>
                  <p className="mt-0.5 text-sm font-bold text-white/80">{formatMoney(ledger)}</p>
                </div>
                {pending > 0 && (
                  <div>
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Pending</p>
                    <p className="mt-0.5 text-sm font-bold text-amber-400">{formatMoney(pending)}</p>
                  </div>
                )}
                <div className="ml-auto text-right">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">Currency</p>
                  <p className="mt-0.5 text-sm font-bold text-white/80">NGN</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={openDeposit}
              className="flex items-center justify-center gap-2.5 rounded-2xl bg-primary py-4 text-sm font-bold text-primary-foreground shadow-brand transition hover:opacity-90 active:scale-[0.98]"
            >
              <ArrowDownLeft className="h-5 w-5" />
              Add money
            </button>
            <button
              type="button"
              onClick={openWithdraw}
              className="flex items-center justify-center gap-2.5 rounded-2xl border border-border bg-card py-4 text-sm font-bold text-foreground transition hover:border-primary/30 active:scale-[0.98]"
            >
              <ArrowUpRight className="h-5 w-5" />
              Withdraw
            </button>
          </div>

          {/* Ledger */}
          <div className="mt-8">
            <div className="flex border-b border-border mb-6">
              {(["transactions", "deposits", "withdrawals"] as LedgerTab[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setLedgerTab(key)}
                  className={`flex-1 py-3 text-sm font-semibold border-b-2 -mb-px capitalize transition-colors ${
                    ledgerTab === key
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {key}
                  {ledgerData[key].length > 0 && (
                    <span className="ml-1.5 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-bold">
                      {ledgerData[key].length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {ledgerData[ledgerTab].length === 0 ? (
              <div className="py-16 text-center">
                <Clock className="mx-auto mb-3 h-8 w-8 text-muted-foreground/20" />
                <p className="text-sm font-semibold text-muted-foreground">No {ledgerTab} yet</p>
                <p className="mt-1 text-xs text-muted-foreground/60">
                  {ledgerTab === "deposits"
                    ? "Tap 'Add money' to make your first deposit."
                    : ledgerTab === "withdrawals"
                      ? "Withdraw settled funds to your bank account."
                      : "Your transaction history will appear here."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {ledgerData[ledgerTab].map((item: any) => (
                  <LedgerRow key={item.id} item={item} tab={ledgerTab} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Deposit Modal ── */}
      {modal === "deposit" && (
        <ModalOverlay onClose={closeModal}>
          {depositStep === "amount" && (
            <div>
              <ModalHeader title="Add money" subtitle="How much do you want to deposit?" onClose={closeModal} />
              <div className="p-6 space-y-5">
                {/* Amount input */}
                <div>
                  <div className="flex items-center gap-2 rounded-2xl border border-border bg-secondary/30 px-4 py-4 focus-within:border-primary/60 transition">
                    <span className="font-display text-2xl font-bold text-muted-foreground">₦</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={depositAmount}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, "");
                        setDepositAmount(raw ? Number(raw).toLocaleString() : "");
                      }}
                      placeholder="0"
                      className="flex-1 bg-transparent font-display text-3xl font-bold outline-none placeholder:text-muted-foreground/30"
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">Minimum ₦1,000 · Processed within 1 business day</p>
                </div>

                {/* Quick amounts */}
                <div>
                  <p className="mb-2.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Quick select</p>
                  <div className="grid grid-cols-3 gap-2">
                    {QUICK_AMOUNTS.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setDepositAmount(amt.toLocaleString())}
                        className={`rounded-xl border py-2.5 text-sm font-bold transition ${
                          depositAmount === amt.toLocaleString()
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card text-muted-foreground hover:text-foreground hover:border-primary/30"
                        }`}
                      >
                        {fmtShort(amt)}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleDepositContinue}
                  className="w-full gradient-brand rounded-2xl py-4 text-sm font-bold text-primary-foreground shadow-brand"
                >
                  Continue <ChevronRight className="inline h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {depositStep === "details" && (
            <div>
              <ModalHeader
                title="Make your transfer"
                subtitle="Send exactly this amount to the account below."
                onClose={closeModal}
                onBack={() => setDepositStep("amount")}
              />
              <div className="p-6 space-y-4">
                {/* Amount pill */}
                <div className="flex items-center justify-center py-3 rounded-2xl bg-primary/10">
                  <span className="font-display text-3xl font-bold text-primary">
                    ₦{depositAmount}
                  </span>
                </div>

                {/* Bank receipt */}
                <div className="rounded-2xl border border-border bg-secondary/20 divide-y divide-border overflow-hidden">
                  <ReceiptRow label="Bank" value="Settlement Partner Bank" />
                  <ReceiptRow label="Account name" value="CoFund Wallet Collections" />
                  <ReceiptRow label="Account number" value="2039485761" copyable />
                  <ReceiptRow label="Reference" value={depositRef} copyable highlight />
                </div>

                <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-4 py-3">
                  <p className="text-xs font-bold text-amber-400">⚠ Important</p>
                  <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                    You <strong>must</strong> include the reference code in your transfer narration. Without it, your deposit cannot be matched and credited.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDepositDone}
                  disabled={createDeposit.isPending}
                  className="w-full gradient-brand rounded-2xl py-4 text-sm font-bold text-primary-foreground shadow-brand disabled:opacity-50"
                >
                  {createDeposit.isPending ? "Recording…" : "I've made this transfer ✓"}
                </button>
                <p className="text-center text-xs text-muted-foreground">
                  Your wallet will be credited once ops confirms the transfer — usually within 4 hours.
                </p>
              </div>
            </div>
          )}

          {depositStep === "done" && (
            <div className="p-8 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand-green/10">
                <Check className="h-8 w-8 text-brand-green" />
              </div>
              <p className="font-display text-xl font-bold">Transfer recorded</p>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                Your deposit of <strong>₦{depositAmount}</strong> is pending confirmation. We'll credit your wallet once the transfer is verified — typically within 4 hours.
              </p>
              <p className="mt-3 rounded-xl bg-secondary px-4 py-2 text-xs font-mono text-muted-foreground">
                Ref: {depositRef}
              </p>
              <button
                type="button"
                onClick={closeModal}
                className="mt-6 w-full rounded-2xl border border-border py-3 text-sm font-semibold text-muted-foreground hover:text-foreground transition"
              >
                Close
              </button>
            </div>
          )}
        </ModalOverlay>
      )}

      {/* ── Withdraw Modal ── */}
      {modal === "withdraw" && (
        <ModalOverlay onClose={closeModal}>
          {withdrawStep === "form" && (
            <div>
              <ModalHeader title="Withdraw funds" subtitle="Transfer to your registered bank account." onClose={closeModal} />
              <div className="p-6 space-y-4">
                <div>
                  <label className="block mb-1.5 text-sm font-semibold">Amount (NGN)</label>
                  <div className="flex items-center gap-2 rounded-2xl border border-border bg-secondary/30 px-4 py-3.5 focus-within:border-primary/60 transition">
                    <span className="font-display text-xl font-bold text-muted-foreground">₦</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={withdrawAmount}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/[^0-9]/g, "");
                        setWithdrawAmount(raw ? Number(raw).toLocaleString() : "");
                      }}
                      placeholder="0"
                      className="flex-1 bg-transparent font-display text-2xl font-bold outline-none placeholder:text-muted-foreground/30"
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    Available: <span className="font-bold text-foreground">{formatMoney(available)}</span>
                  </p>
                </div>

                <div>
                  <label className="block mb-1.5 text-sm font-semibold">Bank</label>
                  <div className="relative">
                    <Building2 className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <select
                      value={withdrawBank}
                      onChange={(e) => setWithdrawBank(e.target.value)}
                      className="w-full appearance-none rounded-2xl border border-border bg-card pl-12 pr-4 py-3.5 text-sm outline-none focus:border-primary"
                    >
                      <option value="">Select bank…</option>
                      {NIGERIAN_BANKS.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block mb-1.5 text-sm font-semibold">Account number</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    value={withdrawAccNum}
                    onChange={(e) => setWithdrawAccNum(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    placeholder="10-digit NUBAN"
                    className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 font-mono text-sm outline-none focus:border-primary placeholder:font-sans placeholder:text-muted-foreground/50"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">{withdrawAccNum.length}/10 digits</p>
                </div>

                <div>
                  <label className="block mb-1.5 text-sm font-semibold">Account name</label>
                  <input
                    type="text"
                    value={withdrawAccName}
                    onChange={(e) => setWithdrawAccName(e.target.value)}
                    placeholder="As it appears on the account"
                    className="w-full rounded-2xl border border-border bg-card px-4 py-3.5 text-sm outline-none focus:border-primary placeholder:text-muted-foreground/50"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const amt = Number(withdrawAmount.replace(/,/g, ""));
                    if (!amt || amt < 100) { toast.error("Enter a valid amount."); return; }
                    if (amt > available) { toast.error("Exceeds available balance."); return; }
                    if (!withdrawBank) { toast.error("Select your bank."); return; }
                    if (withdrawAccNum.length !== 10) { toast.error("Account number must be 10 digits."); return; }
                    if (!withdrawAccName.trim()) { toast.error("Account name is required."); return; }
                    setWithdrawStep("review");
                  }}
                  className="w-full gradient-brand rounded-2xl py-4 text-sm font-bold text-primary-foreground shadow-brand"
                >
                  Review withdrawal
                </button>
              </div>
            </div>
          )}

          {withdrawStep === "review" && (
            <div>
              <ModalHeader
                title="Confirm withdrawal"
                subtitle="Review the details before submitting."
                onClose={closeModal}
                onBack={() => setWithdrawStep("form")}
              />
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-center py-4 rounded-2xl bg-secondary/40">
                  <div className="text-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">You're withdrawing</p>
                    <p className="font-display text-4xl font-bold">₦{withdrawAmount}</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-secondary/20 divide-y divide-border overflow-hidden">
                  <ReceiptRow label="Bank" value={withdrawBank} />
                  <ReceiptRow label="Account number" value={withdrawAccNum} />
                  <ReceiptRow label="Account name" value={withdrawAccName} />
                  <ReceiptRow label="Processing time" value="1–3 business days" />
                </div>

                <div className="rounded-xl border border-border bg-secondary/30 px-4 py-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Only settled, available funds can be withdrawn. Funds held in escrow or pending reconciliation are not eligible.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => void createWithdrawal.mutateAsync()}
                  disabled={createWithdrawal.isPending}
                  className="w-full rounded-2xl bg-foreground py-4 text-sm font-bold text-background disabled:opacity-50"
                >
                  {createWithdrawal.isPending ? "Submitting…" : "Confirm & submit"}
                </button>
              </div>
            </div>
          )}

          {withdrawStep === "done" && (
            <div className="p-8 text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand-green/10">
                <Check className="h-8 w-8 text-brand-green" />
              </div>
              <p className="font-display text-xl font-bold">Withdrawal submitted</p>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                Your withdrawal of <strong>₦{withdrawAmount}</strong> to <strong>{withdrawBank}</strong> has been submitted. Expect it within 1–3 business days.
              </p>
              <button
                type="button"
                onClick={closeModal}
                className="mt-6 w-full rounded-2xl border border-border py-3 text-sm font-semibold text-muted-foreground hover:text-foreground transition"
              >
                Close
              </button>
            </div>
          )}
        </ModalOverlay>
      )}
    </AppLayout>
  );
}

function LedgerRow({ item, tab }: { item: any; tab: LedgerTab }) {
  const isDeposit = tab === "deposits";
  const isWithdraw = tab === "withdrawals";

  const label =
    tab === "transactions"
      ? String(item.transaction_type ?? "").replaceAll("_", " ")
      : isDeposit
        ? (item.reference_code ?? "Deposit")
        : (item.destination_details?.bank_name
            ? `${item.destination_details.bank_name} · ${item.destination_details.account_number ?? ""}`
            : item.destination_label ?? "Withdrawal");

  const status = String(item.status ?? "").replaceAll("_", " ");

  return (
    <div className="flex items-center gap-4 py-4">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
          isDeposit
            ? "bg-brand-green/10 text-brand-green"
            : isWithdraw
              ? "bg-destructive/10 text-destructive"
              : "bg-primary/10 text-primary"
        }`}
      >
        {isDeposit ? (
          <ArrowDownLeft className="h-4 w-4" />
        ) : isWithdraw ? (
          <ArrowUpRight className="h-4 w-4" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold capitalize truncate">{label}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-muted-foreground">
            {new Date(item.created_at).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold capitalize ${
              status === "submitted" || status === "pending"
                ? "bg-amber-400/10 text-amber-400"
                : status === "settled" || status === "approved"
                  ? "bg-brand-green/10 text-brand-green"
                  : "bg-secondary text-muted-foreground"
            }`}
          >
            {status}
          </span>
        </div>
      </div>
      <p
        className={`font-display text-base font-bold ${
          isDeposit ? "text-brand-green" : isWithdraw ? "text-destructive" : "text-foreground"
        }`}
      >
        {isWithdraw ? "−" : "+"}
        {formatMoney(Number(item.amount ?? 0))}
      </p>
    </div>
  );
}

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-md rounded-t-3xl sm:rounded-3xl bg-background border border-border shadow-elevated overflow-hidden max-h-[90dvh] overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

function ModalHeader({
  title,
  subtitle,
  onClose,
  onBack,
}: {
  title: string;
  subtitle: string;
  onClose: () => void;
  onBack?: () => void;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border px-6 py-5">
      <div className="flex items-center gap-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="text-muted-foreground hover:text-foreground transition"
          >
            ←
          </button>
        )}
        <div>
          <p className="font-display text-base font-bold">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-muted-foreground hover:text-foreground transition"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

function ReceiptRow({
  label,
  value,
  copyable,
  highlight,
}: {
  label: string;
  value: string;
  copyable?: boolean;
  highlight?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3.5">
      <p className="text-xs text-muted-foreground shrink-0">{label}</p>
      <div className="flex items-center gap-2 min-w-0">
        <p
          className={`text-sm font-mono font-semibold truncate ${
            highlight ? "text-primary" : "text-foreground"
          }`}
        >
          {value}
        </p>
        {copyable && (
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-brand-green" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
}

function fmtShort(n: number) {
  if (n >= 1_000_000) return `₦${n / 1_000_000}M`;
  if (n >= 1_000) return `₦${n / 1_000}K`;
  return `₦${n}`;
}
