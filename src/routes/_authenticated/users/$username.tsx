import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/app-layout";
import {
  MapPin,
  Calendar,
  Users,
  UserPlus,
  UserCheck,
  Briefcase,
  Globe,
  Link2,
  BadgeCheck,
  MessageCircle,
} from "lucide-react";
import { toast } from "sonner";

const db = supabase as any;

export const Route = createFileRoute("/_authenticated/users/$username")({
  head: () => ({ meta: [{ title: "User Profile · CoFund" }] }),
  component: UserProfilePage,
});

type ProfileTab = "overview" | "followers" | "following";

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
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id,full_name,username,avatar_url,bio,location,city,country,occupation,linkedin_url,website_url,created_at,onboarded",
        )
        .eq("username", username)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  const { data: followerCount = 0 } = useQuery({
    enabled: !!profile?.id,
    queryKey: ["follower-count", profile?.id],
    queryFn: async () => {
      const { count } = await db
        .from("user_follows")
        .select("id", { count: "exact", head: true })
        .eq("following_id", profile!.id);
      return (count as number | null) ?? 0;
    },
  });

  const { data: followingCount = 0 } = useQuery({
    enabled: !!profile?.id,
    queryKey: ["following-count", profile?.id],
    queryFn: async () => {
      const { count } = await db
        .from("user_follows")
        .select("id", { count: "exact", head: true })
        .eq("follower_id", profile!.id);
      return (count as number | null) ?? 0;
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
      const followerCountQK = ["follower-count", profile?.id];
      await qc.cancelQueries({ queryKey: followQK });
      await qc.cancelQueries({ queryKey: followerCountQK });
      const prevFollow = qc.getQueryData(followQK);
      const prevCount = qc.getQueryData<number>(followerCountQK) ?? 0;
      qc.setQueryData(followQK, shouldFollow);
      qc.setQueryData(followerCountQK, Math.max(0, prevCount + (shouldFollow ? 1 : -1)));
      return { prevFollow, prevCount };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prevFollow !== undefined) qc.setQueryData(followQK, ctx.prevFollow);
      if (ctx?.prevCount !== undefined)
        qc.setQueryData(["follower-count", profile?.id], ctx.prevCount);
      toast.error("Could not update follow status.");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: followQK });
      qc.invalidateQueries({ queryKey: ["follower-count", profile?.id] });
    },
  });

  if (isLoading) return <ProfileSkeleton />;
  if (!profile) return null;

  const isOwnProfile = user?.id === profile.id;
  const displayName = profile.full_name ?? profile.username ?? "Anonymous";
  const initial = displayName.charAt(0).toUpperCase();
  const locationStr = [profile.city, profile.country, profile.location]
    .filter(Boolean)
    .join(", ");
  const memberSince = new Date(profile.created_at).toLocaleDateString("en-NG", {
    month: "long",
    year: "numeric",
  });

  const TABS: { key: ProfileTab; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "followers", label: `Followers${followerCount > 0 ? ` · ${followerCount}` : ""}` },
    { key: "following", label: `Following${followingCount > 0 ? ` · ${followingCount}` : ""}` },
  ];

  return (
    <AppLayout>
      {/* ── Banner ── */}
      <div className="relative h-36 w-full overflow-hidden sm:h-48">
        <div className="gradient-mesh h-full w-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
      </div>

      {/* ── Identity ── */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="-mt-14 flex flex-col gap-5 sm:flex-row sm:items-end sm:gap-6 pb-6">
          {/* Avatar */}
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={displayName}
              className="h-24 w-24 shrink-0 rounded-2xl ring-2 ring-border object-cover"
            />
          ) : (
            <div className="gradient-brand flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl ring-2 ring-border text-3xl font-bold text-primary-foreground">
              {initial}
            </div>
          )}

          {/* Name + meta */}
          <div className="min-w-0 flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-extrabold sm:text-3xl">{displayName}</h1>
              {profile.onboarded && (
                <span title="Verified member" className="inline-flex items-center gap-1 rounded-full bg-brand-green/10 px-2.5 py-1 text-xs font-bold text-brand-green">
                  <BadgeCheck className="h-3.5 w-3.5" /> Verified
                </span>
              )}
              {roles.map((r) => (
                <RoleChip key={r} role={r} />
              ))}
            </div>
            {profile.username && (
              <p className="mt-0.5 text-sm text-muted-foreground">@{profile.username}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
              {locationStr && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {locationStr}
                </span>
              )}
              {profile.occupation && (
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3.5 w-3.5" /> {profile.occupation}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> Joined {memberSince}
              </span>
            </div>

            {/* Inline stats + links */}
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm">
              <button
                type="button"
                onClick={() => setTab("followers")}
                className="font-semibold hover:text-primary transition-colors"
              >
                <span className="font-bold">{followerCount}</span>{" "}
                <span className="text-muted-foreground font-normal">followers</span>
              </button>
              <button
                type="button"
                onClick={() => setTab("following")}
                className="font-semibold hover:text-primary transition-colors"
              >
                <span className="font-bold">{followingCount}</span>{" "}
                <span className="text-muted-foreground font-normal">following</span>
              </button>
              <span>
                <span className="font-bold">{investmentCount}</span>{" "}
                <span className="text-sm text-muted-foreground font-normal">investments</span>
              </span>
              {profile.website_url && (
                <a
                  href={profile.website_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <Globe className="h-3.5 w-3.5" />
                  {profile.website_url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </a>
              )}
              {profile.linkedin_url && (
                <a
                  href={profile.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  <Link2 className="h-3.5 w-3.5" /> LinkedIn
                </a>
              )}
            </div>
          </div>

          {/* CTA */}
          <div className="sm:self-end sm:pb-1 flex items-center gap-2">
            {isOwnProfile ? (
              <Link
                to="/profile"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold transition hover:bg-secondary"
              >
                Edit profile
              </Link>
            ) : (
              <>
                <MessageButton userId={user?.id ?? ""} otherUserId={profile.id} />
                <button
                  onClick={() => followMutation.mutate(!isFollowing)}
                  disabled={followMutation.isPending}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${
                    isFollowing
                      ? "border-brand-green bg-brand-green/10 text-brand-green"
                      : "gradient-brand border-transparent text-primary-foreground shadow-brand hover:opacity-90"
                  }`}
                >
                  {isFollowing ? (
                    <><UserCheck className="h-4 w-4" /> Following</>
                  ) : (
                    <><UserPlus className="h-4 w-4" /> Follow</>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Tab bar ── */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-0 overflow-x-auto scrollbar-hide">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`flex shrink-0 items-center border-b-2 px-5 py-3.5 text-sm font-semibold transition-colors ${
                  tab === key
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {tab === "overview" && (
          <OverviewTab profile={profile} />
        )}
        {tab === "followers" && (
          <FollowersList profileId={profile.id} currentUserId={user?.id} type="followers" />
        )}
        {tab === "following" && (
          <FollowersList profileId={profile.id} currentUserId={user?.id} type="following" />
        )}
      </div>

    </AppLayout>
  );
}

function RoleChip({ role }: { role: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
      {role.replace(/_/g, " ")}
    </span>
  );
}

function OverviewTab({ profile }: { profile: any }) {
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

  const isEmpty = !profile.bio && recentPosts.length === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary text-muted-foreground/40">
          <Users className="h-6 w-6" />
        </div>
        <p className="font-display text-base font-semibold">Nothing shared yet</p>
        <p className="mt-1.5 text-sm text-muted-foreground">
          This member hasn't posted anything yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10 max-w-2xl">
      {profile.bio && (
        <section>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/80">
            {profile.bio}
          </p>
        </section>
      )}

      {recentPosts.length > 0 && (
        <section>
          <p className="mb-5 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
            Recent posts
          </p>
          <div className="divide-y divide-border/60">
            {recentPosts.map((post: any) => (
              <div key={post.id} className="py-5 first:pt-0 last:pb-0">
                <p className="text-sm leading-relaxed text-foreground line-clamp-4">
                  {post.content}
                </p>
                <div className="mt-3 flex items-center gap-3">
                  {post.category && (
                    <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] font-semibold capitalize text-muted-foreground">
                      {post.category}
                    </span>
                  )}
                  <time className="text-xs text-muted-foreground">
                    {new Date(post.created_at).toLocaleDateString("en-NG", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </time>
                </div>
              </div>
            ))}
          </div>
        </section>
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

      const { data: profileRows } = await db
        .from("profiles")
        .select("id,full_name,username,avatar_url,bio,followers_count")
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
      <div className="divide-y divide-border/60">
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
            ? "Be the first to follow this user."
            : "They haven't followed anyone yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/60 max-w-2xl">
      {users.map((u: any) => (
        <UserRow key={u.id} user={u} currentUserId={currentUserId} />
      ))}
    </div>
  );
}

function UserRow({
  user,
  currentUserId,
}: {
  user: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    bio: string | null;
    followers_count: number;
    roles: string[];
  };
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
    <div className="flex items-center gap-4 py-4 first:pt-0">
      {user.username ? (
        <Link to="/users/$username" params={{ username: user.username }} className="shrink-0">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt=""
              className="h-11 w-11 rounded-full object-cover transition hover:opacity-80"
            />
          ) : (
            <div className="gradient-brand flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold text-primary-foreground transition hover:opacity-80">
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
          {user.roles.slice(0, 2).map((r) => (
            <RoleChip key={r} role={r} />
          ))}
        </div>
        {user.username && (
          <p className="text-xs text-muted-foreground">@{user.username}</p>
        )}
        {user.bio && (
          <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{user.bio}</p>
        )}
      </div>

      {!isOwnCard && !!currentUserId && (
        <button
          onClick={() => followMutation.mutate(!isFollowing)}
          disabled={followMutation.isPending}
          className={`shrink-0 inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${
            isFollowing
              ? "border-brand-green bg-brand-green/10 text-brand-green"
              : "border-border bg-card hover:bg-secondary"
          }`}
        >
          {isFollowing ? (
            <><UserCheck className="h-3.5 w-3.5" /> Following</>
          ) : (
            <><UserPlus className="h-3.5 w-3.5" /> Follow</>
          )}
        </button>
      )}
    </div>
  );
}

function MessageButton({ userId, otherUserId }: { userId: string; otherUserId: string }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function handleMessage() {
    if (!userId || !otherUserId) return;
    setLoading(true);
    try {
      const a = userId < otherUserId ? userId : otherUserId;
      const b = userId < otherUserId ? otherUserId : userId;
      const { data: existing } = await db
        .from("conversations")
        .select("id")
        .eq("participant_a", a)
        .eq("participant_b", b)
        .maybeSingle();

      let conversationId: string;
      if (existing) {
        conversationId = existing.id;
      } else {
        const { data: created, error } = await db
          .from("conversations")
          .insert({ participant_a: a, participant_b: b })
          .select("id")
          .single();
        if (error) throw error;
        conversationId = created.id;
      }
      navigate({ to: "/messages/$conversationId", params: { conversationId } });
    } catch {
      toast.error("Could not open conversation");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleMessage}
      disabled={loading}
      className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold transition hover:bg-secondary disabled:opacity-60"
    >
      <MessageCircle className="h-4 w-4" />
      Message
    </button>
  );
}

function ProfileSkeleton() {
  return (
    <AppLayout>
      <div className="h-36 w-full animate-pulse gradient-mesh sm:h-48" />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="-mt-14 flex items-end gap-5 pb-6">
          <div className="h-24 w-24 animate-pulse shrink-0 rounded-2xl border-4 border-background bg-secondary" />
          <div className="flex-1 space-y-2.5 pb-1">
            <div className="h-7 w-44 animate-pulse rounded bg-secondary" />
            <div className="h-4 w-28 animate-pulse rounded bg-secondary" />
            <div className="h-3 w-64 animate-pulse rounded bg-secondary" />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
