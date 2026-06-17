import { createFileRoute } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/hooks/use-auth";
import { BadgeCheck, MapPin, Calendar, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Profile · CoFund" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { profile, roles, user } = useAuth();
  const initials = (profile?.full_name ?? user?.email ?? "U").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <header className="relative overflow-hidden border-b border-white/[0.06]">
        <div className="absolute inset-0 -z-10 gradient-mesh opacity-60" />
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center gap-5">
            <div className="gradient-brand flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-3xl font-bold text-white shadow-brand sm:h-24 sm:w-24">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-3xl font-bold sm:text-4xl">{profile?.full_name ?? "Your profile"}</h1>
                <BadgeCheck className="h-6 w-6 text-brand-green" />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Nigeria</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  Member since {new Date(user?.created_at ?? Date.now()).toLocaleDateString(undefined, { month: "long", year: "numeric" })}
                </span>
                <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-brand-green" /> Verified email</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          <section className="md:col-span-2 space-y-5">
            <Card title="Active roles">
              <div className="flex flex-wrap gap-2">
                {roles.length === 0
                  ? <span className="text-sm text-muted-foreground">No roles selected yet.</span>
                  : roles.map((r) => (
                    <span key={r} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium capitalize text-foreground">
                      {r.replace("_", " ")}
                    </span>
                  ))
                }
              </div>
            </Card>
            <Card title="About">
              <p className="text-sm text-muted-foreground">
                Add a short bio so members know what you're working on and what you're looking for.
              </p>
            </Card>
            <Card title="Activity">
              <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-muted-foreground">
                Your posts, comments and investments will appear here.
              </div>
            </Card>
          </section>
          <aside className="space-y-5">
            <Card title="Trust score">
              <p className="font-display text-4xl font-bold text-gradient-brand">—</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Complete BVN, phone, address and email verification to unlock your trust score.
              </p>
            </Card>
            <Card title="Reputation">
              <div className="space-y-3">
                <Row label="Helpful answers" value="0" />
                <Row label="Mentor sessions" value="0" />
                <Row label="Investments" value="0" />
              </div>
            </Card>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-card p-6">
      <h2 className="font-display text-base font-bold">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
