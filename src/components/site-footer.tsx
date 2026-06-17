import { Link } from "@tanstack/react-router";
import logo from "@/assets/cofund-logo.png.asset.json";
import { Mail } from "lucide-react";

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.244 2H21l-6.52 7.45L22 22h-6.86l-4.79-6.27L4.8 22H2l7-8L1.6 2h6.92l4.33 5.74L18.244 2Zm-1.2 18h1.66L7.04 4H5.28l11.764 16Z" />
    </svg>
  );
}
function LinkedinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1 4.98 2.12 4.98 3.5ZM.22 8h4.56v14H.22V8Zm7.4 0h4.37v1.92h.06c.61-1.15 2.1-2.36 4.32-2.36 4.62 0 5.47 3.04 5.47 7v7.44h-4.56v-6.6c0-1.57-.03-3.6-2.19-3.6-2.2 0-2.53 1.72-2.53 3.49V22H7.62V8Z" />
    </svg>
  );
}
function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37Z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

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
              <Social href="https://twitter.com" Icon={XIcon} label="X" />
              <Social href="https://linkedin.com" Icon={LinkedinIcon} label="LinkedIn" />
              <Social href="https://instagram.com" Icon={InstagramIcon} label="Instagram" />
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