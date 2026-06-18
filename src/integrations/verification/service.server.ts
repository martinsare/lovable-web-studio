import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sumsubProvider } from "@/integrations/verification/providers/sumsub.server";
import { youverifyProvider } from "@/integrations/verification/providers/youverify.server";
import type { VerificationProviderClient } from "@/integrations/verification/types";

const providerSchema = z.enum(["sumsub", "youverify"]);
const subjectSchema = z.enum(["individual_investor", "business_entity", "beneficial_owner"]);

const startVerificationSchema = z.object({
  provider: providerSchema,
  subjectType: subjectSchema,
  userId: z.string().uuid(),
  businessEntityId: z.string().uuid().optional(),
  uboRecordId: z.string().uuid().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const startVerificationSession = createServerFn({ method: "POST" })
  .validator(startVerificationSchema)
  .handler(async ({ data }) => {
    const provider = getProvider(data.provider);

    const [{ data: profile }, { data: businessEntity }] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id,full_name,phone,country")
        .eq("id", data.userId)
        .maybeSingle(),
      data.businessEntityId
        ? supabaseAdmin
            .from("business_entities")
            .select("id,legal_name,registration_number,tax_id,country")
            .eq("id", data.businessEntityId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    const session = await provider.createSession({
      provider: data.provider,
      subjectType: data.subjectType,
      applicant: {
        userId: data.userId,
        fullName: profile?.full_name ?? null,
        phone: profile?.phone ?? null,
        country: profile?.country ?? null,
      },
      business: businessEntity
        ? {
            businessEntityId: businessEntity.id,
            name: businessEntity.legal_name,
            registrationNumber: businessEntity.registration_number,
            taxId: businessEntity.tax_id,
            country: businessEntity.country,
          }
        : null,
      metadata: data.metadata,
    });

    const { data: inserted, error } = await supabaseAdmin
      .from("verification_sessions")
      .insert({
        user_id: data.userId,
        business_entity_id: data.businessEntityId ?? null,
        ubo_record_id: data.uboRecordId ?? null,
        provider: data.provider,
        subject_type: data.subjectType,
        status: session.status,
        provider_session_id: session.externalSessionId,
        provider_applicant_id: session.externalApplicantId ?? null,
        review_url: session.reviewUrl ?? null,
        request_payload: data.metadata ?? {},
        response_payload: session.raw,
      })
      .select("id,provider,status,provider_session_id,review_url")
      .single();

    if (error) throw error;
    return inserted;
  });

const syncVerificationSchema = z.object({
  provider: providerSchema,
  providerSessionId: z.string().min(1),
});

export const syncVerificationSession = createServerFn({ method: "POST" })
  .validator(syncVerificationSchema)
  .handler(async ({ data }) => {
    const provider = getProvider(data.provider);
    const session = await provider.getSession(data.providerSessionId);

    const { data: updated, error } = await supabaseAdmin
      .from("verification_sessions")
      .update({
        status: session.status,
        review_url: session.reviewUrl ?? null,
        response_payload: session.raw,
        updated_at: new Date().toISOString(),
      })
      .eq("provider", data.provider)
      .eq("provider_session_id", data.providerSessionId)
      .select("id,provider,status,provider_session_id,review_url")
      .single();

    if (error) throw error;
    return updated;
  });

function getProvider(provider: "sumsub" | "youverify"): VerificationProviderClient {
  return provider === "sumsub" ? sumsubProvider : youverifyProvider;
}
