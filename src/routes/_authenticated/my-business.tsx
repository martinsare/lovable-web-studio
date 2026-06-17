import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export const Route = createFileRoute("/_authenticated/my-business")({
  head: () => ({ meta: [{ title: "My Business · CoFund" }] }),
  component: () => (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-extrabold">My Business</h1>
        <p className="mt-2 text-muted-foreground">Business Passport, funding rounds, investor updates. Coming next.</p>
      </main>
      <SiteFooter />
    </div>
  ),
});