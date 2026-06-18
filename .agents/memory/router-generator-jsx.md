---
name: TanStack router-generator JSX quirk
description: The router-generator plugin fails when JSX is defined in variables before the return statement in route files
---

# TanStack Router Generator JSX Quirk

## The rule
Never define JSX variables (e.g. `const x = (<div>...</div>)`) before the `return` statement inside a route component function. The `@tanstack/router-generator` plugin parses route files with a simplified JSX parser that miscounts tag nesting when JSX appears outside of a `return` statement.

## Error symptom
```
Error: Error transforming route file /path/to/route.tsx: SyntaxError: Expected corresponding JSX closing tag for <ComponentName>. (306:6)
```

## Fix
Move JSX into the return statement itself, or extract it into a separate component function defined outside the route component.

**Bad:**
```tsx
function MyPage() {
  const actions = (<div>...</div>); // ← breaks router-generator
  return <PageShell actions={actions}>...</PageShell>;
}
```

**Good:**
```tsx
function MyPage() {
  return <PageShell actions={<Actions />}>...</PageShell>; // inline or separate component
}
function Actions() { return <div>...</div>; }
```

**Why:** The router-generator plugin uses a non-TypeScript-aware AST parser to find route exports. JSX outside the `return` statement confuses its tag-matching logic, even if the actual TypeScript/JSX is syntactically valid.
