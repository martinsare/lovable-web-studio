import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageShell, EmptyState } from "@/components/page-shell";
import { Building2, ShieldCheck, FileText, Coins, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/my-business")({
  head: () => ({ meta: [{ title: "My Business · CoFund" }] }),
  component: MyBusiness,
});

function MyBusiness() {
  const { user } = useAuth();
  const { data, isLoading } = useQuery({
    enabled: !!user,
    queryKey: ["my-business", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id,name,industry,tagline,logo_url,verified,trust_score,followers_count,founded_year")
        .eq("owner_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <PageShell
      eyebrow="Founder"
      title="My Business"
      description="Your Business Passport, funding rounds, investor updates and reputation — in one workspace."
      actions={
        <button className="gradient-brand hidden rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-soft sm:inline-flex">
          + New business
        </button>
      }
    >
      {isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl border border-border bg-card" />
      ) : !data || data.length === 0 ? (
        <div>
          <EmptyState
            title="You haven't created a Business Passport yet"
            hint="A Business Passport is your verified profile on CoFund — branding, story, products, financials, trust score, and funding history."
          />
          <section className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              { icon: Building2, t: "Business Passport", d: "Logo, story, products, team and gallery." },
              { icon: ShieldCheck, t: "Trust Score", d: "Verification, reporting and milestones build your score." },
              { icon: Coins, t: "Funding Rounds", d: "Create and manage rounds with escrow protection." },
            ].map((c) => (
              <div key={c.t} className="rounded-2xl border border-border bg-card p-5">
                <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <c.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-base font-bold">{c.t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{c.d}</p>
              </div>
            ))}
          </section>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {data.map((b: any) => (
            <article key={b.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
              <div className="flex items-center gap-3">
                {b.logo_url ? (
                  <img src={b.logo_url} alt="" className="h-12 w-12 rounded-xl object-cover" />
                ) : (
                  <div className="gradient-brand flex h-12 w-12 items-center justify-center rounded-xl text-white">
                    <Building2 className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <h3 className="truncate font-display text-base font-bold">{b.name}</h3>
                  <p className="truncate text-xs text-muted-foreground">{b.industry}</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <Mini label="Trust" value={b.trust_score ?? "—"} />
                <Mini label="Followers" value={b.followers_count ?? 0} icon={Users} />
                <Mini label="Founded" value={b.founded_year ?? "—"} icon={FileText} />
              </div>
            </article>
          ))}
        </div>
      )}
    </PageShell>
  );
}

function Mini({ label, value, icon: Icon }: { label: string; value: any; icon?: any }) {
  return (
    <div className="rounded-xl bg-secondary/60 p-3">
      <p className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" />} {label}
      </p>
      <p className="mt-1 font-display text-base font-bold">{value}</p>
    </div>
  );
}