import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, ClipboardList, Coins, ExternalLink, FolderOpen, Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { DocumentUploadDialog } from "@/components/document-upload-dialog";
import { PageShell } from "@/components/page-shell";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { DOCUMENT_BUCKETS, formatDocumentSize, getDocumentSignedUrl, uploadDocumentFile } from "@/lib/document-storage";
import { createNotifications } from "@/lib/notifications";

export const Route = createFileRoute("/_authenticated/my-business")({
  head: () => ({ meta: [{ title: "My Business - CoFund" }] }),
  component: MyBusiness,
});

const entityDocumentTypes = [
  "CAC certificate",
  "TIN / Tax ID proof",
  "Board resolution",
  "Shareholder register",
  "UBO evidence",
  "Bank statement",
  "Financial statement",
  "Operating license",
  "Other supporting document",
];

function MyBusiness() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: businesses, isLoading } = useQuery({
    enabled: !!user,
    queryKey: ["my-business", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id,slug,name,industry,tagline,logo_url,cover_url,verified,trust_score,followers_count,founded_year")
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: entities = [] } = useQuery({
    enabled: !!user,
    queryKey: ["my-business-entities", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("business_entities")
        .select("id,legal_name,registration_number,verification_status")
        .eq("owner_user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const primaryEntity = entities[0];

  const { data: entityDocuments = [] } = useQuery({
    enabled: !!primaryEntity?.id,
    queryKey: ["my-business-entity-docs", primaryEntity?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("business_entity_documents")
        .select("id,title,document_type,status,description,file_url,storage_bucket,storage_path,original_filename,mime_type,file_size,uploaded_at,created_at")
        .eq("business_entity_id", primaryEntity.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const uploadEntityDocument = useMutation({
    mutationFn: async (payload: { title: string; documentType: string; description: string; file: File }) => {
      if (!primaryEntity?.id) {
        throw new Error("Create or connect a verified business entity before uploading KYB documents.");
      }

      const uploaded = await uploadDocumentFile({
        bucket: DOCUMENT_BUCKETS.businessEntity,
        scopeId: primaryEntity.id,
        file: payload.file,
      });

      const { error } = await (supabase as any).from("business_entity_documents").insert({
        business_entity_id: primaryEntity.id,
        uploader_user_id: user!.id,
        title: payload.title,
        document_type: payload.documentType,
        status: "uploaded",
        description: payload.description || null,
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
          title: "New KYB document uploaded",
          body: `${primaryEntity.legal_name} uploaded ${payload.documentType.toLowerCase()} for review.`,
          actionLabel: "Review now",
          actionHref: "/admin",
          metadata: {
            entity_id: primaryEntity.id,
            document_type: payload.documentType,
          },
        })),
      );
    },
    onSuccess: async () => {
      toast.success("KYB document uploaded securely.");
      await queryClient.invalidateQueries({ queryKey: ["my-business-entity-docs", primaryEntity?.id] });
    },
    onError: (error: any) => {
      toast.error(error?.message ?? "We couldn't upload that document.");
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

  return (
    <PageShell
      eyebrow="Founder"
      title="My Business"
      description="Your Business Passport, KYB room, funding rounds, and investor reporting workspace."
      actions={
        <button className="gradient-brand hidden items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-brand sm:inline-flex">
          <Plus className="h-4 w-4" /> New business
        </button>
      }
    >
      {isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-card" />
      ) : !businesses || businesses.length === 0 ? (
        <div className="space-y-8">
          <div className="rounded-2xl border border-dashed border-white/10 bg-card/40 p-12 text-center">
            <div className="gradient-brand mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-brand">
              <Building2 className="h-7 w-7" />
            </div>
            <h3 className="font-display text-lg font-bold">No Business Passport yet</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              A Business Passport is your verified profile on CoFund with branding, reporting, docs, trust signals, and funding history.
            </p>
          </div>

          <section className="grid gap-5 md:grid-cols-3">
            {[
              { icon: Building2, color: "text-primary bg-primary/10", title: "Business Passport", desc: "Logo, story, products, team and operating footprint." },
              { icon: ShieldCheck, color: "text-brand-green bg-brand-green/10", title: "Trust Score", desc: "Verification, reporting, recovery response, and milestones build your score." },
              { icon: Coins, color: "text-gold bg-gold/10", title: "Funding Rounds", desc: "Create and manage rounds with escrow protection and monitoring." },
            ].map((card) => (
              <div key={card.title} className="rounded-2xl border border-white/[0.06] bg-card p-6">
                <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${card.color}`}>
                  <card.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-base font-bold">{card.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{card.desc}</p>
              </div>
            ))}
          </section>
        </div>
      ) : (
        <div className="space-y-8">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {businesses.map((business: any) => (
              <article key={business.id} className="overflow-hidden rounded-2xl border border-white/[0.06] bg-card">
                {business.cover_url ? (
                  <img src={business.cover_url} alt="" className="aspect-[16/8] w-full object-cover" />
                ) : (
                  <div className="gradient-mesh aspect-[16/8] w-full" />
                )}
                <div className="p-5">
                  <div className="flex items-center gap-3">
                    {business.logo_url ? (
                      <img src={business.logo_url} alt="" className="-mt-10 h-12 w-12 rounded-xl border-2 border-card object-cover" />
                    ) : (
                      <div className="gradient-brand -mt-10 flex h-12 w-12 items-center justify-center rounded-xl border-2 border-card text-white">
                        <Building2 className="h-5 w-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="truncate font-display text-base font-bold">{business.name}</h3>
                      <p className="truncate text-xs text-muted-foreground">{business.industry}</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                    <Mini label="Trust" value={business.trust_score ?? "-"} />
                    <Mini label="Followers" value={business.followers_count ?? 0} />
                    <Mini label="Founded" value={business.founded_year ?? "-"} />
                  </div>
                  {business.slug && (
                    <Link
                      to="/business/$slug"
                      params={{ slug: business.slug }}
                      className="mt-4 inline-flex rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground"
                    >
                      Open passport
                    </Link>
                  )}
                </div>
              </article>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-white/[0.06] bg-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FolderOpen className="h-5 w-5 text-primary" />
                  <div>
                    <h2 className="font-display text-xl font-bold">KYB document room</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Upload CAC docs, TIN records, board resolutions, shareholder registers, and UBO evidence into private storage with signed access links.
                    </p>
                  </div>
                </div>
                {primaryEntity?.id ? (
                  <DocumentUploadDialog
                    buttonLabel="Upload KYB document"
                    title="Upload a KYB document"
                    description="Files are stored privately in Supabase Storage and opened through short-lived signed URLs."
                    documentTypes={entityDocumentTypes}
                    onSubmit={async (payload) => uploadEntityDocument.mutateAsync(payload)}
                  />
                ) : null}
              </div>

              <div className="mt-4 rounded-2xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                {primaryEntity
                  ? `Primary entity: ${primaryEntity.legal_name} (${primaryEntity.registration_number})`
                  : "No verified business entity is linked yet. Add one during onboarding or from the admin verification workflow first."}
              </div>

              <div className="mt-4 grid gap-3">
                {!entityDocuments.length ? (
                  ["CAC Certificate", "TIN / Tax ID proof", "Board resolution", "Shareholder register", "UBO evidence"].map((item) => (
                    <div key={item} className="rounded-xl border border-dashed border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                      Missing: {item}
                    </div>
                  ))
                ) : (
                  entityDocuments.map((doc) => (
                    <div key={doc.id} className="rounded-xl border border-border bg-background px-4 py-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{doc.title}</p>
                          <p className="text-sm text-muted-foreground">{doc.document_type}</p>
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
            </section>

            <section className="rounded-2xl border border-white/[0.06] bg-card p-6">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-primary" />
                <h2 className="font-display text-xl font-bold">Reporting and offering ops</h2>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Businesses should manage milestones, issuer updates, financial reports, and offering documents from one governed workflow.
              </p>
              <div className="mt-4 grid gap-3">
                {[
                  "Milestone evidence uploads",
                  "Monthly or quarterly financial reporting",
                  "Investor update posts and funding notices",
                  "Round-state history and release workflow",
                ].map((item) => (
                  <div key={item} className="rounded-xl border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                    {item}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}
    </PageShell>
  );
}

function Mini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-base font-bold">{value}</p>
    </div>
  );
}
