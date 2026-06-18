import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Mail, MapPin, MessageSquare } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact - CoFund" },
      { name: "description", content: "Get in touch with the CoFund team." },
      { property: "og:title", content: "Contact CoFund" },
      { property: "og:description", content: "Get in touch with our team." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ tone: "success" | "error"; title: string; message: string } | null>(null);
  const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.08 } } } as const;
  const fadeUp = { hidden: { opacity: 0, y: 22 }, visible: { opacity: 1, y: 0 } } as const;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {notice && (
        <div className="mx-auto max-w-5xl px-4 pt-6 sm:px-6 lg:px-8">
          <Alert variant={notice.tone === "error" ? "destructive" : "default"}>
            <AlertTitle>{notice.title}</AlertTitle>
            <AlertDescription>{notice.message}</AlertDescription>
          </Alert>
        </div>
      )}

      <motion.section
        className="relative overflow-hidden border-b border-border"
        initial={{ opacity: 0, y: 22, scale: 0.995 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div className="absolute inset-0 -z-10 gradient-mesh opacity-70" />
        <motion.div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8" variants={stagger} initial="hidden" animate="visible">
          <motion.p variants={fadeUp} className="text-xs font-semibold uppercase tracking-widest text-primary">
            Contact
          </motion.p>
          <motion.h1 variants={fadeUp} className="mt-2 font-display text-4xl font-extrabold sm:text-5xl">
            We'd love to hear from you
          </motion.h1>
          <motion.p variants={fadeUp} className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Questions, partnerships, or press - drop us a line and we'll respond within 1-2 business days.
          </motion.p>
        </motion.div>
      </motion.section>

      <motion.section
        className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8"
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <motion.div className="grid gap-10 md:grid-cols-[1fr_2fr]" variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }}>
          <motion.div className="space-y-5" variants={fadeUp}>
            <Info icon={Mail} title="Email" value="hello@cofund.africa" />
            <Info icon={MessageSquare} title="Support" value="support@cofund.africa" />
            <Info icon={MapPin} title="Office" value="Lagos, Nigeria" />
          </motion.div>
          <motion.form
            onSubmit={(e) => {
              e.preventDefault();
              setBusy(true);
              setTimeout(() => {
                setBusy(false);
                setNotice({ tone: "success", title: "Message sent", message: "Thanks - we'll be in touch." });
                (e.target as HTMLFormElement).reset();
              }, 600);
            }}
            className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8"
            variants={fadeUp}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Name" name="name" required />
              <Input label="Email" name="email" type="email" required />
            </div>
            <Input label="Subject" name="subject" className="mt-4" required />
            <label className="mt-4 block">
              <span className="mb-1.5 block text-sm font-medium">Message</span>
              <textarea
                name="message"
                required
                rows={5}
                className="w-full resize-none rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </label>
            <button
              type="submit"
              disabled={busy}
              className="gradient-brand mt-5 inline-flex w-full items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-white shadow-soft disabled:opacity-50"
            >
              {busy ? "Sending..." : "Send message"}
            </button>
          </motion.form>
        </motion.div>
      </motion.section>

      <SiteFooter />
    </div>
  );
}

function Info({ icon: Icon, title, value }: { icon: any; title: string; value: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-border bg-card p-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{title}</p>
        <p className="mt-0.5 truncate text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}

function Input({
  label,
  className = "",
  ...rest
}: { label: string; className?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <input
        {...rest}
        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </label>
  );
}
