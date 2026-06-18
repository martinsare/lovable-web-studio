import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import logo from "@/assets/icon.png";
import { useState } from "react";
import { Sun, Moon, Menu, X, ArrowRight } from "lucide-react";

const publicLinks = [
  { to: "/how-it-works", label: "How it works" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { theme, toggle } = useTheme();

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <img src={logo} alt="CoFund" className="h-8 w-8 object-contain" />
          <span className="font-display text-[17px] font-bold tracking-tight">CoFund</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {publicLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to as never}
              className="rounded-lg px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={toggle}
            aria-label="Toggle theme"
            className="hidden h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition hover:bg-accent hover:text-foreground sm:flex"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {user ? (
            <Link
              to="/home"
              className="inline-flex items-center gap-1.5 rounded-xl gradient-brand px-4 py-2 text-sm font-semibold text-primary-foreground shadow-brand transition hover:opacity-90"
            >
              Dashboard <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <>
              <Link
                to="/auth"
                search={{ mode: "signin" }}
                className="hidden rounded-xl px-4 py-2 text-sm font-medium text-muted-foreground transition hover:text-foreground sm:inline-flex"
              >
                Sign in
              </Link>
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="inline-flex items-center gap-1.5 rounded-xl gradient-brand px-4 py-2 text-sm font-semibold text-primary-foreground shadow-brand transition hover:opacity-90"
              >
                Get started
              </Link>
            </>
          )}
          <button
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground md:hidden"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background/98 backdrop-blur-xl md:hidden">
          <div className="mx-auto max-w-7xl space-y-0.5 px-4 py-3 sm:px-6">
            {publicLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to as never}
                onClick={() => setOpen(false)}
                className="block rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
              >
                {l.label}
              </Link>
            ))}
            <div className="flex items-center gap-2 border-t border-border pt-3 mt-2">
              <button
                onClick={toggle}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <Link
                to="/auth"
                search={{ mode: "signin" }}
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl border border-border px-3 py-2.5 text-center text-sm font-medium text-muted-foreground"
              >
                Sign in
              </Link>
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                onClick={() => setOpen(false)}
                className="flex-1 rounded-xl gradient-brand px-3 py-2.5 text-center text-sm font-semibold text-primary-foreground"
              >
                Get started
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
