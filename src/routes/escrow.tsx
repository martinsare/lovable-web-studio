import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, H2 } from "@/components/legal-page";

export const Route = createFileRoute("/escrow")({
  head: () => ({
    meta: [
      { title: "Escrow Policy — CoFund" },
      { name: "description", content: "How CoFund's escrow protection works for every investment." },
    ],
  }),
  component: () => (
    <LegalPage eyebrow="Trust" title="Escrow Policy" intro="Every investment runs through a regulated escrow partner.">
      <H2>How escrow works</H2>
      <p>Investor funds are held by a licensed banking partner. Funds are released to the business only when verified milestones are met and reported transparently to investors.</p>
      <H2>Milestone release</H2>
      <p>Each funding round defines milestones — for example, equipment purchase, branch launch, or revenue targets. Releases are gated by evidence and, where applicable, investor approval.</p>
      <H2>Refunds</H2>
      <p>If a round fails to close or a business fails verification, escrowed funds are returned to investors in full, less any non-refundable processing fees that are disclosed upfront.</p>
      <H2>Partners</H2>
      <p>We work with regulated escrow and payment partners. Specific partner names are listed on each opportunity page.</p>
    </LegalPage>
  ),
});