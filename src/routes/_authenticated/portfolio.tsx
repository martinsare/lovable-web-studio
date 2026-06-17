import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/_authenticated/portfolio")({
  head: () => ({ meta: [{ title: "My Portfolio · CoFund" }] }),
  component: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-extrabold">My Portfolio</h1>
        <p className="mt-2 text-muted-foreground">Your investments, returns, and circles. Coming next.</p>
      </main>
      <SiteFooter />
    </div>
  ),
});