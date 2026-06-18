import { supabase } from "@/integrations/supabase/client";

export type FeedPost = {
  id: string;
  author_id: string;
  content: string;
  created_at: string;
  category?: string | null;
  business_id?: string | null;
  profile: {
    full_name: string | null;
    avatar_url?: string | null;
  } | null;
};

export async function fetchPostsWithAuthors(limit: number, businessId?: string) {
  let query = supabase
    .from("posts")
    .select("id,author_id,content,created_at,category,business_id")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (businessId) {
    query = query.eq("business_id", businessId);
  }

  const { data: posts, error } = await query;
  if (error) throw error;
  if (!posts?.length) return [] satisfies FeedPost[];

  const authorIds = [...new Set(posts.map((post) => post.author_id).filter(Boolean))];
  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("id,full_name,avatar_url")
    .in("id", authorIds);

  if (profileError) throw profileError;

  const profileMap = new Map(
    (profiles ?? []).map((profile) => [
      profile.id,
      {
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
      },
    ]),
  );

  return posts.map((post) => ({
    ...post,
    profile: profileMap.get(post.author_id) ?? null,
  })) satisfies FeedPost[];
}
