---
name: New tables not in generated types
description: Tables added after the last type generation are not in supabase/types.ts.
---

## Rule
Any table added after the Supabase types were last generated (`user_follows`, `reference_data`, `user_watchlist`, `verification_sessions`, `business_entities`) is not in `src/integrations/supabase/types.ts`. 
Use `const db = supabase as any` and call `db.from(...)` for these tables.

**Why:** Types are generated from the Supabase schema snapshot; they are not auto-updated when migrations run manually via SQL Editor.

**How to apply:** When a query touches a new table that TypeScript complains about, cast `supabase as any`. Do not try to update types.ts manually unless regenerating from Supabase CLI.
