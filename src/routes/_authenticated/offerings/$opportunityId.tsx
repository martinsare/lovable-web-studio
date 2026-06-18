import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Building2,
  Clock,
  ExternalLink,
  FileText,
  History,
  MessageCircle,
  ShieldCheck,
  TrendingUp,
  Upload,
  Zap,
} from "lucide-react";
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
import { formatMoney } from "@/lib/investment-checkout";
import { createNotifications } from "@/lib/notifications";

export const Route = createFileRoute("/_authenticated/offerings/$opportunityId")({
  head: () => ({ meta: [{ title: "Offering Room - CoFund" }] }),
  component: OfferingRoomPage,
});

type Tab = "overview" | "documents" | "updates" | "timeline";

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
  const [tab, setTab] = useState<Tab>("overview");
  const [updateTitle, setUpdateTitle] = useState("");
  const [updateBody, setUpdateBody] = useState("");
  const [notice, setNotice] = useState<{ tone: "success" | "error"; title: string; message: string } | null>(null);

  const { data: opportunity } = useQuery({
    queryKey: ["offering-room", "opportunity", opportunityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("opportunities")
        .select(
          "id,title,summary,goal_amount,raised_amount,target_return_pct,round_state,risk_level,instrument_type,minimum_investment,duration_days,businesses(name,industry,owner_id)",
        )
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
        .select(
          "id,title,document_type,file_url,description,visibility,status,version_label,storage_bucket,storage_path,original_filename,mime_type,file_size,uploaded_at,created_at",
        )
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
      const { data: admins } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      await createNotifications(
        (admins ?? []).map((admin) => ({
          userId: admin.user_id,
          category: "document_upload",
          title: "New offering document uploaded",
          body: `${opportunity.title} received a new ${payload.documentType.toLowerCase()} for review.`,
          actionLabel: "Open admin",
          actionHref: "/admin",
          metadata: { opportunity_id: opportunity.id, document_type: payload.documentType },
        })),
      );
    },
    onSuccess: async () => {
      setNotice({ tone: "success", title: "Document uploaded", message: "Offering document uploaded securely." });
      await queryClient.invalidateQueries({ queryKey: ["offering-room", "documents", opportunityId] });
    },
    onError: (error: any) => setNotice({ tone: "error", title: "Upload failed", message: error?.message ?? "Unable to upload that offering document." }),
  });

  const publishUpdate = useMutation({
    mutationFn: async () => {
      if (!user?.id || !opportunity?.id)
        throw new Error("Sign in again before publishing updates.");
      if (!updateTitle.trim() || !updateBody.trim())
        throw new Error("Add both a title and body for the issuer update.");
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
      const uniqueInvestorIds = [
        ...new Set(
          (investors ?? []).map((item: any) => item.user_id).filter(Boolean),
        ),
      ];
      await createNotifications(
        uniqueInvestorIds.map((userId) => ({
          userId,
          category: "issuer_update",
          title: `New update from ${opportunity.businesses?.name ?? "a business"}`,
          body: updateTitle.trim(),
          actionLabel: "Read update",
          actionHref: `/offerings/${opportunity.id}`,
          metadata: { opportunity_id: opportunity.id, kind: "issuer_update" },
        })),
      );
    },
    onSuccess: async () => {
      setNotice({ tone: "success", title: "Update published", message: "Issuer update published and investors notified." });
      setUpdateTitle("");
      setUpdateBody("");
      await queryClient.invalidateQueries({ queryKey: ["offering-room", "updates", opportunityId] });
    },
    onError: (error: any) => setNotice({ tone: "error", title: "Publish failed", message: error?.message ?? "Unable to publish that issuer update." }),
  });

  async function openDocument(doc: any) {
    try {
      const directUrl =
        typeof doc.file_url === "string" && /^https?:\/\//.test(doc.file_url)
          ? doc.file_url
          : null;
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
    } catch (error: any) {
      setNotice({ tone: "error", title: "Open failed", message: error?.message ?? "Unable to open that document right now." });
    }
  }

  if (!opportunity) {
    return (
      <AppLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="space-y-4 text-center">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 w-48 animate-pulse rounded-full bg-secondary mx-auto" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  const canUpload =
    roles.includes("admin") || opportunity.businesses?.owner_id === user?.id;

  const raised = Number(opportunity.raised_amount ?? 0);
  const goal = Number(opportunity.goal_amount ?? 1);
  const pct = Math.min(100, Math.round((raised / goal) * 100));
  const roundState = String(opportunity.round_state ?? "draft");
  const isLive = roundState === "open" || roundState === "live";

  const tabs: { key: Tab; label: string; icon: ReactNode; badge?: number }[] = [
    { key: "overview", label: "Overview", icon: <BookOpen className="h-3.5 w-3.5" /> },
    { key: "documents", label: "Documents", icon: <FileText className="h-3.5 w-3.5" />, badge: documents.length || undefined },
    { key: "updates", label: "Updates", icon: <MessageCircle className="h-3.5 w-3.5" />, badge: updates.length || undefined },
    { key: "timeline", label: "Timeline", icon: <History className="h-3.5 w-3.5" />, badge: roundEvents.length || undefined },
  ];

  return (
    <AppLayout>
      <div className="min-h-full bg-background">
        {notice && (
          <div className="border-b border-border/60 bg-background/95 px-4 py-4 backdrop-blur-xl sm:px-6 lg:px-8">
            <div className="mx-auto max-w-6xl">
              <Alert variant={notice.tone === "error" ? "destructive" : "default"}>
                <AlertTitle>{notice.title}</AlertTitle>
                <AlertDescription>{notice.message}</AlertDescription>
              </Alert>
            </div>
          </div>
        )}

        {/* ── Sticky top bar ── */}
        <div className="sticky top-0 z-20 border-b border-border/60 bg-background/90 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
            <Link
              to="/browse"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> Browse
            </Link>
            <p className="hidden truncate text-sm font-semibold text-muted-foreground sm:block">
              {opportunity.businesses?.name} · {opportunity.title}
            </p>
            <div className="flex shrink-0 items-center gap-2">
              {canUpload && (
                <DocumentUploadDialog
                  buttonLabel="Upload"
                  title="Upload offering document"
                  description="Files stay private and are opened with short-lived signed URLs."
                  documentTypes={offeringDocumentTypes}
                  visibilityOptions={[
                    { label: "Investors only", value: "investors" },
                    { label: "Internal review", value: "internal" },
                    { label: "Public summary", value: "public" },
                  ]}
                  includeVersionLabel
                  onSubmit={async (payload) => uploadDocument.mutateAsync(payload)}
                />
              )}
              <Link
                to="/invest/$opportunityId"
                params={{ opportunityId }}
                className="inline-flex items-center gap-1.5 rounded-xl gradient-brand px-4 py-2 text-sm font-bold text-primary-foreground shadow-brand transition hover:opacity-90"
              >
                Invest now <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* ── Hero ── */}
        <div className="relative overflow-hidden border-b border-border/40">
          <div className="absolute inset-0 gradient-hero" />
          <div className="absolute right-0 top-0 h-80 w-96 bg-[radial-gradient(ellipse_at_top_right,oklch(0.65_0.18_160/0.08)_0%,transparent_70%)]" />
          <div className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">

            {/* Business identity row */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl gradient-brand shadow-brand">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  {opportunity.businesses?.industry ?? "Private round"}
                </p>
                <p className="text-sm font-bold">{opportunity.businesses?.name}</p>
              </div>
              <div className="ml-2">
                {isLive ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-green/15 px-2.5 py-1 text-[11px] font-bold text-brand-green">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-green animate-pulse" />
                    Live
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold text-muted-foreground capitalize">
                    {roundState.replaceAll("_", " ")}
                  </span>
                )}
              </div>
            </div>

            {/* Title + summary */}
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl max-w-2xl">
              {opportunity.title}
            </h1>
            {opportunity.summary && (
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                {opportunity.summary}
              </p>
            )}

            {/* Key stats row */}
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatPill
                icon={<TrendingUp className="h-3.5 w-3.5" />}
                label="Target return"
                value={opportunity.target_return_pct ? `${opportunity.target_return_pct}% p.a.` : "—"}
                highlight
              />
              <StatPill
                icon={<Zap className="h-3.5 w-3.5" />}
                label="Funding goal"
                value={formatMoney(goal)}
              />
              <StatPill
                icon={<ArrowRight className="h-3.5 w-3.5" />}
                label="Min. ticket"
                value={opportunity.minimum_investment ? formatMoney(Number(opportunity.minimum_investment)) : "—"}
              />
              <StatPill
                icon={<Clock className="h-3.5 w-3.5" />}
                label="Duration"
                value={opportunity.duration_days ? `${opportunity.duration_days} days` : "—"}
              />
            </div>

            {/* Funding progress */}
            <div className="mt-6 max-w-lg">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-bold text-primary">{pct}% funded</span>
                <span className="text-muted-foreground">
                  {raised >= 1_000_000
                    ? `₦${(raised / 1_000_000).toFixed(1)}M`
                    : `₦${raised.toLocaleString()}`}{" "}
                  raised
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary/80">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${pct >= 75 ? "gradient-brand" : "bg-primary/70"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Tab bar */}
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex gap-0 overflow-x-auto scrollbar-hide">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`flex shrink-0 items-center gap-2 border-b-2 px-5 py-3.5 text-sm font-semibold transition-colors ${
                    tab === t.key
                      ? "border-primary text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.icon}
                  {t.label}
                  {t.badge !== undefined && (
                    <span className="rounded-full bg-secondary px-1.5 py-0.5 text-[10px] font-bold tabular-nums">
                      {t.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tab content ── */}
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          {tab === "overview" && (
            <OverviewTab opportunity={opportunity} />
          )}
          {tab === "documents" && (
            <DocumentsTab
              documents={documents}
              canUpload={canUpload}
              opportunityId={opportunityId}
              uploadDocument={uploadDocument}
              openDocument={openDocument}
            />
          )}
          {tab === "updates" && (
            <UpdatesTab
              updates={updates}
              canUpload={canUpload}
              updateTitle={updateTitle}
              updateBody={updateBody}
              setUpdateTitle={setUpdateTitle}
              setUpdateBody={setUpdateBody}
              publishUpdate={publishUpdate}
            />
          )}
          {tab === "timeline" && (
            <TimelineTab roundEvents={roundEvents} />
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function StatPill({
  icon,
  label,
  value,
  highlight,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3.5 ${
        highlight
          ? "border-primary/20 bg-primary/5"
          : "border-border/60 bg-card/60 backdrop-blur-sm"
      }`}
    >
      <div className={`flex items-center gap-1.5 ${highlight ? "text-primary" : "text-muted-foreground"}`}>
        {icon}
        <p className="text-[10px] font-semibold uppercase tracking-wider">{label}</p>
      </div>
      <p className={`mt-1.5 font-display text-xl font-bold ${highlight ? "text-primary" : "text-foreground"}`}>
        {value}
      </p>
    </div>
  );
}

function OverviewTab({ opportunity }: { opportunity: any }) {
  const details = [
    { label: "Business", value: opportunity.businesses?.name ?? "—" },
    { label: "Industry", value: opportunity.businesses?.industry ?? "—" },
    { label: "Instrument", value: opportunity.instrument_type ?? "Structured private investment" },
    { label: "Risk level", value: opportunity.risk_level ?? "To be assigned" },
    { label: "Round state", value: String(opportunity.round_state ?? "draft").replaceAll("_", " ") },
    { label: "Duration", value: opportunity.duration_days ? `${opportunity.duration_days} days` : "To be assigned" },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <div className="space-y-6">
        {opportunity.summary && (
          <section className="rounded-3xl border border-border bg-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-4 w-4 text-primary" />
              <h2 className="font-display text-lg font-bold">About this opportunity</h2>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{opportunity.summary}</p>
          </section>
        )}

        <section className="rounded-3xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h2 className="font-display text-lg font-bold">Trust & compliance</h2>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            CoFund centralises all disclosures, legal documents, audit summaries, milestone
            evidence, and investor-facing status changes in one offering room — not scattered
            across posts. Navigate to Documents to review filed materials.
          </p>
        </section>
      </div>

      <aside>
        <div className="rounded-3xl border border-border bg-card p-6">
          <h2 className="font-display text-base font-bold mb-4">Round details</h2>
          <div className="space-y-2.5">
            {details.map(({ label, value }) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 rounded-xl bg-background px-3.5 py-2.5 text-sm"
              >
                <span className="text-muted-foreground">{label}</span>
                <span className="font-semibold capitalize text-right">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}

function DocumentsTab({
  documents,
  canUpload,
  opportunityId,
  uploadDocument,
  openDocument,
}: {
  documents: any[];
  canUpload: boolean;
  opportunityId: string;
  uploadDocument: any;
  openDocument: (doc: any) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-bold">Document centre</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {documents.length ? `${documents.length} filed document${documents.length > 1 ? "s" : ""}` : "No documents yet"}
          </p>
        </div>
        {canUpload && (
          <DocumentUploadDialog
            buttonLabel="Upload document"
            title="Upload offering document"
            description="Files stay private in storage and are opened with short-lived signed URLs for eligible investors, founders, and admins."
            documentTypes={[
              "Term sheet",
              "Pitch deck",
              "Financial statements",
              "Risk disclosure",
              "Legal agreement",
              "Milestone evidence",
              "Valuation memo",
              "Cap table extract",
              "General update attachment",
            ]}
            visibilityOptions={[
              { label: "Investors only", value: "investors" },
              { label: "Internal review", value: "internal" },
              { label: "Public summary", value: "public" },
            ]}
            includeVersionLabel
            onSubmit={async (payload) => uploadDocument.mutateAsync(payload)}
          />
        )}
      </div>

      {!documents.length ? (
        <EmptySection
          icon={<FileText className="h-6 w-6" />}
          title="No documents yet"
          hint="Term sheets, pitch decks, financial statements, risk disclosures and signed agreements will appear here once filed."
        />
      ) : (
        <div className="grid gap-3">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card px-5 py-4 transition hover:border-primary/20"
            >
              <div className="flex items-start gap-4">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <FileText className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{doc.title}</p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {doc.document_type}
                    {doc.version_label ? ` · ${doc.version_label}` : ""}
                    {doc.visibility ? ` · ${doc.visibility}` : ""}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {String(doc.status).replaceAll("_", " ")}
                    {doc.file_size ? ` · ${formatDocumentSize(Number(doc.file_size))}` : ""}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void openDocument(doc)}
                className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2 text-sm font-semibold text-muted-foreground transition hover:border-primary/30 hover:text-foreground"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UpdatesTab({
  updates,
  canUpload,
  updateTitle,
  updateBody,
  setUpdateTitle,
  setUpdateBody,
  publishUpdate,
}: {
  updates: any[];
  canUpload: boolean;
  updateTitle: string;
  updateBody: string;
  setUpdateTitle: (v: string) => void;
  setUpdateBody: (v: string) => void;
  publishUpdate: any;
}) {
  return (
    <div className="space-y-6">
      {canUpload && (
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Upload className="h-4 w-4 text-primary" />
            <h2 className="font-display text-base font-bold">Post issuer update</h2>
          </div>
          <div className="space-y-3">
            <input
              value={updateTitle}
              onChange={(e) => setUpdateTitle(e.target.value)}
              placeholder="e.g. Q2 trading update"
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary/60 placeholder:text-muted-foreground/50"
            />
            <textarea
              value={updateBody}
              onChange={(e) => setUpdateBody(e.target.value)}
              placeholder="Share milestone progress, funding notices, and anything investors should know…"
              rows={4}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary/60 placeholder:text-muted-foreground/50 resize-none"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => void publishUpdate.mutateAsync()}
                disabled={publishUpdate.isPending || !updateTitle.trim() || !updateBody.trim()}
                className="rounded-xl gradient-brand px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-brand transition hover:opacity-90 disabled:opacity-40"
              >
                {publishUpdate.isPending ? "Publishing…" : "Publish update"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="font-display text-lg font-bold mb-4">
          {updates.length ? `${updates.length} update${updates.length > 1 ? "s" : ""}` : "Issuer updates"}
        </h2>
        {!updates.length ? (
          <EmptySection
            icon={<MessageCircle className="h-6 w-6" />}
            title="No updates yet"
            hint="Issuers post milestone progress, funding notices and anything investors should know directly here."
          />
        ) : (
          <div className="space-y-3">
            {updates.map((update) => (
              <div key={update.id} className="rounded-2xl border border-border bg-card px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <p className="font-semibold">{update.title}</p>
                  <time className="shrink-0 text-xs text-muted-foreground">
                    {new Date(update.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                  </time>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{update.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TimelineTab({ roundEvents }: { roundEvents: any[] }) {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-bold">Round lifecycle</h2>
      {!roundEvents.length ? (
        <EmptySection
          icon={<History className="h-6 w-6" />}
          title="No events yet"
          hint="State transitions — live, funded, escrowed, closed, released — are logged here as the round progresses."
        />
      ) : (
        <div className="relative space-y-0">
          {roundEvents.map((event, i) => (
            <div key={event.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 ring-4 ring-background">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
                {i < roundEvents.length - 1 && (
                  <div className="w-px flex-1 bg-border/60 my-1" />
                )}
              </div>
              <div className={`pb-6 ${i === roundEvents.length - 1 ? "pb-0" : ""}`}>
                <p className="font-semibold capitalize leading-none mt-1.5">
                  {String(event.round_state).replaceAll("_", " ")}
                </p>
                {event.note && (
                  <p className="mt-1.5 text-sm text-muted-foreground">{event.note}</p>
                )}
                <time className="mt-1 block text-xs text-muted-foreground">
                  {new Date(event.created_at).toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </time>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptySection({
  icon,
  title,
  hint,
}: {
  icon: ReactNode;
  title: string;
  hint: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/60 bg-card/40 px-8 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground/50">
        {icon}
      </div>
      <p className="font-display text-base font-semibold">{title}</p>
      <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">{hint}</p>
    </div>
  );
}
