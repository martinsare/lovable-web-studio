import { Link, useNavigate } from "@tanstack/react-router";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import logo from "@/assets/cofund-logo.png.asset.json";
import { useState } from "react";
import { Menu, X } from "lucide-react";

function navItemsForRoles(roles: AppRole[]) {
  const items: { to: string; label: string }[] = [{ to: "/home", label: "Home" }];
  const hasInvestor = roles.includes("investor");
  const hasBusiness = roles.includes("business_owner");
  items.push({ to: "/browse", label: "Browse" });
  items.push({ to: "/community", label: "Community" });
  if (hasInvestor) items.push({ to: "/portfolio", label: "My Portfolio" });
  if (hasBusiness) items.push({ to: "/my-business", label: "My Business" });
  items.push({ to: "/profile", label: "Profile" });
  if (roles.includes("admin")) items.push({ to: "/admin", label: "Admin" });
  return items;
}

export function SiteHeader() {
  const { user, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const items = user ? navItemsForRoles(roles) : [];

  const publicLinks: { to: string; label: string }[] = [
    { to: "/how-it-works", label: "How it works" },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <img src={logo.url} alt="CoFund" className="h-9 w-9 object-contain" />
          <span className="font-display text-xl font-bold tracking-tight">CoFund</span>
        </Link>

        {user ? (
          <>
            <nav className="hidden items-center gap-1 md:flex">
              {items.map((it) => (
                <Link
                  key={it.to}
                  to={it.to as never}
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  activeProps={{ className: "rounded-md px-3 py-1.5 text-sm font-medium bg-muted text-foreground" }}
                >
                  {it.label}
                </Link>
              ))}
              <button
                onClick={async () => {
                  await signOut();
                  navigate({ to: "/" });
                }}
                className="ml-2 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted"
              >
                Sign out
              </button>
            </nav>
            <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </>
        ) : (
          <>
            <nav className="hidden items-center gap-1 md:flex">
              {publicLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to as never}
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
                  activeProps={{ className: "rounded-md px-3 py-1.5 text-sm font-medium bg-muted text-foreground" }}
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              <Link to="/auth" search={{ mode: "signin" }} className="hidden rounded-md px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted sm:inline-flex">
                Sign in
              </Link>
              <Link
                to="/auth"
                search={{ mode: "signup" }}
                className="gradient-brand inline-flex items-center rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:opacity-90"
              >
                Get started
              </Link>
              <button className="md:hidden" onClick={() => setOpen((v) => !v)} aria-label="Menu">
                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </>
        )}
      </div>
      {open && (
        <nav className="border-t border-border bg-background md:hidden">
          <div className="space-y-1 px-4 py-3">
            {(user ? items : publicLinks).map((it) => (
              <Link
                key={it.to}
                to={it.to as never}
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                {it.label}
              </Link>
            ))}
            {user ? (
              <button
                onClick={async () => {
                  await signOut();
                  setOpen(false);
                  navigate({ to: "/" });
                }}
                className="mt-2 w-full rounded-md border border-border px-3 py-2 text-sm font-medium"
              >
                Sign out
              </button>
            ) : (
              <Link
                to="/auth"
                search={{ mode: "signin" }}
                onClick={() => setOpen(false)}
                className="mt-2 block rounded-md border border-border px-3 py-2 text-center text-sm font-medium"
              >
                Sign in
              </Link>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}