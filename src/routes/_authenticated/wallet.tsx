import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Landmark, Wallet } from "lucide-react";
import { PageShell } from "@/components/page-shell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney } from "@/lib/investment-checkout";

export const Route = createFileRoute("/_authenticated/wallet")({
  head: () => ({ meta: [{ title: "Wallet and Cash Management - CoFund" }] }),
  component: WalletPage,
});

function WalletPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [depositAmount, setDepositAmount] = useState("250000");
  const [withdrawAmount, setWithdrawAmount] = useState("100000");
  const [withdrawDestination, setWithdrawDestination] = useState("");

  const { data: wallet } = useQuery({
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
      toast.success("Wallet top-up request created.");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["wallet", "deposits", user?.id] }),
        queryClient.invalidateQueries({ queryKey: ["wallet", user?.id] }),
      ]);
    },
  });

  const createWithdrawal = useMutation({
    mutationFn: async () => {
      const amount = Number(withdrawAmount);
      if (amount > Number(wallet?.available_balance ?? 0)) {
        throw new Error("Withdrawal amount exceeds available balance.");
      }
      const { error } = await (supabase as any).from("wallet_withdrawal_requests").insert({
        wallet_id: wallet?.id ?? null,
        user_id: user!.id,
        amount,
        destination_label: withdrawDestination || "Primary bank account",
        destination_details: {
          destination_label: withdrawDestination || "Primary bank account",
        },
        status: "submitted",
        note: "Investor requested withdrawal from settled wallet funds.",
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Withdrawal request submitted.");
      await queryClient.invalidateQueries({ queryKey: ["wallet", "withdrawals", user?.id] });
    },
    onError: (error: any) => {
      toast.error(error?.message ?? "Unable to create withdrawal request.");
    },
  });

  return (
    <PageShell
      eyebrow="Cash management"
      title="Wallet"
      description="Top up available cash, request withdrawals, and separate pending from settled wallet funds."
    >
      <section className="grid gap-4 md:grid-cols-3">
        <Metric label="Ledger balance" value={formatMoney(Number(wallet?.ledger_balance ?? 0))} />
        <Metric label="Available balance" value={formatMoney(Number(wallet?.available_balance ?? 0))} />
        <Metric label="Wallet status" value={String(wallet?.status ?? "active")} />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-bold">Top up wallet</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            This creates a transfer request and collection reference so operations can reconcile your deposit into settled wallet funds.
          </p>
          <div className="mt-5 grid gap-4">
            <label>
              <span className="mb-2 block text-sm font-medium">Deposit amount</span>
              <input value={depositAmount} onChange={(event) => setDepositAmount(event.target.value)} type="number" className={inputCls} />
            </label>
            <button
              type="button"
              onClick={() => void createDeposit.mutateAsync()}
              disabled={createDeposit.isPending}
              className="gradient-brand rounded-2xl px-5 py-3 text-sm font-semibold text-white shadow-brand disabled:opacity-50"
            >
              {createDeposit.isPending ? "Creating request..." : "Create top-up request"}
            </button>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-bold">Withdraw settled funds</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Withdrawals should only come from settled, available wallet funds. Pending or escrow-held balances should remain locked.
          </p>
          <div className="mt-5 grid gap-4">
            <label>
              <span className="mb-2 block text-sm font-medium">Withdrawal amount</span>
              <input value={withdrawAmount} onChange={(event) => setWithdrawAmount(event.target.value)} type="number" className={inputCls} />
            </label>
            <label>
              <span className="mb-2 block text-sm font-medium">Destination label</span>
              <input value={withdrawDestination} onChange={(event) => setWithdrawDestination(event.target.value)} placeholder="Primary bank account" className={inputCls} />
            </label>
            <button
              type="button"
              onClick={() => void createWithdrawal.mutateAsync()}
              disabled={createWithdrawal.isPending}
              className="rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
            >
              {createWithdrawal.isPending ? "Submitting..." : "Submit withdrawal"}
            </button>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        <ListCard title="Top-up requests" items={deposits} render={(item) => (
          <>
            <p className="font-semibold">{formatMoney(Number(item.amount ?? 0))}</p>
            <p className="text-sm text-muted-foreground">{item.reference_code ?? "Reference pending"}</p>
            <p className="text-xs text-muted-foreground">{String(item.status).replaceAll("_", " ")}</p>
          </>
        )} />
        <ListCard title="Withdrawal requests" items={withdrawals} render={(item) => (
          <>
            <p className="font-semibold">{formatMoney(Number(item.amount ?? 0))}</p>
            <p className="text-sm text-muted-foreground">{item.destination_label ?? "Primary bank account"}</p>
            <p className="text-xs text-muted-foreground">{String(item.status).replaceAll("_", " ")}</p>
          </>
        )} />
        <ListCard title="Wallet transactions" items={transactions} render={(item) => (
          <>
            <p className="font-semibold">{formatMoney(Number(item.amount ?? 0))}</p>
            <p className="text-sm text-muted-foreground">{String(item.transaction_type).replaceAll("_", " ")}</p>
            <p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString()}</p>
          </>
        )} />
      </section>
    </PageShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}

function ListCard({ title, items, render }: { title: string; items: any[]; render: (item: any) => React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <h2 className="font-display text-xl font-bold">{title}</h2>
      <div className="mt-4 grid gap-3">
        {!items.length ? (
          <p className="text-sm text-muted-foreground">No activity yet.</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="rounded-2xl border border-border bg-background px-4 py-3">
              {render(item)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const inputCls = "w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary";
