import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BadgeCheck, Calendar, ExternalLink, MapPin, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { DOCUMENT_BUCKETS, formatDocumentSize, getDocumentSignedUrl, uploadDocumentFile } from "@/lib/document-storage";
import { createNotification } from "@/lib/notifications";
import { buildMentorEligibility, formatCurrency } from "@/lib/mentor";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile · CoFund" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, roles, user } = useAuth();
  const queryClient = useQueryClient();
  const initials = (profile?.full_name ?? user?.email ?? "U").charAt(0).toUpperCase();

  const { data: commitments = [] } = useQuery({
    queryKey: ["mentor-eligibility", user?.id, "commitments"],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase.from("investment_commitments").select("amount,created_at,status").eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []) as Array<{ amount: number | null; created_at: string; status: string }>;
    },
  });

  const { data: mentorApplication = null } = useQuery({
    queryKey: ["mentor-application", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase.from("mentor_applications").select("*").eq("user_id", user!.id).maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const completedCommitments = useMemo(
    () => commitments.filter((item) => ["funded", "in_escrow", "released"].includes(item.status)),
    [commitments],
  );
  const totalInvestedAmount = useMemo(
    () => completedCommitments.reduce((sum, item) => sum + Number(item.amount ?? 0), 0),
    [completedCommitments],
  );
  const lastInvestmentAt = useMemo(() => {
    const timestamps = completedCommitments.map((item) => new Date(item.created_at).getTime()).filter((item) => !Number.isNaN(item));
    if (!timestamps.length) return null;
    return new Date(Math.max(...timestamps)).toISOString();
  }, [completedCommitments]);

  const eligibility = useMemo(
    () =>
      buildMentorEligibility({
        profile,
        roles,
        userCreatedAt: profile?.created_at ?? user?.created_at ?? null,
        lastActiveAt: lastInvestmentAt ?? user?.last_sign_in_at ?? null,
        investmentCount: completedCommitments.length,
        totalInvestedAmount,
        applicationStatus: mentorApplication?.status ?? null,
      }),
    [completedCommitments.length, lastInvestmentAt, mentorApplication?.status, profile, roles, totalInvestedAmount, user?.created_at, user?.last_sign_in_at],
  );

  const [focus, setFocus] = useState("");
  const [experienceSummary, setExperienceSummary] = useState("");
  const [qualificationSummary, setQualificationSummary] = useState("");
  const [applicationNote, setApplicationNote] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);

  useEffect(() => {
    if (!mentorApplication) return;
    setFocus(mentorApplication.mentor_focus ?? "");
    setExperienceSummary(mentorApplication.experience_summary ?? "");
    setQualificationSummary(mentorApplication.qualification_summary ?? "");
    setApplicationNote(mentorApplication.application_note ?? "");
  }, [mentorApplication]);

  const submitMentorApplication = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("You need to be signed in.");
      if (!eligibility.canApply) throw new Error("You do not meet the current mentor requirements yet.");
      if (!proofFile) throw new Error("Please upload proof of experience or qualifications.");

      const uploaded = await uploadDocumentFile({
        bucket: DOCUMENT_BUCKETS.mentorApplication,
        scopeId: user.id,
        file: proofFile,
      });

      const { error } = await supabase.from("mentor_applications").upsert(
        {
          user_id: user.id,
          applicant_name: profile?.full_name ?? user.email ?? null,
          applicant_email: user.email ?? null,
          status: "pending_review",
          platform_joined_at: profile?.created_at ?? user.created_at ?? null,
          last_active_at: lastInvestmentAt ?? user.last_sign_in_at ?? null,
          investment_count: eligibility.investmentCount,
          total_invested_amount: eligibility.totalInvestedAmount,
          experience_summary: experienceSummary.trim(),
          qualification_summary: qualificationSummary.trim(),
          application_note: applicationNote.trim() || null,
          proof_storage_bucket: uploaded.bucket,
          proof_storage_path: uploaded.path,
          proof_original_filename: uploaded.originalFilename,
          proof_mime_type: uploaded.mimeType,
          proof_file_size: uploaded.fileSize,
          mentor_focus: focus.trim() || null,
        },
        { onConflict: "user_id" },
      );

      if (error) throw error;

      await createNotification({
        userId: user.id,
        category: "mentor_application",
        title: "Mentor application submitted",
        body: "Your mentorship application is now in review by CoFund operations.",
        actionLabel: "View profile",
        actionHref: "/profile",
        metadata: { status: "pending_review" },
      });
    },
    onSuccess: async () => {
      toast.success("Mentor application submitted for review.");
      setProofFile(null);
      await queryClient.invalidateQueries({ queryKey: ["mentor-application", user?.id] });
    },
    onError: (error: any) => {
      toast.error(error?.message ?? "Unable to submit mentor application.");
    },
  });

  const openProof = async () => {
    if (!mentorApplication?.proof_storage_bucket || !mentorApplication?.proof_storage_path) return;
    try {
      const signedUrl = await getDocumentSignedUrl(
        mentorApplication.proof_storage_bucket,
        mentorApplication.proof_storage_path,
        mentorApplication.proof_original_filename ?? undefined,
      );
      window.open(signedUrl, "_blank", "noopener,noreferrer");
    } catch (error: any) {
      toast.error(error?.message ?? "Unable to open proof file.");
    }
  };

  const currentStatus = mentorApplication?.status ?? "not_started";

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <header className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 -z-10 gradient-mesh opacity-60" />
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-5">
            <div className="gradient-brand flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-3xl font-bold text-white shadow-brand sm:h-24 sm:w-24">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-3xl font-bold sm:text-4xl">{profile?.full_name ?? "Your profile"}</h1>
                <BadgeCheck className="h-6 w-6 text-brand-green" />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" /> Nigeria
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Member since {new Date(profile?.created_at ?? user?.created_at ?? Date.now()).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-brand-green" /> Verified email
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          <section className="space-y-5 md:col-span-2">
            <Card title="Active roles">
              <div className="flex flex-wrap gap-2">
                {roles.length === 0 ? (
                  <span className="text-sm text-muted-foreground">No roles selected yet.</span>
                ) : (
                  roles.map((r) => (
                    <span key={r} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium capitalize text-foreground">
                      {r.replace("_", " ")}
                    </span>
                  ))
                )}
              </div>
            </Card>

            <Card title="About">
              <p className="text-sm text-muted-foreground">Add a short bio so members know what you're working on and what you're looking for.</p>
            </Card>

            <Card title="Mentor application">
              <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={currentStatus} />
                  {eligibility.isApproved && <span className="rounded-full border border-brand-green/20 bg-brand-green/10 px-3 py-1 text-xs font-semibold text-brand-green">Approved mentor</span>}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Metric label="Member since" value={profile?.created_at ?? user?.created_at ?? null} />
                  <Metric label="Investments" value={String(eligibility.investmentCount)} />
                  <Metric label="Total invested" value={formatCurrency(eligibility.totalInvestedAmount)} />
                  <Metric label="Last active" value={eligibility.lastActiveAt} />
                </div>

                <div className="rounded-2xl border border-border bg-background p-4">
                  <h3 className="font-display text-sm font-bold">Eligibility checklist</h3>
                  <div className="mt-3 space-y-2">
                    {eligibility.checklist.map((item) => (
                      <div key={item.label} className="flex items-start gap-3 text-sm">
                        <span className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${item.done ? "bg-brand-green text-white" : "bg-muted text-muted-foreground"}`}>
                          {item.done ? "✓" : "•"}
                        </span>
                        <div>
                          <p className="font-medium">{item.label}</p>
                          <p className="text-xs text-muted-foreground">{item.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-card/60 p-4">
                  <h3 className="font-display text-sm font-bold">Application details</h3>
                  <div className="mt-4 space-y-4">
                    <Field label="Mentorship focus">
                      <Input value={focus} onChange={(event) => setFocus(event.target.value)} placeholder="What founders should come to you for" />
                    </Field>
                    <Field label="Experience summary">
                      <Textarea value={experienceSummary} onChange={(event) => setExperienceSummary(event.target.value)} placeholder="Summarize your investment and operating experience." rows={4} />
                    </Field>
                    <Field label="Qualifications and proof">
                      <Textarea value={qualificationSummary} onChange={(event) => setQualificationSummary(event.target.value)} placeholder="List qualifications, certificates, licenses, or notable experience." rows={4} />
                    </Field>
                    <Field label="Additional note">
                      <Textarea value={applicationNote} onChange={(event) => setApplicationNote(event.target.value)} placeholder="Anything else the admin reviewer should know?" rows={3} />
                    </Field>
                    <Field label="Proof file">
                      <Input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.docx" onChange={(event) => setProofFile(event.target.files?.[0] ?? null)} />
                    </Field>
                    <button
                      type="button"
                      onClick={() => void submitMentorApplication.mutateAsync()}
                      disabled={!eligibility.canApply || submitMentorApplication.isPending}
                      className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                    >
                      {submitMentorApplication.isPending ? "Submitting..." : currentStatus === "pending_review" ? "Update application" : "Submit application"}
                    </button>
                    {!eligibility.canApply && !eligibility.isAlreadyApplied && !eligibility.isApproved && (
                      <p className="text-xs text-muted-foreground">Finish the checklist above before applying. Mentor access is only granted after admin review.</p>
                    )}
                  </div>
                </div>

                {mentorApplication?.proof_storage_bucket && mentorApplication?.proof_storage_path && (
                  <div className="rounded-2xl border border-border bg-background p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">Uploaded proof</p>
                        <p className="text-xs text-muted-foreground">
                          {mentorApplication.proof_original_filename ?? "Supporting document"}
                          {mentorApplication.proof_file_size ? ` · ${formatDocumentSize(Number(mentorApplication.proof_file_size))}` : ""}
                        </p>
                      </div>
                      <button type="button" onClick={() => void openProof()} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground">
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open proof
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            <Card title="Activity">
              <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-muted-foreground">Your posts, comments and investments will appear here.</div>
            </Card>
          </section>

          <aside className="space-y-5">
            <Card title="Trust score">
              <p className="font-display text-4xl font-bold text-gradient-brand">—</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Complete BVN, phone, address and email verification to unlock your trust score.</p>
            </Card>
            <Card title="Reputation">
              <div className="space-y-3">
                <Row label="Helpful answers" value="0" />
                <Row label="Mentor sessions" value="0" />
                <Row label="Investments" value={String(eligibility.investmentCount)} />
              </div>
            </Card>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-card p-6">
      <h2 className="font-display text-base font-bold">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-foreground">{label}</span>
      {children}
    </label>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4">
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-sm font-semibold">{formatMetricValue(label, value)}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const className =
    status === "approved"
      ? "bg-brand-green/10 text-brand-green"
      : status === "pending_review" || status === "needs_action" || status === "draft"
        ? "bg-amber-500/10 text-amber-400"
        : status === "rejected"
          ? "bg-destructive/10 text-destructive"
          : "bg-secondary text-muted-foreground";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${className}`}>{status.replaceAll("_", " ")}</span>;
}

function formatMetricValue(label: string, value: string | null) {
  if (!value) return "—";
  if (label === "Member since" || label === "Last active") {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
    }
  }
  return value;
}
