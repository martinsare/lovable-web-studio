import { createFileRoute } from "@tanstack/react-router";
import { LegalPage, H2 } from "@/components/legal-page";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — CoFund" },
      { name: "description", content: "The terms that govern your use of CoFund." },
    ],
  }),
  component: () => (
    <LegalPage eyebrow="Legal" title="Terms of Service" intro="By using CoFund you agree to these terms.">
      <H2>1. Eligibility</H2>
      <p>You must be 18+ and able to enter binding contracts under the laws of your jurisdiction.</p>
      <H2>2. Accounts and roles</H2>
      <p>One account per person. You may enable multiple roles (Investor, Business Owner, Startup Builder, Mentor, Professional, Community Member). Verification is required for funded activity.</p>
      <H2>3. Investments</H2>
      <p>All investments carry risk including total loss. CoFund facilitates discovery and escrow but does not guarantee returns. Read each opportunity's full disclosure before committing funds.</p>
      <H2>4. Conduct</H2>
      <p>No fraud, misrepresentation, spam or harassment. We may suspend accounts that violate these terms or our community guidelines.</p>
      <H2>5. Liability</H2>
      <p>CoFund is provided "as is". To the extent permitted by law we disclaim implied warranties and limit liability to fees paid.</p>
    </LegalPage>
  ),
});