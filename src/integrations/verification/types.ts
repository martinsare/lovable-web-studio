export type VerificationProviderKey = "sumsub" | "youverify";

export type VerificationSubjectType = "individual_investor" | "business_entity" | "beneficial_owner";

export type VerificationSessionStatus =
  | "draft"
  | "pending_submission"
  | "in_review"
  | "approved"
  | "rejected"
  | "needs_action"
  | "expired";

export type VerificationApplicant = {
  userId: string;
  email?: string | null;
  fullName?: string | null;
  phone?: string | null;
  country?: string | null;
};

export type VerificationBusiness = {
  businessEntityId?: string | null;
  name?: string | null;
  registrationNumber?: string | null;
  taxId?: string | null;
  country?: string | null;
};

export type VerificationPayload = {
  provider: VerificationProviderKey;
  subjectType: VerificationSubjectType;
  applicant: VerificationApplicant;
  business?: VerificationBusiness | null;
  metadata?: Record<string, unknown>;
};

export type VerificationProviderSession = {
  provider: VerificationProviderKey;
  externalSessionId: string;
  externalApplicantId?: string | null;
  status: VerificationSessionStatus;
  reviewUrl?: string | null;
  raw: Record<string, unknown>;
};

export type VerificationProviderClient = {
  createSession(payload: VerificationPayload): Promise<VerificationProviderSession>;
  getSession(sessionId: string): Promise<VerificationProviderSession>;
  normalizeWebhook(payload: unknown): {
    externalSessionId: string;
    status: VerificationSessionStatus;
    raw: Record<string, unknown>;
  };
};
