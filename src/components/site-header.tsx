import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import logo from "@/assets/image_1781739713451.png";
import { useState } from "react";
import { Menu, X } from "lucide-react";

function navItemsForRoles(roles: AppRole[]) {
  const items: { to: string; label: string }[] = [{ to: "/home", label: "Home" }];
  items.push({ to: "/browse", label: "Browse" });
  items.push({ to: "/community", label: "Community" });
  if (roles.includes("investor")) items.push({ to: "/portfolio", label: "Portfolio" });
  if (roles.includes("business_owner")) items.push({ to: "/my-business", label: "My Business" });
  items.push({ to: "/profile", label: "Profile" });
  return items;
}

const publicLinks = [
  { to: "/how-it-works", label: "How it works" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const { user, roles, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const items = user ? navItemsForRoles(roles) : [];
  const initials = (profile?.full_name ?? user?.email ?? "U").charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-background/80 backdrop-blur-2xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5 shrink-0">
          <img src={logo} alt="CoFund" className="h-9 w-9 object-contain" />
          <span className="font-display text-[17px] font-bold tracking-tight">CoFund</span>
        </Link>

        {user ? (
          <>
            <nav className="hidden items-center gap-0.5 md:flex">
              {items.map((it) => (
                <Link
                  key={it.to}
                  to={it.to as never}
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                  activeProps={{ className: "rounded-lg px-3 py-1.5 text-sm font-medium text-foreground bg-white/[0.07]" }}
                >
                  {it.label}
                </Link>
              ))}
            </nav>
            <div className="hidden items-center gap-3 md:flex">
              <button
                onClick={async () => { await signOut(); navigate({ to: "/" }); }}
                className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:border-white/20 hover:text-foreground"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full gradient-brand text-[10px] font-bold text-white shrink-0">
                  {initials}
                </div>
                Sign out
              </button>
            </div>
            <button className="md:hidden p-2 text-muted-foreground" onClick={() => setOpen(v => !v)}>
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </>
        ) : (
          <>
            <nav className="hidden items-center gap-0.5 md:flex">
              {publicLinks.map(l => (
                <Link key={l.to} to={l.to as never} className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground">
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              <Link to="/auth" search={{ mode: "signin" }} className="hidden rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground sm:inline-flex">
                Sign in
              </Link>
              <Link to="/auth" search={{ mode: "signup" }} className="gradient-brand inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-brand transition hover:opacity-90">
                Get started
              </Link>
              <button className="md:hidden p-2 text-muted-foreground" onClick={() => setOpen(v => !v)}>
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </>
        )}
      </div>

      {open && (
        <div className="border-t border-white/[0.06] bg-background/95 backdrop-blur-2xl md:hidden">
          <nav className="space-y-0.5 px-4 py-3">
            {(user ? items : publicLinks).map(it => (
              <Link
                key={it.to}
                to={it.to as never}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
              >
                {it.label}
              </Link>
            ))}
            <div className="pt-2 mt-2 border-t border-white/[0.06]">
              {user ? (
                <button
                  onClick={async () => { await signOut(); setOpen(false); navigate({ to: "/" }); }}
                  className="w-full rounded-lg border border-white/10 px-3 py-2.5 text-sm font-medium text-muted-foreground text-left"
                >
                  Sign out
                </button>
              ) : (
                <Link to="/auth" search={{ mode: "signin" }} onClick={() => setOpen(false)}
                  className="block rounded-lg border border-white/10 px-3 py-2.5 text-center text-sm font-medium text-muted-foreground">
                  Sign in
                </Link>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
