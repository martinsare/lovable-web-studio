import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useReferenceData, useRefValues } from "@/hooks/use-reference-data";
import { toast } from "sonner";
import {
  Bell,
  Camera,
  ChevronRight,
  Globe,
  Lock,
  LogOut,
  Moon,
  Palette,
  ShieldCheck,
  Sun,
  TrendingUp,
  User,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings · CoFund" }] }),
  component: SettingsPage,
});

type Section = "account" | "notifications" | "preferences" | "appearance" | "security" | "danger";

const SECTIONS: { id: Section; label: string; icon: any }[] = [
  { id: "account", label: "Account", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "preferences", label: "Invest preferences", icon: TrendingUp },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "danger", label: "Danger zone", icon: AlertTriangle },
];



function SettingsPage() {
  const { user, profile, signOut } = useAuth();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [section, setSection] = useState<Section>("account");

  const industries = useRefValues("industry").filter((v) => v !== "All");
  const { data: riskLevels = [] } = useReferenceData("risk_level");
  const minTickets = useRefValues("min_ticket");

  // Account form
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [username, setUsername] = useState(profile?.username ?? "");
  const [bio, setBio] = useState((profile as any)?.bio ?? "");
  const [country, setCountry] = useState((profile as any)?.country ?? "Nigeria");
  const [occupation, setOccupation] = useState((profile as any)?.occupation ?? "");
  const [city, setCity] = useState((profile as any)?.city ?? "");
  const [websiteUrl, setWebsiteUrl] = useState((profile as any)?.website_url ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState((profile as any)?.linkedin_url ?? "");
  const [avatarUrl, setAvatarUrl] = useState((profile as any)?.avatar_url ?? "");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setUsername(profile.username ?? "");
      setBio((profile as any).bio ?? "");
      setCountry((profile as any).country ?? "Nigeria");
      setOccupation((profile as any).occupation ?? "");
      setCity((profile as any).city ?? "");
      setWebsiteUrl((profile as any).website_url ?? "");
      setLinkedinUrl((profile as any).linkedin_url ?? "");
      setAvatarUrl((profile as any).avatar_url ?? "");
    }
  }, [profile]);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB.");
      return;
    }
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Upload a JPG, PNG, or WebP image.");
      return;
    }
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadErr) throw uploadErr;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const { error: updateErr } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);
      if (updateErr) throw updateErr;
      setAvatarUrl(publicUrl);
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile picture updated.");
    } catch (err: any) {
      toast.error(err?.message ?? "Could not upload image.");
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

  // ── Notification preferences ──────────────────────────────────────────────
  const [notifs, setNotifs] = useState({
    newDeals: true,
    investmentUpdates: true,
    communityActivity: false,
    securityAlerts: true,
    marketingEmails: false,
  });

  const { data: dbNotifPrefs } = useQuery({
    queryKey: ["notification-preferences", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (dbNotifPrefs) {
      setNotifs({
        newDeals: dbNotifPrefs.new_deals ?? true,
        investmentUpdates: dbNotifPrefs.investment_updates ?? true,
        communityActivity: dbNotifPrefs.community_activity ?? false,
        securityAlerts: dbNotifPrefs.security_alerts ?? true,
        marketingEmails: dbNotifPrefs.marketing_emails ?? false,
      });
    }
  }, [dbNotifPrefs]);

  // ── Investment preferences ─────────────────────────────────────────────────
  const [investPrefs, setInvestPrefs] = useState({
    industries: [] as string[],
    riskLevel: "moderate",
    minTicket: "₦100,000",
  });

  const { data: dbInvestPrefs } = useQuery({
    queryKey: ["investor-preferences", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("investor_preferences")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (dbInvestPrefs) {
      setInvestPrefs({
        industries: dbInvestPrefs.industries ?? [],
        riskLevel: dbInvestPrefs.risk_level ?? "moderate",
        minTicket: dbInvestPrefs.min_ticket ?? "₦100,000",
      });
    }
  }, [dbInvestPrefs]);

  async function patchNotif(key: string, val: boolean) {
    const next = { ...notifs, [key]: val };
    setNotifs(next);
    if (user?.id) {
      await supabase.from("notification_preferences").upsert(
        {
          user_id: user.id,
          new_deals: next.newDeals,
          investment_updates: next.investmentUpdates,
          community_activity: next.communityActivity,
          security_alerts: next.securityAlerts,
          marketing_emails: next.marketingEmails,
        },
        { onConflict: "user_id" },
      );
    }
    toast.success("Notification preference saved.");
  }

  async function patchInvest(update: Partial<typeof investPrefs>) {
    const next = { ...investPrefs, ...update };
    setInvestPrefs(next);
    if (user?.id) {
      await supabase.from("investor_preferences").upsert(
        {
          user_id: user.id,
          industries: next.industries,
          risk_level: next.riskLevel,
          min_ticket: next.minTicket,
        },
        { onConflict: "user_id" },
      );
    }
  }

  function toggleIndustry(ind: string) {
    const list = investPrefs.industries.includes(ind)
      ? investPrefs.industries.filter((i) => i !== ind)
      : [...investPrefs.industries, ind];
    patchInvest({ industries: list });
  }

  const saveAccount = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not signed in.");
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName.trim() || null,
          username: username.trim() || null,
          bio: bio.trim() || null,
          occupation: occupation.trim() || null,
          city: city.trim() || null,
          country: country || null,
          website_url: websiteUrl.trim() || null,
          linkedin_url: linkedinUrl.trim() || null,
        } as any)
        .eq("id", user.id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Profile saved.");
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not save."),
  });

  async function handleSignOut() {
    await signOut();
    navigate({ to: "/" });
  }

  return (
    <AppLayout>
      <div className="min-h-full bg-background">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">

          {/* Page title */}
          <div className="mb-8">
            <h1 className="font-display text-2xl font-bold">Settings</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your account, preferences, and notifications.
            </p>
          </div>

          <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
            {/* Left nav */}
            <nav className="shrink-0 lg:w-48">
              <div className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
                {SECTIONS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSection(id)}
                    className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-left transition-colors ${
                      section === id
                        ? "bg-foreground text-background"
                        : id === "danger"
                          ? "text-muted-foreground hover:text-destructive"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="hidden lg:block">{label}</span>
                  </button>
                ))}
              </div>
            </nav>

            {/* Content */}
            <div className="flex-1 min-w-0">

              {/* ── Account ── */}
              {section === "account" && (
                <div className="space-y-6">
                  <SectionHeading title="Profile" desc="Your public identity on CoFund." />

                  {/* Avatar upload */}
                  <div className="flex items-center gap-5 rounded-2xl border border-border bg-card px-5 py-5">
                    <div className="relative shrink-0">
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="Avatar"
                          className="h-20 w-20 rounded-2xl object-cover border border-border"
                        />
                      ) : (
                        <div className="gradient-brand flex h-20 w-20 items-center justify-center rounded-2xl text-2xl font-bold text-primary-foreground">
                          {(fullName || user?.email || "?").charAt(0).toUpperCase()}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="absolute -bottom-1.5 -right-1.5 flex h-7 w-7 items-center justify-center rounded-full border-2 border-background bg-foreground text-background shadow-elevated transition hover:bg-foreground/80 disabled:opacity-60"
                        title="Change photo"
                      >
                        {uploadingAvatar ? (
                          <span className="h-3 w-3 animate-spin rounded-full border-2 border-background border-t-transparent" />
                        ) : (
                          <Camera className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        className="hidden"
                        onChange={handleAvatarUpload}
                      />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Profile picture</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">JPG, PNG or WebP · max 5 MB</p>
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold transition hover:bg-secondary disabled:opacity-60"
                      >
                        <Camera className="h-3.5 w-3.5" />
                        {uploadingAvatar ? "Uploading…" : "Change photo"}
                      </button>
                    </div>
                  </div>

                  {/* Identity fields */}
                  <div className="divide-y divide-border rounded-2xl border border-border bg-card overflow-hidden">
                    <SettingRow label="Email" desc="Your sign-in email cannot be changed here.">
                      <span className="text-sm font-mono text-muted-foreground">{user?.email}</span>
                    </SettingRow>

                    <SettingRow label="Display name" desc="Shown to other community members.">
                      <input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your full name"
                        className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary w-52 text-right"
                      />
                    </SettingRow>

                    <SettingRow label="Username" desc="Your unique handle on CoFund.">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm text-muted-foreground">@</span>
                        <input
                          value={username}
                          onChange={(e) => setUsername(e.target.value.replace(/[^a-z0-9_]/gi, "").toLowerCase())}
                          placeholder="username"
                          className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary w-44 font-mono"
                        />
                      </div>
                    </SettingRow>

                    <SettingRow label="Occupation" desc="Your role or job title.">
                      <input
                        value={occupation}
                        onChange={(e) => setOccupation(e.target.value)}
                        placeholder="e.g. Angel investor"
                        className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary w-52 text-right"
                      />
                    </SettingRow>

                    <SettingRow label="City" desc="Where you're based.">
                      <input
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="e.g. Lagos"
                        className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary w-44 text-right"
                      />
                    </SettingRow>

                    <SettingRow label="Country" desc="Your primary investing jurisdiction.">
                      <select
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                      >
                        {["Nigeria", "Ghana", "Kenya", "South Africa", "United Kingdom", "United States", "Other"].map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </SettingRow>

                    <SettingRow label="Website" desc="Your personal or company website.">
                      <input
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="https://yoursite.com"
                        type="url"
                        className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary w-52 text-right"
                      />
                    </SettingRow>

                    <SettingRow label="LinkedIn" desc="Your LinkedIn profile URL.">
                      <input
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        placeholder="https://linkedin.com/in/…"
                        type="url"
                        className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary w-52 text-right"
                      />
                    </SettingRow>
                  </div>

                  {/* Bio */}
                  <div className="rounded-2xl border border-border bg-card overflow-hidden">
                    <div className="px-5 py-4 border-b border-border">
                      <p className="text-sm font-semibold">Bio</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">A short description visible on your public profile.</p>
                    </div>
                    <div className="px-5 py-4">
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        rows={4}
                        maxLength={500}
                        placeholder="Tell the community about yourself — your background, investment interests, or what you're building…"
                        className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary leading-relaxed"
                      />
                      <p className="mt-1.5 text-right text-xs text-muted-foreground">{bio.length}/500</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => void saveAccount.mutateAsync()}
                      disabled={saveAccount.isPending}
                      className="gradient-brand rounded-xl px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-brand disabled:opacity-50"
                    >
                      {saveAccount.isPending ? "Saving…" : "Save profile"}
                    </button>
                    <Link
                      to="/profile"
                      className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition"
                    >
                      View public profile <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              )}

              {/* ── Notifications ── */}
              {section === "notifications" && (
                <div className="space-y-6">
                  <SectionHeading title="Notifications" desc="Choose which emails and alerts CoFund sends you." />

                  <div className="divide-y divide-border rounded-2xl border border-border bg-card overflow-hidden">
                    {[
                      { key: "newDeals", label: "New investment opportunities", desc: "When a new verified deal goes live." },
                      { key: "investmentUpdates", label: "Investment updates", desc: "Milestones, returns, and round news from your holdings." },
                      { key: "communityActivity", label: "Community activity", desc: "Replies and mentions in the community feed." },
                      { key: "securityAlerts", label: "Security alerts", desc: "Sign-in attempts, 2FA, and account changes." },
                      { key: "marketingEmails", label: "Product news & tips", desc: "Feature releases, guides, and platform announcements." },
                    ].map(({ key, label, desc }) => (
                      <SettingRow key={key} label={label} desc={desc}>
                        <Toggle
                          on={notifs[key as keyof typeof notifs]}
                          onChange={(val) => patchNotif(key, val)}
                        />
                      </SettingRow>
                    ))}
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Security alerts cannot be disabled while your account has active investments or pending transactions.
                  </p>
                </div>
              )}

              {/* ── Investment preferences ── */}
              {section === "preferences" && (
                <div className="space-y-6">
                  <SectionHeading title="Investment preferences" desc="Help us surface the right opportunities for you." />

                  <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
                    <div>
                      <p className="text-sm font-bold mb-3">Preferred industries</p>
                      <div className="flex flex-wrap gap-2">
                        {industries.map((ind) => (
                          <button
                            key={ind}
                            type="button"
                            onClick={() => toggleIndustry(ind)}
                            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
                              investPrefs.industries.includes(ind)
                                ? "gradient-brand text-primary-foreground shadow-brand"
                                : "border border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                            }`}
                          >
                            {ind}
                          </button>
                        ))}
                      </div>
                      {investPrefs.industries.length > 0 && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          {investPrefs.industries.length} selected
                        </p>
                      )}
                    </div>

                    <div className="border-t border-border pt-5">
                      <p className="text-sm font-bold mb-3">Risk appetite</p>
                      <div className="space-y-2">
                        {riskLevels.map(({ value, label, metadata }) => { const desc = metadata?.desc ?? ""; return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => patchInvest({ riskLevel: value })}
                            className={`w-full flex items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition ${
                              investPrefs.riskLevel === value
                                ? "border-primary/30 bg-primary/5"
                                : "border-border hover:border-border/60"
                            }`}
                          >
                            <div className={`h-4 w-4 shrink-0 rounded-full border-2 flex items-center justify-center transition ${
                              investPrefs.riskLevel === value ? "border-primary" : "border-muted-foreground/40"
                            }`}>
                              {investPrefs.riskLevel === value && (
                                <div className="h-2 w-2 rounded-full bg-primary" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-bold">{label}</p>
                              <p className="text-xs text-muted-foreground">{desc}</p>
                            </div>
                          </button>
                        ); })}
                      </div>
                    </div>

                    <div className="border-t border-border pt-5">
                      <p className="text-sm font-bold mb-3">Minimum ticket size</p>
                      <div className="flex flex-wrap gap-2">
                        {minTickets.map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => patchInvest({ minTicket: amt })}
                            className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
                              investPrefs.minTicket === amt
                                ? "bg-foreground text-background"
                                : "border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
                            }`}
                          >
                            {amt}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-brand-green" />
                    Preferences saved automatically
                  </div>
                </div>
              )}

              {/* ── Appearance ── */}
              {section === "appearance" && (
                <div className="space-y-6">
                  <SectionHeading title="Appearance" desc="Personalise how CoFund looks on your device." />

                  <div className="divide-y divide-border rounded-2xl border border-border bg-card overflow-hidden">
                    <SettingRow label="Theme" desc="Switch between dark and light mode.">
                      <button
                        type="button"
                        onClick={toggle}
                        className="flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold hover:border-primary/40 transition"
                      >
                        {theme === "dark"
                          ? <><Sun className="h-4 w-4 text-amber-400" /> Light mode</>
                          : <><Moon className="h-4 w-4 text-primary" /> Dark mode</>}
                      </button>
                    </SettingRow>

                    <SettingRow label="Currency display" desc="Primary currency used across the platform.">
                      <span className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono text-muted-foreground">
                        NGN (₦)
                      </span>
                    </SettingRow>
                  </div>
                </div>
              )}

              {/* ── Security ── */}
              {section === "security" && (
                <div className="space-y-6">
                  <SectionHeading title="Security" desc="Protect your account and investment access." />

                  <div className="divide-y divide-border rounded-2xl border border-border bg-card overflow-hidden">
                    <LinkRow
                      label="Account security"
                      desc="Email verification, 2FA, and session management."
                      href="/security"
                    />
                    <LinkRow
                      label="Suitability assessment"
                      desc="Your investor appropriateness record and last score."
                      href="/suitability"
                    />
                    <LinkRow
                      label="Change password"
                      desc="Update your password via a magic link email."
                      href="/auth"
                    />
                  </div>

                  <div className="rounded-xl border border-border bg-secondary/30 px-5 py-4">
                    <div className="flex items-start gap-3">
                      <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        CoFund uses Supabase Auth with optional TOTP two-factor authentication. We never store plain-text passwords. Security events are logged and visible in the security center.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Danger zone ── */}
              {section === "danger" && (
                <div className="space-y-6">
                  <SectionHeading title="Danger zone" desc="Irreversible actions — proceed carefully." />

                  <div className="divide-y divide-border rounded-2xl border border-destructive/30 bg-destructive/5 overflow-hidden">
                    <SettingRow label="Sign out" desc="Sign out of CoFund on this device.">
                      <button
                        type="button"
                        onClick={() => void handleSignOut()}
                        className="flex items-center gap-2 rounded-xl border border-destructive/40 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 transition"
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </button>
                    </SettingRow>

                    <SettingRow
                      label="Delete account"
                      desc="Permanently remove your account, profile, and all personal data. This cannot be undone."
                    >
                      <button
                        type="button"
                        onClick={() => toast.error("To delete your account, contact support@cofund.africa with your registered email.", { duration: 6000 })}
                        className="rounded-xl border border-destructive/40 px-4 py-2 text-sm font-semibold text-destructive hover:bg-destructive/10 transition"
                      >
                        Request deletion
                      </button>
                    </SettingRow>
                  </div>

                  <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 px-5 py-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        If you have active investments or pending escrow balances, your account cannot be deleted until all positions are resolved. Contact our compliance team to discuss account closure.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function SectionHeading({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-1">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </div>
  );
}

function SettingRow({
  label,
  desc,
  children,
}: {
  label: string;
  desc: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed max-w-xs">{desc}</p>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function LinkRow({ label, desc, href }: { label: string; desc: string; href: string }) {
  return (
    <Link
      to={href as never}
      className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-secondary/30 transition-colors"
    >
      <div>
        <p className="text-sm font-semibold">{label}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{desc}</p>
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (val: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200 ${
        on ? "bg-primary" : "bg-secondary border border-border"
      }`}
    >
      <span
        className={`inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
          on ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
