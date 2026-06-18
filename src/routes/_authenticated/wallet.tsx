import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Landmark,
  Wallet,
  RefreshCw,
  ChevronRight,
  Clock,
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

function WalletPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [depositAmount, setDepositAmount] = useState("250000");
  const [withdrawAmount, setWithdrawAmount] = useState("100000");
  const [withdrawDestination, setWithdrawDestination] = useState("");
  const [panel, setPanel] = useState<"none" | "deposit" | "withdraw">("none");
  const [ledgerTab, setLedgerTab] = useState<LedgerTab>("transactions");

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
        .limit(10);
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
        .limit(10);
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
        .limit(12);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const createDeposit = useMutation({
    mutationFn: async () => {
      const amount = Number(depositAmount);
      const reference = `WAL-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
      const { error } = await (supabase as any).from("wallet_deposit_requests").insert({
        wallet_id: wallet?.id ?? null,
        user_id: user!.id,
        amount,
        rail: "bank_transfer",
        status: "submitted",
        reference_code: reference,
        note: "Investor requested wallet top-up via bank transfer.",
        metadata: {
          bank_name: "Settlement Partner Bank",
          account_name: "CoFund Wallet Collections",
          account_number: "2039485761",
        },
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Top-up request created. Transfer to the details above.");
      setPanel("none");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["wallet", "deposits", user?.id] }),
        queryClient.invalidateQueries({ queryKey: ["wallet", user?.id] }),
      ]);
    },
  });

  const createWithdrawal = useMutation({
    mutationFn: async () => {
      const amount = Number(withdrawAmount);
      if (amount > Number(wallet?.available_balance ?? 0))
        throw new Error("Withdrawal amount exceeds available balance.");
      const { error } = await (supabase as any).from("wallet_withdrawal_requests").insert({
        wallet_id: wallet?.id ?? null,
        user_id: user!.id,
        amount,
        destination_label: withdrawDestination || "Primary bank account",
        destination_details: { destination_label: withdrawDestination || "Primary bank account" },
        status: "submitted",
        note: "Investor requested withdrawal from settled wallet funds.",
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Withdrawal request submitted.");
      setPanel("none");
      await queryClient.invalidateQueries({ queryKey: ["wallet", "withdrawals", user?.id] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Unable to create withdrawal request."),
  });

  const available = Number(wallet?.available_balance ?? 0);
  const ledger = Number(wallet?.ledger_balance ?? 0);
  const pending = ledger - available;

  const ledgerItems: Record<LedgerTab, any[]> = { deposits, withdrawals, transactions };

  return (
    <AppLayout>
      <div className="min-h-full bg-background">
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">

          {/* Balance card — styled like a physical bank card */}
          <div className="relative overflow-hidden rounded-3xl p-7 shadow-elevated"
            style={{ background: "linear-gradient(135deg, oklch(0.22 0.06 160) 0%, oklch(0.17 0.04 220) 60%, oklch(0.14 0.08 160) 100%)" }}>
            <div className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
            <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-brand-green/10 blur-3xl" />

            <div className="relative">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-white/60" />
                  <span className="text-sm font-semibold text-white/60 uppercase tracking-widest">CoFund Wallet</span>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${wallet?.status === "active" ? "bg-brand-green/20 text-brand-green" : "bg-white/10 text-white/60"}`}>
                  {wallet?.status ?? "active"}
                </span>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40 mb-2">Available balance</p>
                <p className="font-display text-5xl font-bold text-white tracking-tight">
                  {walletLoading ? "—" : formatMoney(available)}
                </p>
              </div>

              <div className="mt-6 flex items-center gap-6">
                <div>
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">Ledger</p>
                  <p className="text-sm font-bold text-white/80">{formatMoney(ledger)}</p>
                </div>
                {pending > 0 && (
                  <div>
                    <p className="text-[10px] text-white/40 uppercase tracking-wider">Pending</p>
                    <p className="text-sm font-bold text-amber-400">{formatMoney(pending)}</p>
                  </div>
                )}
                <div className="ml-auto">
                  <p className="text-[10px] text-white/40 uppercase tracking-wider">Currency</p>
                  <p className="text-sm font-bold text-white/80">NGN</p>
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPanel(panel === "deposit" ? "none" : "deposit")}
              className={`flex items-center justify-center gap-2 rounded-2xl border py-4 text-sm font-bold transition ${
                panel === "deposit"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-card text-foreground hover:border-primary/40"
              }`}
            >
              <ArrowDownLeft className="h-5 w-5" /> Deposit funds
            </button>
            <button
              type="button"
              onClick={() => setPanel(panel === "withdraw" ? "none" : "withdraw")}
              className={`flex items-center justify-center gap-2 rounded-2xl border py-4 text-sm font-bold transition ${
                panel === "withdraw"
                  ? "border-destructive/40 bg-destructive/5 text-destructive"
                  : "border-border bg-card text-foreground hover:border-destructive/30"
              }`}
            >
              <ArrowUpRight className="h-5 w-5" /> Withdraw
            </button>
          </div>

          {/* Deposit panel */}
          {panel === "deposit" && (
            <div className="mt-4 rounded-2xl border border-primary/20 bg-card p-6 space-y-4">
              <div>
                <p className="font-display text-base font-bold">Top up your wallet</p>
                <p className="mt-1 text-sm text-muted-foreground">Transfer to the account below and we'll credit your wallet once confirmed.</p>
              </div>
              <div className="rounded-xl border border-border bg-background/60 p-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bank</span>
                  <span className="font-semibold">Settlement Partner Bank</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account name</span>
                  <span className="font-semibold">CoFund Wallet Collections</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Account number</span>
                  <span className="font-mono font-bold text-primary">2039485761</span>
                </div>
              </div>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold">Amount (NGN)</span>
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 font-display text-lg font-bold outline-none focus:border-primary"
                />
              </label>
              <button
                type="button"
                onClick={() => void createDeposit.mutateAsync()}
                disabled={createDeposit.isPending}
                className="w-full gradient-brand rounded-xl py-3 text-sm font-bold text-primary-foreground shadow-brand disabled:opacity-50"
              >
                {createDeposit.isPending ? "Creating request…" : "Confirm top-up request"}
              </button>
            </div>
          )}

          {/* Withdraw panel */}
          {panel === "withdraw" && (
            <div className="mt-4 rounded-2xl border border-destructive/20 bg-card p-6 space-y-4">
              <div>
                <p className="font-display text-base font-bold">Withdraw settled funds</p>
                <p className="mt-1 text-sm text-muted-foreground">Only settled, available balance can be withdrawn. Processing takes 1–3 business days.</p>
              </div>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold">Withdrawal amount (NGN)</span>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 font-display text-lg font-bold outline-none focus:border-primary"
                />
                <p className="mt-1 text-xs text-muted-foreground">Available: {formatMoney(available)}</p>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold">Destination label</span>
                <input
                  value={withdrawDestination}
                  onChange={(e) => setWithdrawDestination(e.target.value)}
                  placeholder="Primary bank account"
                  className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </label>
              <button
                type="button"
                onClick={() => void createWithdrawal.mutateAsync()}
                disabled={createWithdrawal.isPending}
                className="w-full rounded-xl bg-foreground py-3 text-sm font-bold text-background disabled:opacity-50"
              >
                {createWithdrawal.isPending ? "Submitting…" : "Submit withdrawal request"}
              </button>
            </div>
          )}

          {/* Ledger */}
          <div className="mt-8">
            <div className="flex gap-0 border-b border-border mb-5">
              {(
                [
                  { key: "transactions", label: "Transactions" },
                  { key: "deposits", label: "Deposits" },
                  { key: "withdrawals", label: "Withdrawals" },
                ] as const
              ).map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setLedgerTab(key)}
                  className={`px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                    ledgerTab === key
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                  {ledgerItems[key].length > 0 && (
                    <span className="ml-1.5 rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-bold">
                      {ledgerItems[key].length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {ledgerItems[ledgerTab].length === 0 ? (
              <div className="py-12 text-center">
                <Clock className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
                <p className="text-sm text-muted-foreground">No {ledgerTab} yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border/60">
                {ledgerItems[ledgerTab].map((item: any) => (
                  <div key={item.id} className="flex items-center gap-4 py-4">
                    <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                      ledgerTab === "deposits"
                        ? "bg-brand-green/10 text-brand-green"
                        : ledgerTab === "withdrawals"
                          ? "bg-destructive/10 text-destructive"
                          : "bg-primary/10 text-primary"
                    }`}>
                      {ledgerTab === "deposits"
                        ? <ArrowDownLeft className="h-4 w-4" />
                        : ledgerTab === "withdrawals"
                          ? <ArrowUpRight className="h-4 w-4" />
                          : <RefreshCw className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold">
                        {ledgerTab === "transactions"
                          ? String(item.transaction_type ?? "").replaceAll("_", " ")
                          : ledgerTab === "deposits"
                            ? (item.reference_code ?? "Deposit")
                            : (item.destination_label ?? "Withdrawal")}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(item.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} ·{" "}
                        <span className="capitalize">{String(item.status ?? "").replaceAll("_", " ")}</span>
                      </p>
                    </div>
                    <p className={`font-display text-base font-bold ${
                      ledgerTab === "deposits" ? "text-brand-green" : ledgerTab === "withdrawals" ? "text-destructive" : "text-foreground"
                    }`}>
                      {ledgerTab === "withdrawals" ? "-" : "+"}{formatMoney(Number(item.amount ?? 0))}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
