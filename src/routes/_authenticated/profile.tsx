import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BadgeCheck,
  CheckCircle2,
  Circle,
  ExternalLink,
  Pencil,
  ShieldCheck,
  Star,
  TrendingUp,
  Users,
  FileText,
  Upload,
  ChevronRight,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  DOCUMENT_BUCKETS,
  formatDocumentSize,
  getDocumentSignedUrl,
  uploadDocumentFile,
} from "@/lib/document-storage";
import { createNotification } from "@/lib/notifications";
import { buildMentorEligibility, formatCurrency } from "@/lib/mentor";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile · CoFund" }] }),
  component: ProfilePage,
});

const TABS = ["Overview", "Followers", "Following", "Mentor program", "Verification"] as const;
type Tab = (typeof TABS)[number];

const db = supabase as any;

function ProfilePage() {
  const { profile, roles, user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  const initials = (profile?.full_name ?? user?.email ?? "U").charAt(0).toUpperCase();

  const { data: commitments = [] } = useQuery({
    queryKey: ["mentor-eligibility", user?.id, "commitments"],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investment_commitments")
        .select("amount,created_at,status")
        .eq("user_id", user!.id);
      if (error) throw error;
      return (data ?? []) as Array<{ amount: number | null; created_at: string; status: string }>;
    },
  });

  const { data: mentorApplication = null } = useQuery({
    queryKey: ["mentor-application", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mentor_applications")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
  });

  const completedCommitments = useMemo(
    () =>
      commitments.filter((c) => ["funded", "in_escrow", "released"].includes(c.status)),
    [commitments],
  );
  const totalInvestedAmount = useMemo(
    () => completedCommitments.reduce((sum, c) => sum + Number(c.amount ?? 0), 0),
    [completedCommitments],
  );
  const lastInvestmentAt = useMemo(() => {
    const ts = completedCommitments
      .map((c) => new Date(c.created_at).getTime())
      .filter((t) => !Number.isNaN(t));
    return ts.length ? new Date(Math.max(...ts)).toISOString() : null;
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
    [
      completedCommitments.length,
      lastInvestmentAt,
      mentorApplication?.status,
      profile,
      roles,
      totalInvestedAmount,
      user?.created_at,
      user?.last_sign_in_at,
    ],
  );

  const { data: followerCount = 0 } = useQuery({
    enabled: !!user?.id,
    queryKey: ["follower-count", user?.id],
    queryFn: async () => {
      const { count } = await db
        .from("user_follows")
        .select("id", { count: "exact", head: true })
        .eq("following_id", user!.id);
      return (count as number | null) ?? 0;
    },
  });

  const { data: followingCount = 0 } = useQuery({
    enabled: !!user?.id,
    queryKey: ["following-count", user?.id],
    queryFn: async () => {
      const { count } = await db
        .from("user_follows")
        .select("id", { count: "exact", head: true })
        .eq("follower_id", user!.id);
      return (count as number | null) ?? 0;
    },
  });

  const [focus, setFocus] = useState("");
  const [experienceSummary, setExperienceSummary] = useState("");
  const [qualificationSummary, setQualificationSummary] = useState("");
  const [applicationNote, setApplicationNote] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; title: string; message: string } | null>(null);

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
      if (!eligibility.canApply) throw new Error("You do not meet the mentor requirements yet.");
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
      setNotice({ tone: "success", title: "Mentor application submitted", message: "Your application is now in review." });
      setProofFile(null);
      await queryClient.invalidateQueries({ queryKey: ["mentor-application", user?.id] });
    },
    onError: (error: any) => {
      setNotice({ tone: "error", title: "Submission failed", message: error?.message ?? "Unable to submit mentor application." });
    },
  });

  const openProof = async () => {
    if (!mentorApplication?.proof_storage_bucket || !mentorApplication?.proof_storage_path) return;
    try {
      const url = await getDocumentSignedUrl(
        mentorApplication.proof_storage_bucket,
        mentorApplication.proof_storage_path,
        mentorApplication.proof_original_filename ?? undefined,
      );
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      setNotice({ tone: "error", title: "Open failed", message: e?.message ?? "Unable to open proof file." });
    }
  };

  const currentStatus = mentorApplication?.status ?? "not_started";
  const memberSince = new Date(
    profile?.created_at ?? user?.created_at ?? Date.now(),
  ).toLocaleDateString(undefined, { month: "long", year: "numeric" });

  return (
    <AppLayout>
      <div className="min-h-full bg-background pb-16">
        {notice && (
          <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6 lg:px-8">
            <Alert variant={notice.tone === "error" ? "destructive" : "default"}>
              <AlertTitle>{notice.title}</AlertTitle>
              <AlertDescription>{notice.message}</AlertDescription>
            </Alert>
          </div>
        )}
        <div className="relative overflow-hidden border-b border-border/40">
          <div className="absolute inset-0 gradient-hero opacity-80" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_top_right,oklch(0.65_0.18_160/0.10),transparent)]" />
          <div className="relative mx-auto max-w-5xl px-4 pt-10 pb-0 sm:px-6 lg:px-8">
            <div className="flex items-end gap-5">
              <div className="relative shrink-0">
                <div className="h-20 w-20 rounded-2xl gradient-brand flex items-center justify-center text-3xl font-bold text-primary-foreground shadow-brand sm:h-24 sm:w-24 sm:text-4xl">
                  {initials}
                </div>
                <div className="absolute -bottom-1 -right-1 rounded-full bg-brand-green p-0.5 shadow-sm">
                  <BadgeCheck className="h-4 w-4 text-white" />
                </div>
              </div>
              <div className="pb-1 min-w-0">
                <h1 className="font-display text-2xl font-bold sm:text-3xl truncate">
                  {profile?.full_name ?? "Your profile"}
                </h1>
                <p className="mt-0.5 text-sm text-muted-foreground truncate">{user?.email}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>🇳🇬 Nigeria</span>
                  <span>Member since {memberSince}</span>
                  <span className="flex items-center gap-1 text-brand-green">
                    <ShieldCheck className="h-3 w-3" /> Email verified
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  {profile?.username && (
                    <Link
                      to="/users/$username"
                      params={{ username: profile.username }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" /> View public profile
                    </Link>
                  )}
                  <Link
                    to="/settings"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pencil className="h-3 w-3" /> Edit profile
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-0 border-b border-border/60 overflow-x-auto scrollbar-hide">
              {TABS.map((tab) => {
                const label =
                  tab === "Followers" ? `Followers · ${followerCount}` :
                  tab === "Following" ? `Following · ${followingCount}` :
                  tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`shrink-0 px-5 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                      activeTab === tab
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
          {activeTab === "Overview" && (
            <OverviewTab roles={roles} investmentCount={completedCommitments.length} totalInvested={totalInvestedAmount} />
          )}
          {activeTab === "Followers" && (
            <FollowersListTab userId={user?.id ?? ""} type="followers" />
          )}
          {activeTab === "Following" && (
            <FollowersListTab userId={user?.id ?? ""} type="following" />
          )}
          {activeTab === "Mentor program" && (
            <MentorTab
              currentStatus={currentStatus}
              eligibility={eligibility}
              mentorApplication={mentorApplication}
              focus={focus}
              setFocus={setFocus}
              experienceSummary={experienceSummary}
              setExperienceSummary={setExperienceSummary}
              qualificationSummary={qualificationSummary}
              setQualificationSummary={setQualificationSummary}
              applicationNote={applicationNote}
              setApplicationNote={setApplicationNote}
              proofFile={proofFile}
              setProofFile={setProofFile}
              submitMentorApplication={submitMentorApplication}
              openProof={openProof}
            />
          )}
          {activeTab === "Verification" && (
            <VerificationTab
              investmentCount={completedCommitments.length}
              totalInvested={totalInvestedAmount}
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
}

function OverviewTab({
  roles,
  investmentCount,
  totalInvested,
}: {
  roles: string[];
  investmentCount: number;
  totalInvested: number;
}) {
  return (
    <div className="grid gap-10 md:grid-cols-[1fr_280px]">
      <div className="space-y-10">
        <section>
          <SectionLabel>Your identity</SectionLabel>
          {roles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No roles selected yet. Complete onboarding to set your roles.
            </p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {roles.map((r) => (
                <span
                  key={r}
                  className="inline-flex items-center rounded-full border border-primary/20 bg-primary/8 px-4 py-1.5 text-sm font-semibold capitalize text-primary"
                >
                  {r.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          )}
        </section>

        <section>
          <SectionLabel>About you</SectionLabel>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Add a short bio so other CoFund members know what you're working on and what you're
            looking for. A strong bio helps you connect with the right investors and founders.
          </p>
          <button className="mt-3 text-sm font-semibold text-primary hover:text-foreground transition-colors">
            + Add bio
          </button>
        </section>

        <section>
          <SectionLabel>Activity</SectionLabel>
          <div className="mt-4 grid grid-cols-3 divide-x divide-border border border-border rounded-2xl overflow-hidden">
            {[
              { label: "Investments", value: String(investmentCount) },
              { label: "Total deployed", value: totalInvested > 0 ? formatCurrency(totalInvested) : "₦0" },
              { label: "Community posts", value: "0" },
            ].map(({ label, value }) => (
              <div key={label} className="bg-card px-5 py-4 text-center">
                <p className="font-display text-2xl font-bold">{value}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Your posts, comments, and investment history will appear here as you participate.
          </p>
        </section>
      </div>

      <aside className="space-y-8">
        <section>
          <SectionLabel>Status</SectionLabel>
          <div className="mt-3 space-y-2.5">
            {[
              { label: "Account verified", done: true },
              { label: "Email confirmed", done: true },
              { label: "BVN verified", done: false },
              { label: "Phone number", done: false },
              { label: "First investment", done: investmentCount > 0 },
            ].map(({ label, done }) => (
              <div key={label} className="flex items-center gap-2.5 text-sm">
                {done ? (
                  <CheckCircle2 className="h-4 w-4 text-brand-green shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                )}
                <span className={done ? "text-foreground" : "text-muted-foreground"}>{label}</span>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}

function MentorTab({
  currentStatus,
  eligibility,
  mentorApplication,
  focus,
  setFocus,
  experienceSummary,
  setExperienceSummary,
  qualificationSummary,
  setQualificationSummary,
  applicationNote,
  setApplicationNote,
  proofFile,
  setProofFile,
  submitMentorApplication,
  openProof,
}: any) {
  const statusConfig: Record<string, { label: string; color: string; bg: string; desc: string }> = {
    not_started: {
      label: "Not applied",
      color: "text-muted-foreground",
      bg: "bg-secondary",
      desc: "Complete the checklist below to unlock your mentor application.",
    },
    pending_review: {
      label: "Under review",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      desc: "Your application is with the CoFund team. We'll notify you within 5–7 business days.",
    },
    approved: {
      label: "Approved mentor",
      color: "text-brand-green",
      bg: "bg-brand-green/10",
      desc: "You're a verified CoFund mentor. Thank you for giving back to the community.",
    },
    rejected: {
      label: "Not approved",
      color: "text-destructive",
      bg: "bg-destructive/10",
      desc: "Your application wasn't approved this time. You may reapply after 90 days.",
    },
    draft: {
      label: "Draft saved",
      color: "text-muted-foreground",
      bg: "bg-secondary",
      desc: "Your draft is saved. Complete and submit when you're ready.",
    },
    needs_action: {
      label: "Action needed",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      desc: "The review team has requested additional information from you.",
    },
  };

  const cfg = statusConfig[currentStatus] ?? statusConfig.not_started;

  return (
    <div className="space-y-10">
      <div className={`rounded-2xl ${cfg.bg} px-6 py-5`}>
        <div className="flex items-center gap-3 mb-2">
          <Star className={`h-5 w-5 ${cfg.color}`} />
          <p className={`font-display text-base font-bold ${cfg.color}`}>{cfg.label}</p>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">{cfg.desc}</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <section>
          <SectionLabel>Your metrics</SectionLabel>
          <div className="mt-4 space-y-4">
            {[
              { label: "Investments made", value: String(eligibility.investmentCount), target: "≥ 1" },
              { label: "Total deployed", value: formatCurrency(eligibility.totalInvestedAmount), target: "≥ ₦500,000" },
              { label: "Member tenure", value: eligibility.checklist.find((c: any) => c.label === "Member for 3+ months")?.done ? "3+ months" : "< 3 months", target: "3 months" },
            ].map(({ label, value, target }) => (
              <div key={label} className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="mt-0.5 font-display text-xl font-bold">{value}</p>
                </div>
                <span className="mt-1 rounded-full border border-border px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
                  target {target}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <SectionLabel>Eligibility checklist</SectionLabel>
          <div className="mt-4 space-y-3">
            {eligibility.checklist.map((item: any, i: number) => (
              <div key={item.label} className="flex items-start gap-3">
                <div
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                    item.done ? "bg-brand-green text-white" : "border border-border bg-card text-muted-foreground"
                  }`}
                >
                  {item.done ? "✓" : i + 1}
                </div>
                <div>
                  <p className={`text-sm font-medium ${item.done ? "text-foreground" : "text-muted-foreground"}`}>
                    {item.label}
                  </p>
                  {!item.done && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.detail}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {(eligibility.canApply || eligibility.isAlreadyApplied || currentStatus === "pending_review") && (
        <section>
          <SectionLabel>Application</SectionLabel>
          <p className="mt-1 text-sm text-muted-foreground">
            Tell us about your investment experience and what you'd offer as a mentor.
          </p>
          <div className="mt-5 space-y-5">
            <FormField label="What will you mentor on?">
              <Input
                value={focus}
                onChange={(e) => setFocus(e.target.value)}
                placeholder="e.g. Early-stage fundraising, agritech, financial modelling"
              />
            </FormField>
            <FormField label="Investment & operating experience">
              <Textarea
                value={experienceSummary}
                onChange={(e) => setExperienceSummary(e.target.value)}
                placeholder="Summarize your background — deals you've made, sectors you know, companies you've built."
                rows={4}
              />
            </FormField>
            <FormField label="Qualifications & proof">
              <Textarea
                value={qualificationSummary}
                onChange={(e) => setQualificationSummary(e.target.value)}
                placeholder="List any certifications, notable exits, board roles, or professional licenses."
                rows={3}
              />
            </FormField>
            <FormField label="Additional note (optional)">
              <Textarea
                value={applicationNote}
                onChange={(e) => setApplicationNote(e.target.value)}
                placeholder="Anything else the review team should know?"
                rows={2}
              />
            </FormField>

            <FormField label="Supporting document">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-card/60 px-4 py-4 transition hover:border-primary/40 hover:bg-card">
                <Upload className="h-5 w-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  {proofFile ? (
                    <p className="text-sm font-medium truncate">{proofFile.name}</p>
                  ) : (
                    <>
                      <p className="text-sm font-medium">Upload proof of experience</p>
                      <p className="text-xs text-muted-foreground">PDF, image, or Word · max 10 MB</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.docx"
                  className="hidden"
                  onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                />
              </label>
            </FormField>

            {mentorApplication?.proof_storage_bucket && (
              <div className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-sm font-medium">
                      {mentorApplication.proof_original_filename ?? "Uploaded document"}
                    </p>
                    {mentorApplication.proof_file_size && (
                      <p className="text-xs text-muted-foreground">
                        {formatDocumentSize(Number(mentorApplication.proof_file_size))}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void openProof()}
                  className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Open
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={() => void submitMentorApplication.mutateAsync()}
              disabled={!eligibility.canApply || submitMentorApplication.isPending}
              className="w-full rounded-xl gradient-brand py-3 text-sm font-bold text-primary-foreground shadow-brand transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitMentorApplication.isPending
                ? "Submitting…"
                : currentStatus === "pending_review"
                  ? "Update application"
                  : "Submit application"}
            </button>
            {!eligibility.canApply && !eligibility.isAlreadyApplied && !eligibility.isApproved && (
              <p className="text-center text-xs text-muted-foreground">
                Complete the eligibility checklist above before you can apply.
              </p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function VerificationTab({
  investmentCount,
  totalInvested,
}: {
  investmentCount: number;
  totalInvested: number;
}) {
  const checksDone = [investmentCount > 0].filter(Boolean).length + 2;
  const totalChecks = 5;
  const trustPct = Math.round((checksDone / totalChecks) * 100);

  return (
    <div className="grid gap-10 md:grid-cols-[1fr_260px]">
      <div className="space-y-10">
        <section>
          <SectionLabel>Trust score</SectionLabel>
          <div className="mt-6 flex items-end gap-6">
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full border-4 border-primary/20 bg-card">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `conic-gradient(oklch(0.7 0.18 160) ${trustPct * 3.6}deg, transparent 0deg)`,
                  borderRadius: "50%",
                  padding: "4px",
                }}
              />
              <div className="relative z-10 flex flex-col items-center bg-card rounded-full w-[calc(100%-8px)] h-[calc(100%-8px)] justify-center">
                <p className="font-display text-2xl font-bold">{trustPct}</p>
                <p className="text-[10px] text-muted-foreground">/ 100</p>
              </div>
            </div>
            <div>
              <p className="font-display text-base font-bold">
                {trustPct < 40 ? "Getting started" : trustPct < 70 ? "Building trust" : "Trusted member"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground max-w-xs leading-relaxed">
                Complete more verifications to increase your trust score and unlock higher investment limits.
              </p>
            </div>
          </div>
        </section>

        <section>
          <SectionLabel>Verifications</SectionLabel>
          <div className="mt-4 divide-y divide-border/60">
            {[
              { label: "Email address", desc: "Your email has been confirmed", done: true },
              { label: "Account created", desc: "Profile set up on CoFund", done: true },
              { label: "Phone number", desc: "Add a verified mobile number", done: false },
              { label: "BVN verification", desc: "Link your Bank Verification Number (Nigeria)", done: false },
              { label: "First investment", desc: "Make your first funded commitment", done: investmentCount > 0 },
            ].map(({ label, desc, done }) => (
              <div key={label} className="flex items-center justify-between gap-4 py-4">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                      done ? "bg-brand-green/10 text-brand-green" : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {done ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </div>
                {!done && (
                  <button className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:border-primary/40 hover:text-primary transition">
                    Add
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      <aside className="space-y-8">
        <section>
          <SectionLabel>Reputation</SectionLabel>
          <div className="mt-4 space-y-4">
            {[
              { label: "Mentor sessions", value: "0", icon: Users },
              { label: "Helpful answers", value: "0", icon: Star },
              { label: "Investments made", value: String(investmentCount), icon: TrendingUp },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  {label}
                </div>
                <span className="font-display text-lg font-bold">{value}</span>
              </div>
            ))}
          </div>
        </section>
      </aside>
    </div>
  );
}

function FollowersListTab({ userId, type }: { userId: string; type: "followers" | "following" }) {
  const { data: users = [], isLoading } = useQuery({
    enabled: !!userId,
    queryKey: ["user-follows-list", userId, type],
    queryFn: async () => {
      const idCol = type === "followers" ? "follower_id" : "following_id";
      const filterCol = type === "followers" ? "following_id" : "follower_id";
      const { data: followRows } = await db
        .from("user_follows")
        .select(idCol)
        .eq(filterCol, userId)
        .order("created_at", { ascending: false })
        .limit(50);
      const ids: string[] = (followRows ?? []).map((r: any) => r[idCol]).filter(Boolean);
      if (!ids.length) return [];
      const { data: profileRows } = await db
        .from("profiles")
        .select("id,full_name,username,avatar_url,bio")
        .in("id", ids);
      const { data: rolesData } = await supabase
        .from("user_roles")
        .select("user_id,role")
        .in("user_id", ids);
      const rolesMap = new Map<string, string[]>();
      for (const r of rolesData ?? []) {
        const list = rolesMap.get(r.user_id) ?? [];
        list.push(r.role);
        rolesMap.set(r.user_id, list);
      }
      const profileMap = new Map((profileRows ?? []).map((p: any) => [p.id, p]));
      return ids
        .map((id) => profileMap.get(id))
        .filter(Boolean)
        .map((p: any) => ({ ...p, roles: rolesMap.get(p.id) ?? [] }));
    },
  });

  if (isLoading) {
    return (
      <div className="divide-y divide-border/60 max-w-2xl">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 py-5 first:pt-0">
            <div className="h-11 w-11 animate-pulse rounded-full bg-secondary" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-36 animate-pulse rounded bg-secondary" />
              <div className="h-2.5 w-52 animate-pulse rounded bg-secondary" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground/40">
          <Users className="h-6 w-6" />
        </div>
        <p className="font-display text-base font-semibold">
          {type === "followers" ? "No followers yet" : "Not following anyone yet"}
        </p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {type === "followers"
            ? "When people follow you, they'll appear here."
            : "Users you follow will appear here."}
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/60 max-w-2xl">
      {users.map((u: any) => {
        const displayName = u.full_name ?? u.username ?? "Member";
        const initial = displayName.charAt(0).toUpperCase();
        return (
          <div key={u.id} className="flex items-center gap-4 py-4 first:pt-0">
            {u.username ? (
              <Link to="/users/$username" params={{ username: u.username }} className="shrink-0">
                {u.avatar_url ? (
                  <img src={u.avatar_url} alt="" className="h-11 w-11 rounded-full object-cover hover:opacity-80 transition" />
                ) : (
                  <div className="gradient-brand flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-primary-foreground hover:opacity-80 transition">
                    {initial}
                  </div>
                )}
              </Link>
            ) : (
              <div className="gradient-brand flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-primary-foreground">
                {initial}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                {u.username ? (
                  <Link to="/users/$username" params={{ username: u.username }} className="font-semibold hover:text-primary transition-colors">
                    {displayName}
                  </Link>
                ) : (
                  <p className="font-semibold">{displayName}</p>
                )}
                {(u.roles as string[]).slice(0, 2).map((r: string) => (
                  <span key={r} className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                    {r.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
              {u.username && <p className="text-xs text-muted-foreground">@{u.username}</p>}
              {u.bio && <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{u.bio}</p>}
            </div>
            {u.username && (
              <Link
                to="/users/$username"
                params={{ username: u.username }}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold hover:bg-secondary transition"
              >
                View profile
              </Link>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">
      {children}
    </p>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-foreground">{label}</label>
      {children}
    </div>
  );
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
