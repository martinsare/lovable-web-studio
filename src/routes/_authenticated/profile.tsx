import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile · CoFund" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, roles, user } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-extrabold">{profile?.full_name ?? "Your profile"}</h1>
        <p className="mt-1 text-muted-foreground">{user?.email}</p>
        <div className="mt-6 rounded-2xl border border-border bg-card p-6">
          <h2 className="font-display text-lg font-bold">Active roles</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {roles.length === 0 && <span className="text-sm text-muted-foreground">No roles selected.</span>}
            {roles.map((r) => (
              <span key={r} className="rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium capitalize">
                {r.replace("_", " ")}
              </span>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}