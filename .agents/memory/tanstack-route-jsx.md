---
name: TanStack route JSX constraint
description: Critical constraint on route file structure to avoid transform errors.
---

## Rule
Never define JSX variables (e.g. `const el = <div>...</div>`) before the `return` statement inside a route component function. The TanStack Start route file transformer chokes on this pattern.

**Why:** The Vite plugin that transforms route files uses a regex/AST pass that misinterprets top-level JSX variable assignments.

**How to apply:** Always extract sub-components as named functions (outside the route component), or inline JSX only inside return statements.
