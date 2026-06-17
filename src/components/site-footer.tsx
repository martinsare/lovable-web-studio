import { Link } from "@tanstack/react-router";
import logo from "@/assets/cofund-logo.png.asset.json";
import { Twitter, Linkedin, Instagram, Mail } from "lucide-react";

type Item = { label: string; to: string };

const platform: Item[] = [
  { label: "Invest", to: "/how-it-works" },
  { label: "Raise Capital", to: "/how-it-works" },
  { label: "Startup Hub", to: "/how-it-works" },
  { label: "Community", to: "/how-it-works" },
];
const company: Item[] = [
  { label: "About", to: "/about" },
  { label: "How it works", to: "/how-it-works" },
  { label: "Partners", to: "/about" },
  { label: "Contact", to: "/contact" },
];
const legal: Item[] = [
  { label: "Privacy", to: "/privacy" },
  { label: "Terms", to: "/terms" },
  { label: "Escrow Policy", to: "/escrow" },
  { label: "Risk Disclosure", to: "/risk" },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border bg-secondary/30">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5">
              <img src={logo.url} alt="" className="h-9 w-9 object-contain" />
              <span className="font-display text-xl font-bold">CoFund</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Africa's trusted private investment and business growth ecosystem.
              Invest in verified businesses, raise capital, and build the next great venture.
            </p>
            <div className="mt-5 flex items-center gap-2">
              <Social href="https://twitter.com" Icon={Twitter} label="Twitter" />
              <Social href="https://linkedin.com" Icon={Linkedin} label="LinkedIn" />
              <Social href="https://instagram.com" Icon={Instagram} label="Instagram" />
              <Social href="mailto:hello@cofund.africa" Icon={Mail} label="Email" />
            </div>
          </div>
          <FooterCol title="Platform" items={platform} />
          <FooterCol title="Company" items={company} />
          <FooterCol title="Legal" items={legal} />
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} CoFund. Together, we grow.</p>
          <p className="text-[11px]">
            CoFund is a private investment platform. Investing involves risk including possible loss of principal.
          </p>
        </div>
      </div>
    </footer>
  );
}

function Social({ href, Icon, label }: { href: string; Icon: any; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:border-primary hover:text-primary"
    >
      <Icon className="h-4 w-4" />
    </a>
  );
}

function FooterCol({ title, items }: { title: string; items: Item[] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
      <ul className="mt-4 space-y-2.5 text-sm">
        {items.map((i) => (
          <li key={i.label}>
            <Link
              to={i.to as never}
              className="text-muted-foreground transition hover:text-primary"
            >
              {i.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}