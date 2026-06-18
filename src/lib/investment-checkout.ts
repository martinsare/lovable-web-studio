export type CheckoutRail = "bank_transfer" | "wire" | "wallet_balance";

export const checkoutRails: {
  id: CheckoutRail;
  label: string;
  description: string;
  note: string;
}[] = [
  {
    id: "bank_transfer",
    label: "Bank transfer",
    description: "Best for local investors funding in naira.",
    note: "Funds are matched to your commitment using a unique escrow reference.",
  },
  {
    id: "wire",
    label: "Wire",
    description: "For higher-ticket local or cross-border investments.",
    note: "Useful for company, treasury, trust, or international investors.",
  },
  {
    id: "wallet_balance",
    label: "Wallet balance",
    description: "Use available CoFund wallet funds immediately.",
    note: "Best for re-investing refunded capital or existing wallet deposits.",
  },
];

export function formatMoney(amount: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getRailLabel(rail: string) {
  return checkoutRails.find((item) => item.id === rail)?.label ?? rail;
}
