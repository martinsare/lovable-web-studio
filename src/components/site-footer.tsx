import { Link } from "@tanstack/react-router";
import logo from "@/assets/icon.png";
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
  { label: "Startup Hub", to: "/community" },
  { label: "Community", to: "/community" },
];
const company: Item[] = [
  { label: "About", to: "/about" },
  { label: "How it works", to: "/how-it-works" },
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
    <footer className="mt-20 border-t border-white/[0.06]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-brand">
                <img src={logo} alt="" className="h-5 w-5 object-contain brightness-0 invert" />
              </div>
              <span className="font-display text-[17px] font-bold">CoFund</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Africa's trusted private investment and business growth ecosystem.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {[
                { href: "https://twitter.com", Icon: XIcon, label: "X" },
                { href: "https://linkedin.com", Icon: LinkedinIcon, label: "LinkedIn" },
                { href: "https://instagram.com", Icon: InstagramIcon, label: "Instagram" },
                { href: "mailto:hello@cofund.africa", Icon: Mail, label: "Email" },
              ].map(({ href, Icon, label }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-muted-foreground transition hover:border-primary/50 hover:text-primary">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          {[{ title: "Platform", items: platform }, { title: "Company", items: company }, { title: "Legal", items: legal }].map(col => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.items.map(i => (
                  <li key={i.label}>
                    <Link to={i.to as never} className="text-sm text-foreground/70 transition hover:text-foreground">
                      {i.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t border-white/[0.06] pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <p>© {new Date().getFullYear()} CoFund. Together, we grow.</p>
          <p className="max-w-sm text-right text-[11px] opacity-60">Investing involves risk including possible loss of principal.</p>
        </div>
      </div>
    </footer>
  );
}
