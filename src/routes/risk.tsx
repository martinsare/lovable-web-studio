import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, H2 } from "@/components/legal-page";

export const Route = createFileRoute("/risk")({
  head: () => ({
    meta: [
      { title: "Risk Disclosure — CoFund" },
      { name: "description", content: "Investment risk disclosure for CoFund users." },
    ],
  }),
  component: () => (
    <LegalPage eyebrow="Legal" title="Risk Disclosure" intro="Investing in private businesses involves significant risk.">
      <H2>Capital at risk</H2>
      <p>You may lose some or all of the money you invest. Private businesses can fail. Past performance is not indicative of future results.</p>
      <H2>Illiquidity</H2>
      <p>Private investments are not publicly traded. You may not be able to sell or transfer your position quickly, or at the price you expect.</p>
      <H2>Diversification</H2>
      <p>Only invest amounts you can afford to lose and consider spreading capital across multiple opportunities and asset classes.</p>
      <H2>No guarantee of returns</H2>
      <p>Target returns are projections, not commitments. Returns depend on the business's performance and external conditions.</p>
    </LegalPage>
  ),
});