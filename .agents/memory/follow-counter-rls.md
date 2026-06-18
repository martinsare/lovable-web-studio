---
name: Follow counter RLS pattern
description: How to correctly update follower/following counts when RLS prevents client from writing to other users' rows.
---

## Rule
Never update `profiles.followers_count` / `profiles.following_count` directly from the client.
RLS on `profiles` allows UPDATE only when `auth.uid() = id`, so updating the *target* user's count silently fails.

## How to apply
Add SECURITY DEFINER trigger functions on the junction table (e.g. `user_follows`):
- AFTER INSERT → increment both `followers_count` (following_id's row) and `following_count` (follower_id's row)
- AFTER DELETE → decrement both (GREATEST(0, count - 1) to avoid negatives)

The client only needs to INSERT/DELETE from `user_follows` (which its own RLS allows).
Counts are updated atomically server-side by the trigger.

**Why:** Supabase JS client runs as the authenticated user and cannot bypass RLS. SECURITY DEFINER functions run as the definer (postgres) and bypass RLS.

**How to apply:** Always pair a many-to-many follow table with SECURITY DEFINER triggers when maintaining denormalized counts on `profiles`.
