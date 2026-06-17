import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export function PageShell({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <header className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 -z-10 gradient-mesh opacity-60" />
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          <div className="flex items-end justify-between gap-4">
            <div className="min-w-0">
              {eyebrow && (
                <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-primary">{eyebrow}</p>
              )}
              <h1 className="font-display text-3xl font-bold sm:text-4xl">{title}</h1>
              {description && (
                <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>
              )}
            </div>
            {actions && <div className="shrink-0">{actions}</div>}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      <SiteFooter />
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-card/40 p-12 text-center">
      <p className="font-display text-base font-semibold">{title}</p>
      {hint && <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SkeletonCards({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-48 animate-pulse rounded-2xl bg-card" />
      ))}
    </div>
  );
}
