import type { AppRole } from "@/hooks/use-auth";

export type VerificationProvider = "undecided" | "sumsub" | "youverify" | "manual_review";

export type ComplianceInput = {
  verificationProviderPreference: VerificationProvider;
  dateOfBirth: string;
  nationality: string;
  residentialAddress: string;
  kycIdType: string;
  kycIdNumber: string;
  nin: string;
  bvn: string;
  pepConsent: boolean;
  sanctionsConsent: boolean;
  investorAccreditationStatus: string;
  investorAccreditationBasis: string;
  investorAnnualIncomeRange: string;
  investorNetWorthRange: string;
  businessRegistrationNumber: string;
  businessTaxId: string;
  businessAddress: string;
  representativeName: string;
  representativeRole: string;
  representativeEmail: string;
  directorsCount: string;
  beneficialOwnersCount: string;
};

export const VERIFICATION_PROVIDER_OPTIONS = [
  { value: "undecided", label: "Decide later" },
  { value: "sumsub", label: "Sumsub" },
  { value: "youverify", label: "Youverify" },
  { value: "manual_review", label: "Manual review first" },
] as const;

export const ID_DOCUMENT_OPTIONS = [
  "National ID / NIN",
  "Bank Verification Number / BVN",
  "Passport",
  "Driver's license",
  "Voter's card",
  "Residence permit",
] as const;

export const ACCREDITATION_STATUS_OPTIONS = [
  "Yes - already accredited",
  "No - not yet accredited",
  "Unsure - need guidance",
] as const;

export const ACCREDITATION_BASIS_OPTIONS = [
  "Annual income",
  "Net worth",
  "Entity / institution",
  "Professional qualification",
  "Not applicable yet",
] as const;

export const ANNUAL_INCOME_OPTIONS = [
  "Under $25,000",
  "$25,000 - $50,000",
  "$50,000 - $100,000",
  "$100,000 - $200,000",
  "Over $200,000",
] as const;

export const NET_WORTH_OPTIONS = [
  "Under $100,000",
  "$100,000 - $250,000",
  "$250,000 - $500,000",
  "$500,000 - $1M",
  "Over $1M",
] as const;

export function buildComplianceMetadata(roles: AppRole[], input: ComplianceInput) {
  const providerPreference = input.verificationProviderPreference;
  const requiresIndividualKyc =
    roles.includes("investor") ||
    roles.includes("business_owner") ||
    roles.includes("mentor") ||
    roles.includes("professional");
  const requiresBusinessKyb = roles.includes("business_owner");

  return {
    providerPreference,
    status: "not_started",
    requirements: {
      requiresIndividualKyc,
      requiresBusinessKyb,
      requiresAccreditationReview: roles.includes("investor"),
    },
    individualKyc: requiresIndividualKyc
      ? {
          dateOfBirth: input.dateOfBirth,
          nationality: input.nationality,
          residentialAddress: input.residentialAddress,
          idType: input.kycIdType,
          idNumber: input.kycIdNumber,
          nigeriaIdentifiers: {
            nin: input.nin,
            bvn: input.bvn,
          },
        }
      : null,
    investorSuitability: roles.includes("investor")
      ? {
          accreditationStatus: input.investorAccreditationStatus,
          accreditationBasis: input.investorAccreditationBasis,
          annualIncomeRange: input.investorAnnualIncomeRange,
          netWorthRange: input.investorNetWorthRange,
        }
      : null,
    businessKyb: requiresBusinessKyb
      ? {
          registrationNumber: input.businessRegistrationNumber,
          taxId: input.businessTaxId,
          registeredAddress: input.businessAddress,
          representative: {
            name: input.representativeName,
            role: input.representativeRole,
            email: input.representativeEmail,
          },
          structure: {
            directorsCount: input.directorsCount,
            beneficialOwnersCount: input.beneficialOwnersCount,
          },
        }
      : null,
    screening: {
      pepConsent: input.pepConsent,
      sanctionsConsent: input.sanctionsConsent,
    },
    vendorHints: {
      sumsub: {
        individualLevel: requiresIndividualKyc ? "cofund-individual-standard" : null,
        companyLevel: requiresBusinessKyb ? "cofund-business-standard" : null,
      },
      youverify: {
        workflows: [
          requiresIndividualKyc ? "kyc" : null,
          requiresBusinessKyb ? "kyb" : null,
        ].filter(Boolean),
      },
    },
  };
}
