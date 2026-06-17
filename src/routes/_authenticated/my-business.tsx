import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { PageShell, EmptyState } from "@/components/page-shell";
import { Building2, ShieldCheck, FileText, Coins, Users, Plus } from "lucide-react";

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
        .select("id,name,industry,tagline,logo_url,cover_url,verified,trust_score,followers_count,founded_year")
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
        <button className="gradient-brand hidden rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-brand sm:inline-flex items-center gap-2">
          <Plus className="h-4 w-4" /> New business
        </button>
      }
    >
      {isLoading ? (
        <div className="h-40 animate-pulse rounded-2xl bg-card" />
      ) : !data || data.length === 0 ? (
        <div>
          <div className="rounded-2xl border border-dashed border-white/10 bg-card/40 p-12 text-center">
            <div className="gradient-brand mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-brand">
              <Building2 className="h-7 w-7" />
            </div>
            <h3 className="font-display text-lg font-bold">No Business Passport yet</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              A Business Passport is your verified profile on CoFund — branding, story, products, financials, trust score, and funding history.
            </p>
            <button className="gradient-brand mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-brand">
              <Plus className="h-4 w-4" /> Create Business Passport
            </button>
          </div>
          <section className="mt-8 grid gap-5 md:grid-cols-3">
            {[
              { icon: Building2, color: "text-primary bg-primary/10", t: "Business Passport", d: "Logo, story, products, team and gallery." },
              { icon: ShieldCheck, color: "text-brand-green bg-brand-green/10", t: "Trust Score", d: "Verification, reporting and milestones build your score." },
              { icon: Coins, color: "text-gold bg-gold/10", t: "Funding Rounds", d: "Create and manage rounds with escrow protection." },
            ].map((c) => (
              <div key={c.t} className="rounded-2xl border border-white/[0.06] bg-card p-6">
                <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${c.color}`}>
                  <c.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-base font-bold">{c.t}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{c.d}</p>
              </div>
            ))}
          </section>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {data.map((b: any) => (
            <article key={b.id} className="overflow-hidden rounded-2xl border border-white/[0.06] bg-card">
              {b.cover_url
                ? <img src={b.cover_url} alt="" className="aspect-[16/8] w-full object-cover" />
                : <div className="gradient-mesh aspect-[16/8] w-full" />
              }
              <div className="p-5">
                <div className="flex items-center gap-3">
                  {b.logo_url
                    ? <img src={b.logo_url} alt="" className="-mt-10 h-12 w-12 rounded-xl border-2 border-card object-cover" />
                    : <div className="gradient-brand -mt-10 flex h-12 w-12 items-center justify-center rounded-xl border-2 border-card text-white">
                        <Building2 className="h-5 w-5" />
                      </div>
                  }
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-base font-bold">{b.name}</h3>
                    <p className="truncate text-xs text-muted-foreground">{b.industry}</p>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <Mini label="Trust" value={b.trust_score ?? "—"} />
                  <Mini label="Followers" value={b.followers_count ?? 0} />
                  <Mini label="Founded" value={b.founded_year ?? "—"} />
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </PageShell>
  );
}

function Mini({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-base font-bold">{value}</p>
    </div>
  );
}
