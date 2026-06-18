import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/icon.png";
import { useState } from "react";
import { Bell, Menu, Moon, Sun, X } from "lucide-react";

function navItemsForRoles(roles: AppRole[]) {
  const items: { to: string; label: string }[] = [{ to: "/home", label: "Home" }];
  items.push({ to: "/browse", label: "Browse" });
  items.push({ to: "/community", label: "Community" });
  if (roles.includes("investor")) items.push({ to: "/portfolio", label: "Portfolio" });
  if (roles.includes("investor")) items.push({ to: "/wallet", label: "Wallet" });
  if (roles.includes("business_owner")) items.push({ to: "/my-business", label: "My Business" });
  items.push({ to: "/notifications", label: "Notifications" });
  items.push({ to: "/security", label: "Security" });
  if (roles.includes("admin")) items.push({ to: "/admin", label: "Admin" });
  items.push({ to: "/profile", label: "Profile" });
  return items;
}

const publicLinks = [
  { to: "/how-it-works", label: "How it works" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

function ThemeToggle({ theme, toggle }: { theme: "dark" | "light"; toggle: () => void }) {
  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-accent hover:text-foreground"
    >
      {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}

export function SiteHeader() {
  const { user, roles, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { theme, toggle } = useTheme();
  const items = user ? navItemsForRoles(roles) : [];
  const initials = (profile?.full_name ?? user?.email ?? "U").charAt(0).toUpperCase();
  const { data: unreadCount = 0 } = useQuery({
    enabled: !!user?.id,
    queryKey: ["notifications", "unread-count", user?.id],
    queryFn: async () => {
      const { count, error } = await (supabase as any)
        .from("user_notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .is("read_at", null);
      if (error) throw error;
      return Number(count ?? 0);
    },
  });

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-2xl">
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
                  className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  activeProps={{ className: "rounded-lg px-3 py-1.5 text-sm font-medium text-foreground bg-accent" }}
                >
                  {it.label}
                </Link>
              ))}
            </nav>
            <div className="hidden items-center gap-2 md:flex">
              <Link
                to="/notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition hover:bg-accent hover:text-foreground"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                ) : null}
              </Link>
              <ThemeToggle theme={theme} toggle={toggle} />
              <button
                onClick={async () => { await signOut(); navigate({ to: "/" }); }}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
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
                <Link key={l.to} to={l.to as never} className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground">
                  {l.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-2">
              <ThemeToggle theme={theme} toggle={toggle} />
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
        <div className="border-t border-border bg-background/95 backdrop-blur-2xl md:hidden">
          <nav className="space-y-0.5 px-4 py-3">
            {(user ? items : publicLinks).map(it => (
              <Link
                key={it.to}
                to={it.to as never}
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                {it.label}
              </Link>
            ))}
            <div className="pt-2 mt-2 border-t border-border flex items-center gap-2">
              <ThemeToggle theme={theme} toggle={toggle} />
              {user ? (
                <button
                  onClick={async () => { await signOut(); setOpen(false); navigate({ to: "/" }); }}
                  className="flex-1 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-muted-foreground text-left"
                >
                  Sign out
                </button>
              ) : (
                <Link to="/auth" search={{ mode: "signin" }} onClick={() => setOpen(false)}
                  className="flex-1 block rounded-lg border border-border px-3 py-2.5 text-center text-sm font-medium text-muted-foreground">
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
