import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  MapPin,
  Calendar,
  Users,
  TrendingUp,
  ArrowLeft,
  UserPlus,
  UserCheck,
  MessageCircle,
  Briefcase,
  Globe,
  Linkedin,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/users/$username")({
  head: () => ({ meta: [{ title: "User Profile · CoFund" }] }),
  component: UserProfilePage,
});

type ProfileTab = "overview" | "followers" | "following";

const db = supabase as any;

function UserProfilePage() {
  const { username } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<ProfileTab>("overview");

  const profileQK = ["user-profile", username];
  const followQK = ["is-following", user?.id, username];

  const { data: profile, isLoading } = useQuery({
    queryKey: profileQK,
    queryFn: async () => {
      const { data, error } = await db
        .from("profiles")
        .select(
          "id,full_name,username,avatar_url,bio,location,city,country,occupation,linkedin_url,website_url,created_at,followers_count,following_count",
        )
        .eq("username", username)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data as {
        id: string;
        full_name: string | null;
        username: string | null;
        avatar_url: string | null;
        bio: string | null;
        location: string | null;
        city: string | null;
        country: string | null;
        occupation: string | null;
        linkedin_url: string | null;
        website_url: string | null;
        created_at: string;
        followers_count: number;
        following_count: number;
      };
    },
  });

  const { data: roles = [] } = useQuery({
    enabled: !!profile?.id,
    queryKey: ["user-roles", profile?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", profile!.id);
      return (data ?? []).map((r) => r.role as string);
    },
  });

  const { data: isFollowing = false } = useQuery({
    enabled: !!user?.id && !!profile?.id && user.id !== profile?.id,
    queryKey: followQK,
    queryFn: async () => {
      const { data } = await db
        .from("user_follows")
        .select("id")
        .eq("follower_id", user!.id)
        .eq("following_id", profile!.id)
        .maybeSingle();
      return !!data;
    },
  });

  // Investment count — graceful 0 if table doesn't exist yet
  const { data: investmentCount = 0 } = useQuery({
    enabled: !!profile?.id,
    queryKey: ["user-investment-count", profile?.id],
    queryFn: async () => {
      const { count } = await db
        .from("investment_commitments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile!.id)
        .in("status", ["funded", "in_escrow", "released"]);
      return (count as number | null) ?? 0;
    },
  });

  const followMutation = useMutation({
    mutationFn: async (shouldFollow: boolean) => {
      if (shouldFollow) {
        const { error } = await db
          .from("user_follows")
          .insert({ follower_id: user!.id, following_id: profile!.id });
        if (error) throw error;
      } else {
        const { error } = await db
          .from("user_follows")
          .delete()
          .eq("follower_id", user!.id)
          .eq("following_id", profile!.id);
        if (error) throw error;
      }
    },
    onMutate: async (shouldFollow) => {
      await qc.cancelQueries({ queryKey: profileQK });
      await qc.cancelQueries({ queryKey: followQK });

      const prevProfile = qc.getQueryData(profileQK);
      const prevFollow = qc.getQueryData(followQK);

      qc.setQueryData(profileQK, (old: any) =>
        old
          ? { ...old, followers_count: Math.max(0, old.followers_count + (shouldFollow ? 1 : -1)) }
          : old,
      );
      qc.setQueryData(followQK, shouldFollow);

      return { prevProfile, prevFollow };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevProfile) qc.setQueryData(profileQK, ctx.prevProfile);
      if (ctx?.prevFollow !== undefined) qc.setQueryData(followQK, ctx.prevFollow);
      toast.error("Could not update follow status.");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: profileQK });
      qc.invalidateQueries({ queryKey: followQK });
    },
  });

  if (isLoading) return <ProfileSkeleton />;
  if (!profile) return null;

  const isOwnProfile = user?.id === profile.id;
  const displayName = profile.full_name ?? profile.username ?? "Anonymous";
  const initial = displayName.charAt(0).toUpperCase();
  const locationStr = [profile.city, profile.country, profile.location].filter(Boolean).join(", ");
  const memberSince = new Date(profile.created_at).toLocaleDateString("en-NG", {
    month: "long",
    year: "numeric",
  });

  const TABS: { key: ProfileTab; label: string }[] = [
    { key: "overview", label: "Overview" },
    {
      key: "followers",
      label: `Followers${profile.followers_count ? ` (${profile.followers_count})` : ""}`,
    },
    {
      key: "following",
      label: `Following${profile.following_count ? ` (${profile.following_count})` : ""}`,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <div className="relative">
        <div className="gradient-mesh h-40 w-full sm:h-52" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />
        <div className="absolute left-4 top-4 sm:left-6">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-background/80 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm transition hover:bg-background"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back
          </button>
        </div>
      </div>

      {/* Identity bar */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="-mt-12 relative z-10 flex flex-col gap-4 pb-6 sm:flex-row sm:items-end sm:gap-6">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={displayName}
              className="h-24 w-24 rounded-2xl border-4 border-background object-cover shadow-soft"
            />
          ) : (
            <div className="gradient-brand flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-4 border-background text-3xl font-bold text-primary-foreground shadow-soft">
              {initial}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{displayName}</h1>
            {profile.username && (
              <p className="mt-0.5 text-sm text-muted-foreground">@{profile.username}</p>
            )}
            <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
              {locationStr && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {locationStr}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Joined {memberSince}
              </span>
            </div>
          </div>

          <div className="flex gap-2 sm:self-center">
            {isOwnProfile ? (
              <Link
                to="/profile"
                className="flex items-center gap-1.5 rounded-xl border border-primary px-4 py-2 text-sm font-semibold text-primary transition hover:bg-primary/5"
              >
                Edit profile
              </Link>
            ) : (
              <button
                onClick={() => followMutation.mutate(!isFollowing)}
                disabled={followMutation.isPending}
                className={`flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${
                  isFollowing
                    ? "border-brand-green bg-brand-green/10 text-brand-green"
                    : "border-border bg-card hover:bg-secondary"
                }`}
              >
                {isFollowing ? (
                  <>
                    <UserCheck className="h-4 w-4" /> Following
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" /> Follow
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="mb-6 grid grid-cols-3 divide-x divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {[
            { label: "Followers", value: profile.followers_count ?? 0, tab: "followers" as ProfileTab },
            { label: "Following", value: profile.following_count ?? 0, tab: "following" as ProfileTab },
            { label: "Investments", value: investmentCount, tab: null as ProfileTab | null },
          ].map(({ label, value, tab: t }) => (
            <button
              key={label}
              onClick={() => t && setTab(t)}
              className={`py-4 text-center transition ${t ? "hover:bg-secondary/40 cursor-pointer" : "cursor-default"}`}
            >
              <p className="font-display text-2xl font-bold">{value}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  tab === key
                    ? "gradient-brand text-white shadow-soft"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
          <div className="min-w-0">
            {tab === "overview" && (
              <OverviewTab profile={profile} roles={roles} />
            )}
            {tab === "followers" && (
              <FollowersList
                profileId={profile.id}
                currentUserId={user?.id}
                type="followers"
              />
            )}
            {tab === "following" && (
              <FollowersList
                profileId={profile.id}
                currentUserId={user?.id}
                type="following"
              />
            )}
          </div>
          <aside className="hidden lg:block">
            <ProfileSidebar profile={profile} roles={roles} />
          </aside>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}

function RoleChip({ role }: { role: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/8 px-2.5 py-0.5 text-[10px] font-semibold capitalize text-primary">
      {role.replace(/_/g, " ")}
    </span>
  );
}

function OverviewTab({ profile, roles }: { profile: any; roles: string[] }) {
  const { data: recentPosts = [] } = useQuery({
    queryKey: ["user-posts", profile.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("posts")
        .select("id,content,created_at,category")
        .eq("author_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="space-y-8">
      {/* Bio */}
      {profile.bio && (
        <section>
          <h2 className="mb-3 font-display text-lg font-bold">About</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
            {profile.bio}
          </p>
        </section>
      )}

      {/* Roles */}
      {roles.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-lg font-bold">Roles</h2>
          <div className="flex flex-wrap gap-2">
            {roles.map((r) => (
              <RoleChip key={r} role={r} />
            ))}
          </div>
        </section>
      )}

      {/* Activity stats */}
      <section>
        <h2 className="mb-3 font-display text-lg font-bold">Activity</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[
            { icon: Users, label: "Followers", value: profile.followers_count ?? 0 },
            { icon: TrendingUp, label: "Following", value: profile.following_count ?? 0 },
            { icon: MessageCircle, label: "Posts", value: recentPosts.length },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-2xl border border-border bg-card p-4 shadow-card">
              <div className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <p className="font-display text-2xl font-extrabold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recent posts */}
      {recentPosts.length > 0 && (
        <section>
          <h2 className="mb-4 font-display text-lg font-bold">Recent posts</h2>
          <div className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border bg-card">
            {recentPosts.map((post: any) => (
              <div key={post.id} className="px-5 py-4">
                <p className="line-clamp-3 text-sm leading-relaxed text-foreground">
                  {post.content}
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  {post.category && (
                    <span className="rounded-full border border-border px-2 py-0.5 capitalize">
                      {post.category}
                    </span>
                  )}
                  <span>
                    {new Date(post.created_at).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {recentPosts.length === 0 && !profile.bio && roles.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
          <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
          <p className="text-sm font-semibold">Nothing here yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            This user hasn't shared anything yet.
          </p>
        </div>
      )}
    </div>
  );
}

function FollowersList({
  profileId,
  currentUserId,
  type,
}: {
  profileId: string;
  currentUserId: string | undefined;
  type: "followers" | "following";
}) {
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["user-follows-list", profileId, type],
    queryFn: async () => {
      // Step 1: fetch the user IDs from the junction table
      // (user_follows FKs point to auth.users, not profiles, so we cannot embed profiles directly)
      const idCol = type === "followers" ? "follower_id" : "following_id";
      const filterCol = type === "followers" ? "following_id" : "follower_id";

      const { data: followRows } = await db
        .from("user_follows")
        .select(idCol)
        .eq(filterCol, profileId)
        .order("created_at", { ascending: false })
        .limit(50);

      const ids: string[] = (followRows ?? []).map((r: any) => r[idCol]).filter(Boolean);
      if (!ids.length) return [];

      // Step 2: fetch profile data for those IDs
      const { data: profileRows } = await db
        .from("profiles")
        .select("id,full_name,username,avatar_url,bio,followers_count")
        .in("id", ids);

      // Step 3: batch-fetch roles
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

      // Preserve follow order
      const profileMap = new Map((profileRows ?? []).map((p: any) => [p.id, p]));
      return ids
        .map((id) => profileMap.get(id))
        .filter(Boolean)
        .map((p: any) => ({ ...p, roles: rolesMap.get(p.id) ?? [] }));
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
          >
            <div className="h-12 w-12 animate-pulse rounded-full bg-secondary" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 animate-pulse rounded bg-secondary" />
              <div className="h-2.5 w-48 animate-pulse rounded bg-secondary" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
        <Users className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm font-semibold">
          {type === "followers" ? "No followers yet" : "Not following anyone yet"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {type === "followers"
            ? "Be the first to follow this user."
            : "They haven't followed anyone yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {users.map((u: any) => (
        <UserCard key={u.id} user={u} currentUserId={currentUserId} />
      ))}
    </div>
  );
}

function UserCard({
  user,
  currentUserId,
}: {
  user: { id: string; full_name: string | null; username: string | null; avatar_url: string | null; bio: string | null; followers_count: number; roles: string[] };
  currentUserId: string | undefined;
}) {
  const qc = useQueryClient();
  const followQK = ["is-following", currentUserId, user.id];

  const { data: isFollowing = false } = useQuery({
    enabled: !!currentUserId && currentUserId !== user.id,
    queryKey: followQK,
    queryFn: async () => {
      const { data } = await db
        .from("user_follows")
        .select("id")
        .eq("follower_id", currentUserId)
        .eq("following_id", user.id)
        .maybeSingle();
      return !!data;
    },
  });

  const followMutation = useMutation({
    mutationFn: async (shouldFollow: boolean) => {
      if (shouldFollow) {
        const { error } = await db
          .from("user_follows")
          .insert({ follower_id: currentUserId, following_id: user.id });
        if (error) throw error;
      } else {
        const { error } = await db
          .from("user_follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", user.id);
        if (error) throw error;
      }
    },
    onMutate: async (shouldFollow) => {
      await qc.cancelQueries({ queryKey: followQK });
      const prev = qc.getQueryData(followQK);
      qc.setQueryData(followQK, shouldFollow);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev !== undefined) qc.setQueryData(followQK, ctx.prev);
      toast.error("Could not update follow status.");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: followQK });
    },
  });

  const displayName = user.full_name ?? user.username ?? "Member";
  const initial = displayName.charAt(0).toUpperCase();
  const isOwnCard = currentUserId === user.id;

  return (
    <div className="flex items-start gap-4 rounded-2xl border border-border bg-card p-4 shadow-card">
      {user.avatar_url ? (
        <img
          src={user.avatar_url}
          alt=""
          className="h-12 w-12 shrink-0 rounded-full object-cover"
        />
      ) : (
        <div className="gradient-brand flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-sm font-bold text-primary-foreground">
          {initial}
        </div>
      )}

      <div className="min-w-0 flex-1">
        {user.username ? (
          <Link
            to="/users/$username"
            params={{ username: user.username }}
            className="font-semibold transition-colors hover:text-primary"
          >
            {displayName}
          </Link>
        ) : (
          <p className="font-semibold">{displayName}</p>
        )}
        {user.username && (
          <p className="text-xs text-muted-foreground">@{user.username}</p>
        )}
        {/* Role chips */}
        {user.roles.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {user.roles.slice(0, 3).map((r) => (
              <RoleChip key={r} role={r} />
            ))}
          </div>
        )}
        {user.bio && (
          <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{user.bio}</p>
        )}
        {user.followers_count > 0 && (
          <p className="mt-0.5 text-xs text-muted-foreground">{user.followers_count} followers</p>
        )}
      </div>

      {!isOwnCard && !!currentUserId && (
        <button
          onClick={() => followMutation.mutate(!isFollowing)}
          disabled={followMutation.isPending}
          className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
            isFollowing
              ? "border-brand-green bg-brand-green/10 text-brand-green"
              : "border-border bg-background hover:bg-secondary"
          }`}
        >
          {isFollowing ? (
            <>
              <UserCheck className="h-3.5 w-3.5" /> Following
            </>
          ) : (
            <>
              <UserPlus className="h-3.5 w-3.5" /> Follow
            </>
          )}
        </button>
      )}
    </div>
  );
}

function ProfileSidebar({ profile, roles }: { profile: any; roles: string[] }) {
  return (
    <div className="sticky top-24 space-y-4">
      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          About
        </p>
        <dl className="flex flex-col gap-3">
          {profile.occupation && (
            <div className="flex items-start gap-2.5">
              <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-sm">{profile.occupation}</span>
            </div>
          )}
          {(profile.city || profile.country || profile.location) && (
            <div className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="text-sm">
                {[profile.city, profile.country, profile.location].filter(Boolean).join(", ")}
              </span>
            </div>
          )}
          {profile.website_url && (
            <div className="flex items-start gap-2.5">
              <Globe className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <a
                href={profile.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-sm text-primary hover:underline"
              >
                {profile.website_url.replace(/^https?:\/\//, "")}
              </a>
            </div>
          )}
          {profile.linkedin_url && (
            <div className="flex items-start gap-2.5">
              <Linkedin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                LinkedIn
              </a>
            </div>
          )}
        </dl>
      </div>

      {roles.length > 0 && (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Roles
          </p>
          <div className="flex flex-wrap gap-2">
            {roles.map((r) => (
              <RoleChip key={r} role={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="gradient-mesh h-40 w-full animate-pulse sm:h-52" />
      <div className="relative z-10 mx-auto -mt-12 max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="flex items-end gap-4 pb-6">
          <div className="h-24 w-24 animate-pulse rounded-2xl border-4 border-background bg-secondary" />
          <div className="flex-1 space-y-2 pb-2">
            <div className="h-7 w-48 animate-pulse rounded bg-secondary" />
            <div className="h-4 w-32 animate-pulse rounded bg-secondary" />
          </div>
        </div>
        <div className="mb-6 h-20 animate-pulse rounded-2xl bg-secondary" />
      </div>
    </div>
  );
}
