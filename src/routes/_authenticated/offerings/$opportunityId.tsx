import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { BookOpen, ExternalLink, FileText, History, MessageCircle, ShieldCheck } from "lucide-react";
import { DocumentUploadDialog } from "@/components/document-upload-dialog";
import { PageShell } from "@/components/page-shell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { DOCUMENT_BUCKETS, formatDocumentSize, getDocumentSignedUrl, uploadDocumentFile } from "@/lib/document-storage";
import { formatMoney } from "@/lib/investment-checkout";
import { createNotifications } from "@/lib/notifications";

export const Route = createFileRoute("/_authenticated/offerings/$opportunityId")({
  head: () => ({ meta: [{ title: "Offering Room - CoFund" }] }),
  component: OfferingRoomPage,
});

const offeringDocumentTypes = [
  "Term sheet",
  "Pitch deck",
  "Financial statements",
  "Risk disclosure",
  "Legal agreement",
  "Milestone evidence",
  "Valuation memo",
  "Cap table extract",
  "General update attachment",
];

function OfferingRoomPage() {
  const { opportunityId } = Route.useParams();
  const { user, roles } = useAuth();
  const queryClient = useQueryClient();
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateBody, setUpdateBody] = useState("");

  const { data: opportunity } = useQuery({
    queryKey: ["offering-room", "opportunity", opportunityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunities")
        .select("id,title,summary,goal_amount,raised_amount,target_return_pct,round_state,risk_level,instrument_type,minimum_investment,duration_days,businesses(name,industry,owner_id)")
        .eq("id", opportunityId)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data as any;
    },
  });

  const { data: documents = [] } = useQuery({
    queryKey: ["offering-room", "documents", opportunityId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("offering_documents")
        .select("id,title,document_type,file_url,description,visibility,status,version_label,storage_bucket,storage_path,original_filename,mime_type,file_size,uploaded_at,created_at")
        .eq("opportunity_id", opportunityId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const { data: updates = [] } = useQuery({
    queryKey: ["offering-room", "updates", opportunityId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("opportunity_updates")
        .select("*")
        .eq("opportunity_id", opportunityId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const { data: roundEvents = [] } = useQuery({
    queryKey: ["offering-room", "round-events", opportunityId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("opportunity_round_events")
        .select("*")
        .eq("opportunity_id", opportunityId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const uploadDocument = useMutation({
    mutationFn: async (payload: {
      title: string;
      documentType: string;
      description: string;
      versionLabel?: string;
      visibility?: string;
      file: File;
    }) => {
      if (!opportunity?.id || !user?.id) {
        throw new Error("Sign in again before uploading offering documents.");
      }

      const uploaded = await uploadDocumentFile({
        bucket: DOCUMENT_BUCKETS.offering,
        scopeId: opportunity.id,
        file: payload.file,
      });

      const { error } = await (supabase as any).from("offering_documents").insert({
        scope: "opportunity",
        opportunity_id: opportunity.id,
        uploader_user_id: user.id,
        title: payload.title,
        document_type: payload.documentType,
        description: payload.description || null,
        visibility: payload.visibility ?? "investors",
        status: "uploaded",
        version_label: payload.versionLabel ?? null,
        storage_bucket: uploaded.bucket,
        storage_path: uploaded.path,
        original_filename: uploaded.originalFilename,
        mime_type: uploaded.mimeType,
        file_size: uploaded.fileSize,
        uploaded_at: new Date().toISOString(),
      });

      if (error) throw error;

      const { data: admins } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
      await createNotifications(
        (admins ?? []).map((admin) => ({
          userId: admin.user_id,
          category: "document_upload",
          title: "New offering document uploaded",
          body: `${opportunity.title} received a new ${payload.documentType.toLowerCase()} for review.`,
          actionLabel: "Open admin",
          actionHref: "/admin",
          metadata: {
            opportunity_id: opportunity.id,
            document_type: payload.documentType,
          },
        })),
      );
    },
    onSuccess: async () => {
      toast.success("Offering document uploaded securely.");
      await queryClient.invalidateQueries({ queryKey: ["offering-room", "documents", opportunityId] });
    },
    onError: (error: any) => {
      toast.error(error?.message ?? "Unable to upload that offering document.");
    },
  });

  const publishUpdate = useMutation({
    mutationFn: async () => {
      if (!user?.id || !opportunity?.id) throw new Error("Sign in again before publishing updates.");
      if (!updateTitle.trim() || !updateBody.trim()) throw new Error("Add both a title and body for the issuer update.");

      const { error } = await (supabase as any).from("opportunity_updates").insert({
        opportunity_id: opportunity.id,
        author_user_id: user.id,
        title: updateTitle.trim(),
        body: updateBody.trim(),
        visibility: "investors",
        status: "published",
      });

      if (error) throw error;

      const { data: investors } = await (supabase as any)
        .from("investment_commitments")
        .select("user_id")
        .eq("opportunity_id", opportunity.id);

      const uniqueInvestorIds = [...new Set((investors ?? []).map((item: any) => item.user_id).filter(Boolean))];
      await createNotifications(
        uniqueInvestorIds.map((userId) => ({
          userId,
          category: "issuer_update",
          title: `New update from ${opportunity.businesses?.name ?? "a business"} `,
          body: updateTitle.trim(),
          actionLabel: "Read update",
          actionHref: `/offerings/${opportunity.id}`,
          metadata: {
            opportunity_id: opportunity.id,
            kind: "issuer_update",
          },
        })),
      );
    },
    onSuccess: async () => {
      toast.success("Issuer update published and investors notified.");
      setUpdateTitle("");
      setUpdateBody("");
      await queryClient.invalidateQueries({ queryKey: ["offering-room", "updates", opportunityId] });
    },
    onError: (error: any) => {
      toast.error(error?.message ?? "Unable to publish that issuer update.");
    },
  });

  async function openDocument(doc: any) {
    try {
      const directUrl = typeof doc.file_url === "string" && /^https?:\/\//.test(doc.file_url) ? doc.file_url : null;
      const signedUrl =
        doc.storage_bucket && doc.storage_path
          ? await getDocumentSignedUrl(doc.storage_bucket, doc.storage_path, doc.original_filename ?? doc.title)
          : directUrl;

      if (!signedUrl) {
        throw new Error("This document does not have a stored file yet.");
      }

      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } catch (error: any) {
      toast.error(error?.message ?? "Unable to open that document right now.");
    }
  }

  if (!opportunity) return null;

  const canUpload = roles.includes("admin") || opportunity.businesses?.owner_id === user?.id;

  return (
    <PageShell
      eyebrow="Offering room"
      title={opportunity.title}
      description="A serious investment platform needs one room for documents, disclosures, updates, and round-state history."
      actions={
        <div className="flex flex-wrap gap-3">
          {canUpload ? (
            <DocumentUploadDialog
              buttonLabel="Upload document"
              title="Upload offering document"
              description="These files stay private in storage and are opened with short-lived signed URLs for eligible investors, founders, and admins."
              documentTypes={offeringDocumentTypes}
              visibilityOptions={[
                { label: "Investors only", value: "investors" },
                { label: "Internal review", value: "internal" },
                { label: "Public summary", value: "public" },
              ]}
              includeVersionLabel
              onSubmit={async (payload) => uploadDocument.mutateAsync(payload)}
            />
          ) : null}
          <Link
            to="/invest/$opportunityId"
            params={{ opportunityId }}
            className="gradient-brand hidden rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-brand sm:inline-flex"
          >
            Continue to checkout
          </Link>
        </div>
      }
    >
      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Business" value={opportunity.businesses?.name ?? "-"} />
        <Metric label="Goal" value={formatMoney(Number(opportunity.goal_amount ?? 0))} />
        <Metric label="Minimum ticket" value={formatMoney(Number(opportunity.minimum_investment ?? 0))} />
        <Metric label="Round state" value={String(opportunity.round_state ?? "draft").replaceAll("_", " ")} />
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <Card icon={<BookOpen className="h-5 w-5 text-primary" />} title="Overview">
            <div className="grid gap-3">
              <Summary label="Industry" value={opportunity.businesses?.industry ?? "-"} />
              <Summary label="Instrument type" value={opportunity.instrument_type ?? "Structured private investment"} />
              <Summary label="Risk level" value={opportunity.risk_level ?? "To be assigned"} />
              <Summary label="Duration" value={opportunity.duration_days ? `${opportunity.duration_days} days` : "To be assigned"} />
            </div>
            {opportunity.summary && <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{opportunity.summary}</p>}
          </Card>

          <Card icon={<FileText className="h-5 w-5 text-primary" />} title="Document center">
            <div className="grid gap-3">
              {!documents.length ? (
                <p className="text-sm text-muted-foreground">
                  No documents uploaded yet. This room should hold term sheets, disclosures, signed agreements, milestone evidence, and investor statements.
                </p>
              ) : (
                documents.map((doc) => (
                  <div key={doc.id} className="rounded-2xl border border-border bg-background px-4 py-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{doc.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {doc.document_type}
                          {doc.version_label ? ` · ${doc.version_label}` : ""}
                          {doc.visibility ? ` · ${doc.visibility}` : ""}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {String(doc.status).replaceAll("_", " ")} · {formatDocumentSize(Number(doc.file_size ?? 0))} · {doc.original_filename ?? "Stored document"}
                        </p>
                        {doc.description ? <p className="mt-2 text-sm text-muted-foreground">{doc.description}</p> : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => void openDocument(doc)}
                        className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open secure link
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card icon={<MessageCircle className="h-5 w-5 text-primary" />} title="Issuer updates">
            {canUpload ? (
              <div className="mb-4 grid gap-3 rounded-2xl border border-border bg-background p-4">
                <input
                  value={updateTitle}
                  onChange={(event) => setUpdateTitle(event.target.value)}
                  placeholder="Quarterly trading update"
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
                />
                <textarea
                  value={updateBody}
                  onChange={(event) => setUpdateBody(event.target.value)}
                  placeholder="Share milestone progress, funding notices, and anything investors should know."
                  rows={4}
                  className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
                />
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => void publishUpdate.mutateAsync()}
                    disabled={publishUpdate.isPending}
                    className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                  >
                    {publishUpdate.isPending ? "Publishing..." : "Publish update"}
                  </button>
                </div>
              </div>
            ) : null}
            <div className="grid gap-3">
              {!updates.length ? (
                <p className="text-sm text-muted-foreground">
                  No issuer updates yet. Mature offerings should show structured progress notes, funding notices, and milestone explanations here.
                </p>
              ) : (
                updates.map((update) => (
                  <div key={update.id} className="rounded-2xl border border-border bg-background px-4 py-3">
                    <p className="font-semibold">{update.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{update.body}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{new Date(update.created_at).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card icon={<History className="h-5 w-5 text-primary" />} title="Round lifecycle">
            <div className="grid gap-3">
              {!roundEvents.length ? (
                <p className="text-sm text-muted-foreground">
                  No round-state events recorded yet. CoFund should record state changes like live, funded, escrowed, closed, and released here.
                </p>
              ) : (
                roundEvents.map((event) => (
                  <div key={event.id} className="rounded-2xl border border-border bg-background px-4 py-3">
                    <p className="font-semibold">{String(event.round_state).replaceAll("_", " ")}</p>
                    {event.note && <p className="text-sm text-muted-foreground">{event.note}</p>}
                    <p className="text-xs text-muted-foreground">{new Date(event.created_at).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card icon={<ShieldCheck className="h-5 w-5 text-primary" />} title="Trust notes">
            <p className="text-sm text-muted-foreground">
              This room is where CoFund should centralize disclosures, legal documents, audit summaries, milestone evidence, and investor-facing status changes instead of scattering them across community posts.
            </p>
          </Card>
        </div>
      </section>
    </PageShell>
  );
}

function Card({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="font-display text-xl font-bold">{title}</h2>
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-2xl font-bold">{value}</p>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-background px-4 py-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}
