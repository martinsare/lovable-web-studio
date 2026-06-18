export type SuitabilityAnswerSet = {
  jurisdiction: string;
  experienceLevel: string;
  annualIncomeRange: string;
  netWorthRange: string;
  lossCapacity: string;
  liquidityNeeds: string;
  investmentHorizon: string;
  riskTolerance: string;
  understandsPrivateMarketRisk: boolean;
  canBearTotalLoss: boolean;
};

export type SuitabilityAssessmentResult = {
  score: number;
  outcome: "passed" | "needs_review" | "failed";
  reasons: string[];
};

const scoreMap: Record<string, number> = {
  novice: 5,
  intermediate: 12,
  experienced: 18,
  expert: 22,
  low: 4,
  medium: 10,
  high: 16,
  short: 4,
  medium_term: 10,
  long_term: 16,
  low_risk: 4,
  balanced: 10,
  growth: 16,
};

export function assessSuitability(input: SuitabilityAnswerSet): SuitabilityAssessmentResult {
  let score = 0;
  const reasons: string[] = [];

  score += scoreMap[input.experienceLevel] ?? 0;
  score += scoreMap[input.lossCapacity] ?? 0;
  score += scoreMap[input.investmentHorizon] ?? 0;
  score += scoreMap[input.riskTolerance] ?? 0;

  if (input.understandsPrivateMarketRisk) score += 18;
  else reasons.push("Private market risk acknowledgement is missing.");

  if (input.canBearTotalLoss) score += 18;
  else reasons.push("Investor cannot currently attest to bearing a total loss.");

  if (input.liquidityNeeds === "immediate") {
    score -= 20;
    reasons.push("High liquidity needs are not a fit for illiquid private investments.");
  } else if (input.liquidityNeeds === "within_12_months") {
    score -= 10;
    reasons.push("Near-term liquidity needs may require manual review.");
  }

  if (input.jurisdiction === "Nigeria" && input.experienceLevel === "novice") {
    reasons.push("New Nigerian investors should receive extra risk guidance before funding.");
  }

  if (score >= 60) {
    return { score, outcome: "passed", reasons };
  }
  if (score >= 40) {
    return { score, outcome: "needs_review", reasons };
  }
  return { score, outcome: "failed", reasons };
}

export const suitabilityQuestions = {
  experienceLevels: [
    { value: "novice", label: "New to private investing" },
    { value: "intermediate", label: "Some private or alternative investment experience" },
    { value: "experienced", label: "Regularly invest in private businesses or alternatives" },
    { value: "expert", label: "Professional or institutional investment experience" },
  ],
  lossCapacity: [
    { value: "low", label: "I can only tolerate small losses" },
    { value: "medium", label: "I can tolerate some losses for higher upside" },
    { value: "high", label: "I can tolerate significant losses including long illiquidity" },
  ],
  liquidityNeeds: [
    { value: "immediate", label: "I may need access to this money within 6 months" },
    { value: "within_12_months", label: "I may need access within 6 to 12 months" },
    { value: "longer_term", label: "I can leave this money invested for over 12 months" },
  ],
  investmentHorizons: [
    { value: "short", label: "Under 12 months" },
    { value: "medium_term", label: "1 to 3 years" },
    { value: "long_term", label: "3+ years" },
  ],
  riskTolerance: [
    { value: "low_risk", label: "Capital preservation matters most" },
    { value: "balanced", label: "I want a balance of growth and downside control" },
    { value: "growth", label: "I can take higher risk for higher returns" },
  ],
} as const;
