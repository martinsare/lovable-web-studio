import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export function LegalPage({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <header className="relative overflow-hidden border-b border-border bg-secondary/40">
        <div className="absolute inset-0 -z-10 gradient-mesh opacity-60" />
        <motion.div
          className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">{eyebrow}</p>
          <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-5xl">{title}</h1>
          {intro && <p className="mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">{intro}</p>}
        </motion.div>
      </header>
      <motion.main
        className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, delay: 0.05, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="prose-cofund space-y-6 text-[15px] leading-relaxed text-foreground/90">
          {children}
        </div>
        <p className="mt-12 text-xs text-muted-foreground">
          Last updated {new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}
        </p>
      </motion.main>
      <SiteFooter />
    </div>
  );
}

export function H2({ children }: { children: ReactNode }) {
  return <h2 className="font-display text-xl font-bold text-foreground sm:text-2xl">{children}</h2>;
}
