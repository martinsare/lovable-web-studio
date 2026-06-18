---
name: CoFund design system
description: Design token conventions, utilities, and page layout patterns for CoFund
---

# Design system

## Fonts
- Display/headings: Plus Jakarta Sans via `font-display` class
- Body: Inter (default)

## Key CSS utilities (src/styles.css)
- `gradient-brand` — electric teal → green gradient (primary CTA)
- `gradient-hero` — subtle dark mesh for hero backgrounds
- `gradient-mesh` — animated mesh for cover areas
- `glass` — glass morphism card
- `shadow-brand` — brand-colored glow shadow
- `shadow-card` — subtle card shadow
- `shadow-elevated` — deeper card shadow

## Color tokens
- `--primary`: electric teal (oklch)
- `--brand-green`: green for positive metrics, growth
- `--gold`: gold for premium/returns
- Semantic: green = positive, amber = pending/caution, red = danger

## Layout conventions
- Authenticated pages: use `<AppLayout>` directly (sidebar + topbar)
- `<PageShell>` = AppLayout + sticky page header (eyebrow, title, description, actions)
- Public pages only: `<SiteHeader>` + `<SiteFooter>`
- Max content width: `max-w-6xl` (most pages), `max-w-5xl` (profile)

## Anti-patterns to avoid
- Do NOT nest cards inside cards — use section dividers with labels instead
- Do NOT wrap every stat in a card — use horizontal strips with dividers
- Do NOT use JSX variables (const x = <div>...) before return in route files (breaks router-generator)
- Use list rows (divide-y divide-border) instead of card grids for tabular data

## Page patterns
- **Hero section**: full-width gradient, big number as focal point, flat stats strip below
- **Section labels**: `text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground`
- **Tabs**: `border-b-2 -mb-px` pattern, border-primary when active
- **Empty states**: dashed border, centered icon + text, CTA button

**Why:** User feedback that "card card card" design felt generic and emotionless. Investment platforms should feel like Robinhood/Republic — big meaningful numbers, emotional color, intentional information architecture.
