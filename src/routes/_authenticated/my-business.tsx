import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  Camera,
  CheckCircle2,
  Circle,
  ClipboardList,
  Coins,
  ExternalLink,
  FileText,
  FolderOpen,
  Plus,
  ShieldCheck,
  Star,
  Upload,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { DocumentUploadDialog } from "@/components/document-upload-dialog";
import { AppLayout } from "@/components/app-layout";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import {
  DOCUMENT_BUCKETS,
  formatDocumentSize,
  getDocumentSignedUrl,
  uploadDocumentFile,
} from "@/lib/document-storage";
import { createNotifications } from "@/lib/notifications";

export const Route = createFileRoute("/_authenticated/my-business")({
  head: () => ({ meta: [{ title: "My Business · CoFund" }] }),
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

const KYB_REQUIRED = [
  "CAC Certificate",
  "TIN / Tax ID proof",
  "Board resolution",
  "Shareholder register",
  "UBO evidence",
];

const REPORTING_ITEMS = [
  "Milestone evidence uploads",
  "Monthly or quarterly financial reporting",
  "Investor update posts and funding notices",
  "Round-state history and release workflow",
];

function MyBusiness() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  async function uploadBusinessImage(
    file: File,
    businessId: string,
    field: "logo_url" | "cover_url",
    setUploading: (v: boolean) => void,
  ) {
    if (file.size > 10 * 1024 * 1024) { toast.error("Image must be under 10 MB."); return; }
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Upload a JPG, PNG, or WebP image.");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${businessId}/${field.replace("_url", "")}-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("business-media")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadErr) throw uploadErr;
      const { data: { publicUrl } } = supabase.storage.from("business-media").getPublicUrl(path);
      const { error: updateErr } = await supabase
        .from("businesses")
        .update({ [field]: publicUrl })
        .eq("id", businessId);
      if (updateErr) throw updateErr;
      await queryClient.invalidateQueries({ queryKey: ["my-business", user?.id] });
      toast.success(`${field === "logo_url" ? "Logo" : "Cover image"} updated.`);
    } catch (err: any) {
      toast.error(err?.message ?? "Could not upload image.");
    } finally {
      setUploading(false);
    }
  }

  const { data: businesses, isLoading } = useQuery({
    enabled: !!user,
    queryKey: ["my-business", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select(
          "id,slug,name,industry,tagline,logo_url,cover_url,verified,trust_score,followers_count,founded_year",
        )
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
        .select(
          "id,title,document_type,status,description,file_url,storage_bucket,storage_path,original_filename,mime_type,file_size,uploaded_at,created_at",
        )
        .eq("business_entity_id", primaryEntity.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const uploadEntityDocument = useMutation({
    mutationFn: async (payload: {
      title: string;
      documentType: string;
      description: string;
      file: File;
    }) => {
      if (!primaryEntity?.id)
        throw new Error(
          "Create or connect a verified business entity before uploading KYB documents.",
        );
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
          metadata: { entity_id: primaryEntity.id, document_type: payload.documentType },
        })),
      );
    },
    onSuccess: async () => {
      toast.success("KYB document uploaded securely.");
      await queryClient.invalidateQueries({ queryKey: ["my-business-entity-docs", primaryEntity?.id] });
    },
    onError: (e: any) => toast.error(e?.message ?? "We couldn't upload that document."),
  });

  async function openDocument(doc: any) {
    try {
      const directUrl =
        typeof doc.file_url === "string" && /^https?:\/\//.test(doc.file_url) ? doc.file_url : null;
      const signedUrl =
        doc.storage_bucket && doc.storage_path
          ? await getDocumentSignedUrl(
              doc.storage_bucket,
              doc.storage_path,
              doc.original_filename ?? doc.title,
            )
          : directUrl;
      if (!signedUrl) throw new Error("This document does not have a stored file yet.");
      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      toast.error(e?.message ?? "Unable to open that document.");
    }
  }

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-full bg-background">
          <div className="h-64 animate-pulse bg-secondary" />
          <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="h-32 animate-pulse rounded-2xl bg-card" />
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!businesses || businesses.length === 0) {
    return (
      <AppLayout>
        <div className="min-h-full bg-background">
          <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 text-center">
            <div className="gradient-brand mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl text-primary-foreground shadow-brand">
              <Building2 className="h-10 w-10" />
            </div>
            <h1 className="font-display text-3xl font-bold">Start your Business Passport</h1>
            <p className="mt-4 text-base text-muted-foreground max-w-md mx-auto leading-relaxed">
              Your Business Passport is a verified profile on CoFund — with branding, reporting, docs,
              trust signals, and funding history in one place.
            </p>
            <button
              type="button"
              className="mt-8 inline-flex items-center gap-2 gradient-brand rounded-2xl px-8 py-4 font-bold text-primary-foreground shadow-brand"
            >
              <Plus className="h-5 w-5" /> Register your business
            </button>

            <div className="mt-16 grid gap-5 sm:grid-cols-3 text-left">
              {[
                {
                  icon: Building2,
                  color: "text-primary bg-primary/10",
                  title: "Business Passport",
                  desc: "Logo, story, products, team and operating footprint.",
                },
                {
                  icon: ShieldCheck,
                  color: "text-brand-green bg-brand-green/10",
                  title: "Trust Score",
                  desc: "Verification, reporting, and milestones build your credibility.",
                },
                {
                  icon: Coins,
                  color: "text-gold bg-gold/10",
                  title: "Funding Rounds",
                  desc: "Create and manage rounds with escrow protection.",
                },
              ].map((card) => (
                <div key={card.title} className="rounded-2xl border border-border bg-card p-5">
                  <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${card.color}`}>
                    <card.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-sm font-bold">{card.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const primary = businesses[0] as any;
  const uploadedTypes = new Set(entityDocuments.map((d: any) => d.document_type.toLowerCase()));

  return (
    <AppLayout>
      <div className="min-h-full bg-background pb-16">
        {/* Business passport header */}
        {businesses.map((business: any) => (
          <div key={business.id} className="relative">
            {/* Hidden file inputs */}
            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadBusinessImage(f, business.id, "cover_url", setUploadingCover);
                if (coverInputRef.current) coverInputRef.current.value = "";
              }}
            />
            <input
              ref={logoInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadBusinessImage(f, business.id, "logo_url", setUploadingLogo);
                if (logoInputRef.current) logoInputRef.current.value = "";
              }}
            />

            {/* Cover image */}
            <div className="relative h-48 overflow-hidden sm:h-64">
              {business.cover_url ? (
                <img src={business.cover_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full gradient-mesh" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={uploadingCover}
                className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-black/40 px-3 py-2 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-black/60 disabled:opacity-60"
              >
                <Camera className="h-3.5 w-3.5" />
                {uploadingCover ? "Uploading…" : "Change cover"}
              </button>
            </div>

            {/* Business identity bar */}
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
              <div className="relative -mt-12 flex flex-wrap items-end gap-5 pb-6 border-b border-border">
                {/* Logo with upload overlay */}
                <div className="relative shrink-0">
                  {business.logo_url ? (
                    <img
                      src={business.logo_url}
                      alt=""
                      className="h-20 w-20 rounded-2xl border-4 border-background object-cover shadow-elevated"
                    />
                  ) : (
                    <div className="gradient-brand flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-background shadow-elevated text-primary-foreground">
                      <Building2 className="h-9 w-9" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-foreground text-background shadow-elevated transition hover:bg-foreground/80 disabled:opacity-60"
                    title="Change logo"
                  >
                    {uploadingLogo ? (
                      <span className="h-3 w-3 animate-spin rounded-full border-2 border-background border-t-transparent" />
                    ) : (
                      <Camera className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="font-display text-2xl font-bold">{business.name}</h1>
                    {business.verified && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-green/10 px-2.5 py-1 text-xs font-bold text-brand-green">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5">{business.industry}</p>
                  {business.tagline && (
                    <p className="mt-1 text-sm text-foreground/80">{business.tagline}</p>
                  )}
                </div>

                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-center">
                    <p className="font-display text-xl font-bold">{business.trust_score ?? "—"}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Trust</p>
                  </div>
                  <div className="text-center">
                    <p className="font-display text-xl font-bold">{business.followers_count ?? 0}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Followers</p>
                  </div>
                  <div className="text-center">
                    <p className="font-display text-xl font-bold">{business.founded_year ?? "—"}</p>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Founded</p>
                  </div>
                  {business.slug && (
                    <Link
                      to="/business/$slug"
                      params={{ slug: business.slug }}
                      className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground hover:text-foreground transition"
                    >
                      Public view <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
          {/* KYB status */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold">KYB verification status</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {primaryEntity
                      ? `${primaryEntity.legal_name} · ${primaryEntity.registration_number}`
                      : "No verified entity linked yet"}
                  </p>
                </div>
              </div>
              {primaryEntity && (
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${
                  primaryEntity.verification_status === "verified"
                    ? "bg-brand-green/10 text-brand-green"
                    : "bg-amber-400/10 text-amber-400"
                }`}>
                  {String(primaryEntity.verification_status ?? "pending").replaceAll("_", " ")}
                </span>
              )}
            </div>
            <div className="divide-y divide-border">
              {KYB_REQUIRED.map((item) => {
                const done = uploadedTypes.has(item.toLowerCase());
                return (
                  <div key={item} className="flex items-center gap-4 px-6 py-3.5">
                    {done
                      ? <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-green" />
                      : <Circle className="h-4 w-4 shrink-0 text-muted-foreground/30" />}
                    <p className={`flex-1 text-sm ${done ? "text-foreground" : "text-muted-foreground"}`}>
                      {item}
                    </p>
                    <span className={`text-xs font-bold ${done ? "text-brand-green" : "text-muted-foreground"}`}>
                      {done ? "Uploaded" : "Missing"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* KYB document room */}
            <section>
              <div className="flex items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-2.5">
                  <FolderOpen className="h-5 w-5 text-primary" />
                  <h2 className="font-display text-base font-bold">Document room</h2>
                </div>
                {primaryEntity?.id && (
                  <DocumentUploadDialog
                    buttonLabel="Upload"
                    title="Upload a KYB document"
                    description="Files are stored privately in Supabase Storage with signed access links."
                    documentTypes={entityDocumentTypes}
                    onSubmit={async (payload) => uploadEntityDocument.mutateAsync(payload)}
                  />
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                CAC certificates, TIN records, board resolutions, shareholder registers, and UBO evidence — all in private storage with signed access.
              </p>

              {!primaryEntity ? (
                <div className="rounded-xl border border-dashed border-border py-10 text-center">
                  <Upload className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm font-semibold">No entity linked</p>
                  <p className="mt-1.5 text-xs text-muted-foreground max-w-xs mx-auto">
                    Add a verified business entity during onboarding or the admin verification workflow first.
                  </p>
                </div>
              ) : entityDocuments.length === 0 ? (
                <div className="space-y-2">
                  {KYB_REQUIRED.map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground">
                      <Circle className="h-3.5 w-3.5 shrink-0" />
                      {item}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-border/60 rounded-2xl border border-border overflow-hidden">
                  {entityDocuments.map((doc: any) => (
                    <div key={doc.id} className="flex items-center gap-4 bg-card px-5 py-4">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-muted-foreground">
                        <FileText className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{doc.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {doc.document_type} · {formatDocumentSize(Number(doc.file_size ?? 0))} ·{" "}
                          <span className="capitalize">{String(doc.status).replaceAll("_", " ")}</span>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void openDocument(doc)}
                        className="shrink-0 flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> Open
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Reporting and ops */}
            <section>
              <div className="flex items-center gap-2.5 mb-5">
                <ClipboardList className="h-5 w-5 text-primary" />
                <h2 className="font-display text-base font-bold">Reporting & offering ops</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
                Manage milestones, issuer updates, financial reports, and offering documents from one governed workflow.
              </p>

              <div className="space-y-2.5">
                {REPORTING_ITEMS.map((item, i) => (
                  <div key={item} className="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-background">
                      <span className="text-[11px] font-bold text-muted-foreground">{i + 1}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{item}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-xl border border-gold/20 bg-gold/5 px-4 py-4">
                <div className="flex items-start gap-3">
                  <Star className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  <div>
                    <p className="text-xs font-bold text-gold">Business Passport benefits</p>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                      Verified businesses unlock milestone-based escrow releases, investor reporting dashboards, and featured placement in Browse.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
