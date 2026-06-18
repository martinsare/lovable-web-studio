import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/app-layout";
import { ArrowLeft, BookOpen, Clock, Tag } from "lucide-react";

export const Route = createFileRoute("/_authenticated/learn/$slug")({
  head: () => ({ meta: [{ title: "Article · CoFund" }] }),
  component: ArticlePage,
});

const EASE = [0.25, 0.46, 0.45, 0.94] as const;

function ArticlePage() {
  const { slug } = Route.useParams();

  const { data: article, isLoading } = useQuery({
    queryKey: ["learning-article", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learning_articles")
        .select("id,title,excerpt,body,category,cover_url,slug,created_at,published")
        .eq("slug", slug)
        .eq("published", true)
        .maybeSingle();
      if (error) throw error;
      if (!data) throw notFound();
      return data;
    },
  });

  const { data: related } = useQuery({
    queryKey: ["learning-related", article?.category],
    queryFn: async () => {
      if (!article?.category) return [];
      const { data } = await supabase
        .from("learning_articles")
        .select("id,title,excerpt,slug,category")
        .eq("published", true)
        .eq("category", article.category)
        .neq("slug", slug)
        .limit(3);
      return data ?? [];
    },
    enabled: !!article?.category,
  });

  return (
    <AppLayout>
      <div className="min-h-full">
        {isLoading ? (
          <ArticleSkeleton />
        ) : !article ? (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
            <p className="font-display text-xl font-bold">Article not found</p>
            <Link to="/learn" className="mt-4 text-sm font-semibold text-primary">
              ← Back to Knowledge Hub
            </Link>
          </div>
        ) : (
          <>
            {article.cover_url && (
              <div className="h-64 w-full overflow-hidden sm:h-80">
                <img
                  src={article.cover_url}
                  alt={article.title}
                  className="h-full w-full object-cover"
                />
              </div>
            )}

            <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: EASE }}
              >
                <Link
                  to="/learn"
                  className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" /> Knowledge Hub
                </Link>

                <div className="flex flex-wrap items-center gap-3 mb-4">
                  {article.category && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
                      <Tag className="h-3 w-3" />
                      {article.category}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(article.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
                  {article.title}
                </h1>

                {article.excerpt && (
                  <p className="mt-4 text-base leading-relaxed text-muted-foreground">
                    {article.excerpt}
                  </p>
                )}
              </motion.div>

              {article.body && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: EASE, delay: 0.15 }}
                  className="mt-10 border-t border-border pt-10"
                >
                  <ArticleBody body={article.body} />
                </motion.div>
              )}

              {!article.body && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mt-10 rounded-2xl border border-dashed border-border/60 p-10 text-center"
                >
                  <BookOpen className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
                  <p className="text-sm font-semibold">Full article coming soon</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    This article is being prepared. Check back shortly.
                  </p>
                </motion.div>
              )}

              {related && related.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, ease: EASE, delay: 0.3 }}
                  className="mt-16 border-t border-border pt-10"
                >
                  <h2 className="font-display text-lg font-bold mb-5">Related articles</h2>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {(related as any[]).map((r) => (
                      <Link
                        key={r.id}
                        to="/learn/$slug"
                        params={{ slug: r.slug }}
                        className="group rounded-2xl border border-border/60 bg-card p-4 transition hover:border-primary/30"
                      >
                        {r.category && (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70">
                            {r.category}
                          </span>
                        )}
                        <h3 className="mt-1 text-sm font-bold leading-snug group-hover:text-primary transition-colors line-clamp-2">
                          {r.title}
                        </h3>
                        {r.excerpt && (
                          <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">{r.excerpt}</p>
                        )}
                      </Link>
                    ))}
                  </div>
                </motion.div>
              )}

              <div className="mt-12 border-t border-border pt-8">
                <Link
                  to="/learn"
                  className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" /> Back to Knowledge Hub
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}

function ArticleBody({ body }: { body: string }) {
  const paragraphs = body.split(/\n\n+/).filter(Boolean);

  return (
    <div className="space-y-5 text-[15px] leading-relaxed text-foreground/90">
      {paragraphs.map((para, i) => {
        if (para.startsWith("# ")) {
          return (
            <h2 key={i} className="font-display text-2xl font-bold tracking-tight text-foreground mt-8 first:mt-0">
              {para.slice(2)}
            </h2>
          );
        }
        if (para.startsWith("## ")) {
          return (
            <h3 key={i} className="font-display text-xl font-bold text-foreground mt-6">
              {para.slice(3)}
            </h3>
          );
        }
        if (para.startsWith("### ")) {
          return (
            <h4 key={i} className="font-display text-base font-bold text-foreground mt-4">
              {para.slice(4)}
            </h4>
          );
        }
        if (para.startsWith("- ") || para.startsWith("* ")) {
          const items = para.split("\n").filter((l) => l.startsWith("- ") || l.startsWith("* "));
          return (
            <ul key={i} className="list-none space-y-2">
              {items.map((item, j) => (
                <li key={j} className="flex items-start gap-2.5">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-green" />
                  <span>{item.slice(2)}</span>
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i} className="text-foreground/80 leading-loose">
            {para}
          </p>
        );
      })}
    </div>
  );
}

function ArticleSkeleton() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 space-y-6">
      <div className="h-4 w-28 animate-pulse rounded-full bg-secondary" />
      <div className="h-10 w-3/4 animate-pulse rounded-xl bg-secondary" />
      <div className="h-5 w-full animate-pulse rounded-lg bg-secondary" />
      <div className="h-5 w-5/6 animate-pulse rounded-lg bg-secondary" />
      <div className="mt-8 space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={`h-4 animate-pulse rounded-lg bg-secondary ${i % 3 === 2 ? "w-2/3" : "w-full"}`} />
        ))}
      </div>
    </div>
  );
}
