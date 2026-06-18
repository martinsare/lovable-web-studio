import type {
  VerificationPayload,
  VerificationProviderClient,
  VerificationProviderSession,
} from "@/integrations/verification/types";

function getYouverifyEnv() {
  return {
    apiKey: process.env.YOUVERIFY_API_KEY ?? "",
    baseUrl: process.env.YOUVERIFY_BASE_URL ?? "https://api.youverify.co",
  };
}

export const youverifyProvider: VerificationProviderClient = {
  async createSession(payload: VerificationPayload): Promise<VerificationProviderSession> {
    const env = getYouverifyEnv();
    return {
      provider: "youverify",
      externalSessionId: `youverify-draft-${payload.applicant.userId}`,
      externalApplicantId: null,
      status: "draft",
      reviewUrl: null,
      raw: {
        mode: "scaffold",
        envConfigured: Boolean(env.apiKey),
        endpoints: {
          nin: `${env.baseUrl}/v2/api/identity/ng/nin`,
          bvn: `${env.baseUrl}/v2/api/identity/ng/bvn`,
          business: `${env.baseUrl}/v2/api/identity/ng/company-search`,
        },
        payload,
      },
    };
  },

  async getSession(sessionId: string): Promise<VerificationProviderSession> {
    const env = getYouverifyEnv();
    return {
      provider: "youverify",
      externalSessionId: sessionId,
      externalApplicantId: null,
      status: "draft",
      reviewUrl: null,
      raw: {
        mode: "scaffold",
        envConfigured: Boolean(env.apiKey),
        sessionId,
      },
    };
  },

  normalizeWebhook(payload: unknown) {
    const raw = isRecord(payload) ? payload : {};
    return {
      externalSessionId: readString(raw, "id") || readString(raw, "requestId") || "unknown",
      status: mapProviderStatus(readString(raw, "status")),
      raw,
    };
  },
};

function mapProviderStatus(status?: string | null): VerificationProviderSession["status"] {
  switch ((status ?? "").toLowerCase()) {
    case "success":
    case "approved":
      return "approved";
    case "pending":
      return "pending_submission";
    case "in_review":
      return "in_review";
    case "failed":
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
