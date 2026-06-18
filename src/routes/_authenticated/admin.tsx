import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Building2, CheckCircle2, CircleDollarSign, ExternalLink, FileCheck2, FileWarning, FolderOpen, ShieldCheck, Users, XCircle } from "lucide-react";
import { PageShell, EmptyState } from "@/components/page-shell";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { DOCUMENT_BUCKETS, formatDocumentSize, getDocumentSignedUrl, uploadDocumentFile } from "@/lib/document-storage";
import { formatMoney } from "@/lib/investment-checkout";
import { createNotification } from "@/lib/notifications";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({ meta: [{ title: "Admin Operations - CoFund" }] }),
  component: AdminOperationsPage,
});

function AdminOperationsPage() {
  const { roles, user } = useAuth();
  if (!roles.includes("admin")) {
    return (
      <PageShell eyebrow="Admin" title="Operations" description="This workspace is only available to compliance and platform administrators.">
        <EmptyState title="Admin access required" hint="Ask an existing admin to grant the admin role before opening this workspace." />
      </PageShell>
    );
  }

  return (
    <PageShell
      eyebrow="Admin"
      title="Operations Console"
      description="Review verification queues, uploaded documents, investor records, reconciliations, and platform audit memory from one place."
      actions={<Link to="/portfolio" className="hidden rounded-xl border border-border px-4 py-2 text-sm font-semibold text-muted-foreground sm:inline-flex">Investor view</Link>}
    >
      <AdminDashboard actorUserId={user?.id ?? null} />
    </PageShell>
  );
}

function AdminDashboard({ actorUserId }: { actorUserId: string | null }) {
  const queryClient = useQueryClient();
  const [statementTitle, setStatementTitle] = useState("");
  const [statementType, setStatementType] = useState("Investment statement");
  const [statementNote, setStatementNote] = useState("");
  const [statementUserId, setStatementUserId] = useState("");
  const [statementCommitmentId, setStatementCommitmentId] = useState("");
  const [statementFile, setStatementFile] = useState<File | null>(null);

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ["admin", "verification-sessions"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("verification_sessions").select("*").order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const { data: entities = [] } = useQuery({
    queryKey: ["admin", "business-entities"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("business_entities").select("id,owner_user_id,legal_name,registration_number,country,verification_status,trust_score,created_at").order("created_at", { ascending: false }).limit(12);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const { data: ubos = [] } = useQuery({
    queryKey: ["admin", "ubo-records"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("ubo_records").select("id,business_entity_id,full_name,role_title,ownership_percent,verification_status").order("created_at", { ascending: false }).limit(12);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const { data: commitments = [] } = useQuery({
    queryKey: ["admin", "commitments"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("investment_commitments").select("id,user_id,amount,currency,rail,status,escrow_reference,created_at").order("created_at", { ascending: false }).limit(40);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const { data: reconciliationEvents = [] } = useQuery({
    queryKey: ["admin", "reconciliation-events"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("payment_reconciliation_events").select("*").order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const { data: auditEvents = [] } = useQuery({
    queryKey: ["admin", "audit-events"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("admin_audit_events").select("*").order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const { data: entityDocs = [] } = useQuery({
    queryKey: ["admin", "entity-documents"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("business_entity_documents").select("id,business_entity_id,uploader_user_id,title,document_type,status,description,storage_bucket,storage_path,original_filename,file_size,review_note,created_at").order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const { data: offeringDocs = [] } = useQuery({
    queryKey: ["admin", "offering-documents"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("offering_documents").select("id,opportunity_id,uploader_user_id,title,document_type,visibility,status,version_label,storage_bucket,storage_path,original_filename,file_size,review_note,created_at").order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const { data: statements = [] } = useQuery({
    queryKey: ["admin", "investor-statements"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("investor_statements").select("*").order("created_at", { ascending: false }).limit(20);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  const pendingDocuments = useMemo(() => [...entityDocs, ...offeringDocs].filter((doc) => ["draft", "uploaded"].includes(doc.status)), [entityDocs, offeringDocs]);

  async function logAudit(payload: { targetTable: string; targetId?: string | null; action: string; severity?: string; note: string; suspicious?: boolean; metadata?: Record<string, unknown> }) {
    if (!actorUserId) return;
    await (supabase as any).from("admin_audit_events").insert({
      actor_user_id: actorUserId,
      target_table: payload.targetTable,
      target_id: payload.targetId ?? null,
      action: payload.action,
      severity: payload.severity ?? "info",
      note: payload.note,
      suspicious: payload.suspicious ?? false,
      metadata: payload.metadata ?? {},
    });
  }

  async function openStoredDocument(doc: any) {
    try {
      const signedUrl = doc.storage_bucket && doc.storage_path ? await getDocumentSignedUrl(doc.storage_bucket, doc.storage_path, doc.original_filename ?? doc.title) : null;
      if (!signedUrl) throw new Error("This document is missing its stored file.");
      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } catch (error: any) {
      toast.error(error?.message ?? "Unable to open that document.");
    }
  }

  async function applyVerificationStatus(session: any, status: "approved" | "needs_action" | "rejected") {
    const { error } = await (supabase as any)
      .from("verification_sessions")
      .update({
        status,
        response_payload: { ...(session.response_payload ?? {}), reviewed_from: "admin_console", reviewed_at: new Date().toISOString() },
      })
      .eq("id", session.id);
    if (error) return toast.error(error.message);

    if (session.subject_type === "business_entity" && session.business_entity_id) {
      await (supabase as any).from("business_entities").update({ verification_status: status }).eq("id", session.business_entity_id);
    }
    if (session.subject_type === "beneficial_owner" && session.ubo_record_id) {
      await (supabase as any).from("ubo_records").update({ verification_status: status }).eq("id", session.ubo_record_id);
    }
    if (session.subject_type === "individual_investor") {
      const { data: profile } = await supabase.from("profiles").select("metadata").eq("id", session.user_id).maybeSingle();
      const metadata = profile?.metadata && typeof profile.metadata === "object" && !Array.isArray(profile.metadata) ? { ...(profile.metadata as Record<string, unknown>) } : {};
      const compliance = metadata.compliance && typeof metadata.compliance === "object" && !Array.isArray(metadata.compliance) ? { ...(metadata.compliance as Record<string, unknown>) } : {};
      await supabase.from("profiles").update({ metadata: { ...metadata, compliance: { ...compliance, status, reviewed_from: "admin_console", reviewed_at: new Date().toISOString() } } }).eq("id", session.user_id);
    }

    await createNotification({
      userId: session.user_id,
      category: "verification_review",
      title: `Verification ${status.replaceAll("_", " ")}`,
      body: `Your ${session.subject_type.replaceAll("_", " ")} review was marked ${status.replaceAll("_", " ")} by CoFund operations.`,
      actionLabel: "Open security",
      actionHref: "/security",
      metadata: { session_id: session.id, subject_type: session.subject_type, status },
    });

    await logAudit({
      targetTable: "verification_sessions",
      targetId: session.id,
      action: `verification_${status}`,
      severity: status === "rejected" ? "warning" : "info",
      note: `Verification session ${session.provider_session_id} marked ${status}.`,
      suspicious: status === "rejected",
    });

    toast.success(`Verification session marked ${status.replace("_", " ")}`);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin", "verification-sessions"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "business-entities"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "ubo-records"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "audit-events"] }),
      queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count", session.user_id] }),
    ]);
  }

  async function reviewDocument(table: "business_entity_documents" | "offering_documents" | "investor_statements", doc: any, status: "approved" | "rejected") {
    const reviewNote = status === "approved" ? "Reviewed and approved from admin console." : "Reviewed and rejected from admin console.";
    const { error } = await (supabase as any)
      .from(table)
      .update({ status, reviewed_by: actorUserId, reviewed_at: new Date().toISOString(), review_note: reviewNote })
      .eq("id", doc.id);
    if (error) return toast.error(error.message);

    const recipientId = doc.uploader_user_id ?? doc.user_id;
    if (recipientId) {
      await createNotification({
        userId: recipientId,
        category: "document_review",
        title: `${doc.title} ${status === "approved" ? "approved" : "rejected"}`,
        body: reviewNote,
        actionLabel: table === "investor_statements" ? "Open portfolio" : "Open notifications",
        actionHref: table === "investor_statements" ? "/portfolio" : "/notifications",
        metadata: { table, document_id: doc.id, status },
      });
    }

    await logAudit({
      targetTable: table,
      targetId: doc.id,
      action: `document_${status}`,
      severity: status === "rejected" ? "warning" : "info",
      note: `${doc.title} marked ${status}.`,
      suspicious: status === "rejected",
    });

    toast.success(`Document marked ${status}.`);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin", "entity-documents"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "offering-documents"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "investor-statements"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "audit-events"] }),
      recipientId ? queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count", recipientId] }) : Promise.resolve(),
    ]);
  }

  async function moveCommitmentTo(status: "received" | "matched" | "in_escrow" | "released" | "refunded", commitment: any) {
    const { error } = await (supabase as any).from("payment_reconciliation_events").insert({
      commitment_id: commitment.id,
      actor_user_id: actorUserId,
      status,
      amount: commitment.amount,
      external_reference: commitment.escrow_reference,
      note: `Commitment moved to ${status.replaceAll("_", " ")} from admin console.`,
      metadata: { rail: commitment.rail },
    });
    if (error) return toast.error(error.message);

    await (supabase as any)
      .from("investment_commitments")
      .update({
        status:
          status === "in_escrow"
            ? "in_escrow"
            : status === "released"
              ? "released"
              : status === "refunded"
                ? "refunded"
                : status === "matched"
                  ? "funded"
                  : "pending_payment",
      })
      .eq("id", commitment.id);

    await logAudit({
      targetTable: "investment_commitments",
      targetId: commitment.id,
      action: `reconciliation_${status}`,
      severity: "info",
      note: `Commitment ${commitment.escrow_reference ?? commitment.id} marked ${status}.`,
      metadata: { rail: commitment.rail, amount: commitment.amount },
    });

    toast.success(`Commitment marked ${status.replaceAll("_", " ")}`);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["admin", "commitments"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "reconciliation-events"] }),
      queryClient.invalidateQueries({ queryKey: ["admin", "audit-events"] }),
    ]);
  }

  const uploadStatement = useMutation({
    mutationFn: async () => {
      if (!statementUserId || !statementFile) throw new Error("Choose an investor and statement file first.");

      const uploaded = await uploadDocumentFile({
        bucket: DOCUMENT_BUCKETS.investorStatement,
        scopeId: statementUserId,
        file: statementFile,
      });

      const { error } = await (supabase as any).from("investor_statements").insert({
        user_id: statementUserId,
        commitment_id: statementCommitmentId || null,
        statement_type: statementType,
        title: statementTitle.trim() || statementFile.name,
        status: "approved",
        review_note: statementNote.trim() || "Uploaded by operations.",
        reviewed_by: actorUserId,
        reviewed_at: new Date().toISOString(),
        storage_bucket: uploaded.bucket,
        storage_path: uploaded.path,
        original_filename: uploaded.originalFilename,
        mime_type: uploaded.mimeType,
        file_size: uploaded.fileSize,
        uploaded_at: new Date().toISOString(),
      });
      if (error) throw error;

      await createNotification({
        userId: statementUserId,
        category: "statement_uploaded",
        title: "New investor document available",
        body: statementTitle.trim() || statementType,
        actionLabel: "Open portfolio",
        actionHref: "/portfolio",
        metadata: { statement_type: statementType, commitment_id: statementCommitmentId || null },
      });

      await logAudit({
        targetTable: "investor_statements",
        action: "statement_uploaded",
        severity: "info",
        note: `${statementTitle.trim() || statementFile.name} uploaded for investor ${statementUserId}.`,
        metadata: { statement_type: statementType, commitment_id: statementCommitmentId || null },
      });
    },
    onSuccess: async () => {
      const recipientId = statementUserId;
      toast.success("Investor statement uploaded and delivered.");
      setStatementTitle("");
      setStatementType("Investment statement");
      setStatementNote("");
      setStatementUserId("");
      setStatementCommitmentId("");
      setStatementFile(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["admin", "investor-statements"] }),
        queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count", recipientId] }),
      ]);
    },
    onError: (error: any) => {
      toast.error(error?.message ?? "Unable to upload that investor statement.");
    },
  });

  const pendingSessions = sessions.filter((session) => ["draft", "pending_submission", "in_review", "needs_action"].includes(session.status));
  const fundedCommitments = commitments.filter((commitment) => ["pending_payment", "in_escrow", "funded", "released"].includes(commitment.status));

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={ShieldCheck} label="Verification queue" value={String(pendingSessions.length)} note="Sessions still being worked" />
        <StatCard icon={FolderOpen} label="Document review" value={String(pendingDocuments.length)} note="Uploads waiting on approval" />
        <StatCard icon={Users} label="UBO records" value={String(ubos.length)} note="Beneficial owner checks" />
        <StatCard icon={CircleDollarSign} label="Funding queue" value={String(fundedCommitments.length)} note="Commitments needing ops oversight" />
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-bold">Verification review queue</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">This is the operator-facing layer for Sumsub, Youverify, and internal manual review.</p>
          <div className="mt-5 grid gap-4">
            {sessionsLoading ? (
              Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-28 animate-pulse rounded-2xl bg-background" />)
            ) : pendingSessions.length === 0 ? (
              <EmptyState title="Verification queue is clear" hint="New sessions will appear here when users start KYC or KYB." />
            ) : (
              pendingSessions.map((session) => (
                <div key={session.id} className="rounded-2xl border border-border bg-background p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{session.subject_type.replaceAll("_", " ")} via {session.provider}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Session {session.provider_session_id} · {new Date(session.created_at).toLocaleString()}</p>
                    </div>
                    <StatusBadge status={session.status} />
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <ActionButton color="green" icon={<CheckCircle2 className="h-3.5 w-3.5" />} onClick={() => void applyVerificationStatus(session, "approved")}>Approve</ActionButton>
                    <ActionButton color="amber" icon={<FileWarning className="h-3.5 w-3.5" />} onClick={() => void applyVerificationStatus(session, "needs_action")}>Needs action</ActionButton>
                    <ActionButton color="red" icon={<XCircle className="h-3.5 w-3.5" />} onClick={() => void applyVerificationStatus(session, "rejected")}>Reject</ActionButton>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="space-y-6">
          <SimpleListCard title="Entity register" icon={<Building2 className="h-5 w-5 text-primary" />} items={entities} emptyTitle="No entities yet" emptyHint="Approved companies and SPVs will appear here.">
            {(entity: any) => (
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{entity.legal_name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{entity.registration_number} · {entity.country}</p>
                </div>
                <StatusBadge status={entity.verification_status} />
              </div>
            )}
          </SimpleListCard>

          <SimpleListCard title="UBO records" icon={<Users className="h-5 w-5 text-primary" />} items={ubos} emptyTitle="No beneficial owners yet" emptyHint="Founder and shareholder verification will land here.">
            {(ubo: any) => (
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{ubo.full_name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{ubo.role_title ?? "Owner"} · {ubo.ownership_percent ?? 0}% ownership</p>
                </div>
                <StatusBadge status={ubo.verification_status} />
              </div>
            )}
          </SimpleListCard>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-bold">Document review queue</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Founder uploads land here so compliance can approve or reject them before they are relied on in fundraising or KYB.</p>
          <div className="mt-5 grid gap-3">
            {!pendingDocuments.length ? (
              <EmptyState title="No pending uploads" hint="Founder and issuer uploads will appear here when they need review." />
            ) : (
              pendingDocuments.map((doc) => {
                const table = doc.business_entity_id ? "business_entity_documents" : "offering_documents";
                return (
                  <div key={doc.id} className="rounded-2xl border border-border bg-background p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{doc.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {doc.document_type}
                          {doc.version_label ? ` · ${doc.version_label}` : ""}
                          {doc.visibility ? ` · ${doc.visibility}` : ""}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">{formatDocumentSize(Number(doc.file_size ?? 0))} · {doc.original_filename ?? "Stored document"}</p>
                      </div>
                      <StatusBadge status={doc.status} />
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button type="button" onClick={() => void openStoredDocument(doc)} className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground">
                        <ExternalLink className="mr-2 inline h-3.5 w-3.5" />
                        Open
                      </button>
                      <ActionButton color="green" icon={<CheckCircle2 className="h-3.5 w-3.5" />} onClick={() => void reviewDocument(table as any, doc, "approved")}>Approve</ActionButton>
                      <ActionButton color="red" icon={<XCircle className="h-3.5 w-3.5" />} onClick={() => void reviewDocument(table as any, doc, "rejected")}>Reject</ActionButton>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="flex items-center gap-2">
            <FileCheck2 className="h-5 w-5 text-primary" />
            <h2 className="font-display text-xl font-bold">Investor statements and certificates</h2>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">Operations can upload formal statements, certificates, and receipts here. Investors receive an inbox alert and secure portfolio download.</p>
          <div className="mt-5 grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-medium">Investor</span>
              <select value={statementUserId} onChange={(event) => setStatementUserId(event.target.value)} className={selectCls}>
                <option value="">Choose investor</option>
                {[...new Set(commitments.map((item) => item.user_id))].filter(Boolean).map((userId) => (
                  <option key={userId} value={userId}>{userId}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">Related commitment</span>
              <select value={statementCommitmentId} onChange={(event) => setStatementCommitmentId(event.target.value)} className={selectCls}>
                <option value="">Optional commitment</option>
                {commitments.filter((item) => !statementUserId || item.user_id === statementUserId).map((item) => (
                  <option key={item.id} value={item.id}>{item.escrow_reference ?? item.id} · {formatMoney(Number(item.amount ?? 0))}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">Title</span>
              <Input value={statementTitle} onChange={(event) => setStatementTitle(event.target.value)} placeholder="June 2026 investor statement" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">Statement type</span>
              <select value={statementType} onChange={(event) => setStatementType(event.target.value)} className={selectCls}>
                {["Investment statement", "Ownership certificate", "Receipt", "Tax document", "Distribution notice"].map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">Admin note</span>
              <Textarea value={statementNote} onChange={(event) => setStatementNote(event.target.value)} placeholder="Optional context for the investor." rows={3} />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">File</span>
              <Input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.docx" onChange={(event) => setStatementFile(event.target.files?.[0] ?? null)} />
            </label>
            <button type="button" onClick={() => void uploadStatement.mutateAsync()} disabled={uploadStatement.isPending || !statementUserId || !statementFile} className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50">
              {uploadStatement.isPending ? "Uploading..." : "Upload statement"}
            </button>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-3xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <CircleDollarSign className="h-5 w-5 text-primary" />
          <h2 className="font-display text-xl font-bold">Funding and reconciliation queue</h2>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">Operators should be able to mark inbound transfers as received, matched, escrowed, released, or refunded.</p>
        <div className="mt-5 grid gap-3">
          {commitments.length === 0 ? (
            <EmptyState title="No commitments yet" hint="Investment checkout activity will populate this queue." />
          ) : (
            commitments.map((commitment) => (
              <div key={commitment.id} className="rounded-2xl border border-border bg-background p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{formatMoney(Number(commitment.amount ?? 0))}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{commitment.rail.replaceAll("_", " ")} · {commitment.escrow_reference ?? "Reference pending"}</p>
                  </div>
                  <StatusBadge status={commitment.status} />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {["received", "matched", "in_escrow", "released", "refunded"].map((status) => (
                    <button key={status} type="button" onClick={() => void moveCommitmentTo(status as any, commitment)} className="rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground">
                      Mark {status.replaceAll("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        <SimpleListCard title="Recent reconciliation events" icon={<CircleDollarSign className="h-5 w-5 text-primary" />} items={reconciliationEvents} emptyTitle="No reconciliation events yet" emptyHint="Payment matching and escrow steps will appear here.">
          {(event: any) => (
            <>
              <p className="text-sm font-semibold">{String(event.status).replaceAll("_", " ")}</p>
              <p className="text-xs text-muted-foreground">{event.external_reference ?? "No external reference"} · {new Date(event.created_at).toLocaleString()}</p>
            </>
          )}
        </SimpleListCard>

        <SimpleListCard title="Investor statement log" icon={<FileCheck2 className="h-5 w-5 text-primary" />} items={statements} emptyTitle="No investor records yet" emptyHint="Uploaded statements and certificates will appear here.">
          {(statement: any) => (
            <>
              <p className="text-sm font-semibold">{statement.title}</p>
              <p className="text-xs text-muted-foreground">{statement.statement_type} · {String(statement.status).replaceAll("_", " ")}</p>
            </>
          )}
        </SimpleListCard>

        <SimpleListCard title="Audit trail" icon={<FileWarning className="h-5 w-5 text-primary" />} items={auditEvents} emptyTitle="No audit events yet" emptyHint="Admin actions, reviews, and suspicious flags should land here.">
          {(event: any) => (
            <>
              <p className="text-sm font-semibold">{event.action.replaceAll("_", " ")}</p>
              <p className="text-xs text-muted-foreground">{event.target_table} · {event.note ?? "No note"} · {new Date(event.created_at).toLocaleString()}</p>
            </>
          )}
        </SimpleListCard>
      </section>
    </>
  );
}

function StatCard({ icon: Icon, label, value, note }: { icon: any; label: string; value: string; note: string }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-muted-foreground">{note}</p>
    </div>
  );
}

function SimpleListCard({ title, icon, items, emptyTitle, emptyHint, children }: { title: string; icon: ReactNode; items: any[]; emptyTitle: string; emptyHint: string; children: (item: any) => ReactNode }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="font-display text-xl font-bold">{title}</h2>
      </div>
      <div className="mt-4 grid gap-3">
        {items.length === 0 ? <EmptyState title={emptyTitle} hint={emptyHint} /> : items.map((item) => <div key={item.id} className="rounded-2xl border border-border bg-background p-4">{children(item)}</div>)}
      </div>
    </div>
  );
}

function ActionButton({ color, icon, onClick, children }: { color: "green" | "amber" | "red"; icon: React.ReactNode; onClick: () => void; children: React.ReactNode }) {
  const className = color === "green" ? "bg-brand-green text-white" : color === "amber" ? "bg-amber-500 text-black" : "bg-destructive text-white";
  return <button type="button" onClick={onClick} className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${className}`}>{icon}{children}</button>;
}

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "approved" || status === "released"
      ? "bg-brand-green/10 text-brand-green"
      : status === "needs_action" || status === "pending_payment" || status === "in_review" || status === "matched" || status === "received" || status === "uploaded"
        ? "bg-amber-500/10 text-amber-400"
        : status === "rejected" || status === "cancelled" || status === "refunded"
          ? "bg-destructive/10 text-destructive"
          : "bg-secondary text-muted-foreground";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${className}`}>{status.replaceAll("_", " ")}</span>;
}

const selectCls = "w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-1 focus-visible:ring-ring";
