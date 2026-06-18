import type {
  VerificationPayload,
  VerificationProviderClient,
  VerificationProviderSession,
} from "@/integrations/verification/types";

function getSumsubEnv() {
  return {
    appToken: process.env.SUMSUB_APP_TOKEN ?? "",
    secretKey: process.env.SUMSUB_SECRET_KEY ?? "",
    baseUrl: process.env.SUMSUB_BASE_URL ?? "https://api.sumsub.com",
    levelName: process.env.SUMSUB_LEVEL_NAME ?? "cofund-individual-standard",
  };
}

export const sumsubProvider: VerificationProviderClient = {
  async createSession(payload: VerificationPayload): Promise<VerificationProviderSession> {
    const env = getSumsubEnv();
    return {
      provider: "sumsub",
      externalSessionId: `sumsub-draft-${payload.applicant.userId}`,
      externalApplicantId: null,
      status: "draft",
      reviewUrl: null,
      raw: {
        mode: "scaffold",
        envConfigured: Boolean(env.appToken && env.secretKey),
        endpoint: `${env.baseUrl}/resources/applicants?levelName=${env.levelName}`,
        payload,
      },
    };
  },

  async getSession(sessionId: string): Promise<VerificationProviderSession> {
    const env = getSumsubEnv();
    return {
      provider: "sumsub",
      externalSessionId: sessionId,
      externalApplicantId: null,
      status: "draft",
      reviewUrl: null,
      raw: {
        mode: "scaffold",
        envConfigured: Boolean(env.appToken && env.secretKey),
        endpoint: `${env.baseUrl}/resources/applicants/-;externalUserId=${sessionId}/one`,
      },
    };
  },

  normalizeWebhook(payload: unknown) {
    const raw = isRecord(payload) ? payload : {};
    return {
      externalSessionId: readString(raw, "externalUserId") || readString(raw, "applicantId") || "unknown",
      status: mapProviderStatus(readString(raw, "reviewStatus")),
      raw,
    };
  },
};

function mapProviderStatus(status?: string | null): VerificationProviderSession["status"] {
  switch (status) {
    case "completed":
    case "approved":
      return "approved";
    case "init":
    case "pending":
      return "pending_submission";
    case "queued":
    case "onHold":
      return "in_review";
    case "rejected":
      return "rejected";
    default:
      return "needs_action";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : null;
}
