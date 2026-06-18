export type InvestmentStep = {
  id: string;
  title: string;
  detail: string;
  gate?: string;
};

export function getInvestmentWorkflow() {
  return [
    {
      id: "eligibility",
      title: "Complete security and verification",
      detail: "Verify email, enable MFA, and complete KYC or KYB before any money movement is allowed.",
      gate: "Required before checkout",
    },
    {
      id: "entity",
      title: "Choose who is investing",
      detail: "Invest as an individual, company, trust, or fund once the relevant accreditation and entity checks are approved.",
      gate: "Entity path changes documents needed",
    },
    {
      id: "commitment",
      title: "Create an investment commitment",
      detail: "Pick the amount, review the instrument and disclosures, and confirm the commitment terms.",
      gate: "Terms acceptance + suitability review",
    },
    {
      id: "payment",
      title: "Select a funding rail",
      detail: "Use bank transfer, wire, card, or wallet balance depending on the round, jurisdiction, and processor setup.",
      gate: "Available rails vary by offering",
    },
    {
      id: "escrow",
      title: "Move funds into escrow",
      detail: "Confirmed payments settle into escrow rather than going directly to the issuer or business.",
      gate: "Escrow partner releases on round rules",
    },
    {
      id: "closing",
      title: "Close, refund, or release",
      detail: "If the round closes successfully, funds release under the deal terms. If it fails or verification breaks, refunds go back through the original rail.",
      gate: "Status tracked per commitment",
    },
  ] satisfies InvestmentStep[];
}
