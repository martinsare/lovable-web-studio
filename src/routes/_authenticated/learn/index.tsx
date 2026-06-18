import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { PageShell, EmptyState, SkeletonCards } from "@/components/page-shell";
import { BookOpen, Clock, Tag } from "lucide-react";

export const Route = createFileRoute("/_authenticated/learn/")({
  head: () => ({ meta: [{ title: "Knowledge Hub · CoFund" }] }),
  component: LearnPage,
});

const EASE = [0.25, 0.46, 0.45, 0.94] as const;
const fadeUp = { hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };

function LearnPage() {
  const { data: articles, isLoading } = useQuery({
    queryKey: ["learning-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learning_articles")
        .select("id,title,excerpt,category,cover_url,slug,created_at")
        .eq("published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const categories = [...new Set((articles ?? []).map((a) => a.category).filter(Boolean))];

  return (
    <PageShell
      eyebrow="Knowledge Hub"
      title="Learn & grow"
      description="Guides, explainers, and insights to help you invest smarter or build a fundable business."
    >
      {isLoading ? (
        <SkeletonCards count={6} />
      ) : !articles || articles.length === 0 ? (
        <EmptyState
          title="No articles yet"
          hint="Check back soon — new guides drop regularly."
          icon={<BookOpen className="h-10 w-10" />}
        />
      ) : (
        <>
          {categories.length > 1 && (
            <div className="mb-8 flex flex-wrap gap-2">
              {categories.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1 text-xs font-semibold text-muted-foreground"
                >
                  <Tag className="h-3 w-3" />
                  {cat}
                </span>
              ))}
            </div>
          )}

          <motion.div
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            variants={stagger}
            initial="hidden"
            animate="visible"
          >
            {articles.map((article) => (
              <motion.div
                key={article.id}
                variants={fadeUp}
                transition={{ duration: 0.38, ease: EASE }}
              >
                <Link
                  to="/learn/$slug"
                  params={{ slug: article.slug }}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition hover:border-primary/30 hover:shadow-card"
                >
                  {article.cover_url ? (
                    <div className="h-44 w-full overflow-hidden">
                      <img
                        src={article.cover_url}
                        alt={article.title}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    </div>
                  ) : (
                    <div className="flex h-44 w-full items-center justify-center bg-gradient-to-br from-primary/10 to-brand-green/10">
                      <BookOpen className="h-10 w-10 text-primary/30" />
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-5">
                    {article.category && (
                      <span className="mb-2 text-[10px] font-bold uppercase tracking-widest text-primary/70">
                        {article.category}
                      </span>
                    )}
                    <h2 className="font-display text-sm font-bold leading-snug text-foreground group-hover:text-primary transition-colors">
                      {article.title}
                    </h2>
                    {article.excerpt && (
                      <p className="mt-2 flex-1 text-xs leading-relaxed text-muted-foreground line-clamp-3">
                        {article.excerpt}
                      </p>
                    )}
                    <div className="mt-4 flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
                      <Clock className="h-3 w-3" />
                      {new Date(article.created_at).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </>
      )}
    </PageShell>
  );
}
