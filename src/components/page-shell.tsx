import type { ReactNode } from "react";
import { AppLayout } from "@/components/app-layout";

export function PageShell({
  eyebrow,
  title,
  description,
  actions,
  children,
  noPadding = false,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  noPadding?: boolean;
}) {
  return (
    <AppLayout>
      <div className="min-h-full">
        <div className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur-xl">
          <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-6">
              <div className="min-w-0">
                {eyebrow && (
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
                )}
                <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
                {description && (
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed max-w-xl">{description}</p>
                )}
              </div>
              {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
            </div>
          </div>
        </div>
        <div className={noPadding ? "" : "mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8"}>
          {children}
        </div>
      </div>
    </AppLayout>
  );
}

export function EmptyState({ title, hint, icon }: { title: string; hint?: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 p-16 text-center">
      {icon && <div className="mb-4 text-muted-foreground/50">{icon}</div>}
      <p className="font-display text-base font-semibold text-foreground">{title}</p>
      {hint && (
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground leading-relaxed">{hint}</p>
      )}
    </div>
  );
}

export function SkeletonCards({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-52 animate-pulse rounded-2xl bg-card" />
      ))}
    </div>
  );
}

export function StatCard({
  label,
  value,
  icon,
  color = "primary",
  sub,
}: {
  label: string;
  value: string | number;
  icon: ReactNode;
  color?: "primary" | "green" | "gold" | "purple" | "red";
  sub?: string;
}) {
  const colorMap = {
    primary: "bg-primary/10 text-primary",
    green: "bg-brand-green/10 text-brand-green",
    gold: "bg-gold/10 text-gold",
    purple: "bg-purple-500/10 text-purple-400",
    red: "bg-destructive/10 text-destructive",
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl ${colorMap[color]}`}>
        {icon}
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold">{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
