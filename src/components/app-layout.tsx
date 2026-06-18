import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth, type AppRole } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/icon.png";
import {
  LayoutDashboard,
  Search,
  Briefcase,
  Wallet,
  Building2,
  MessageCircle,
  Bell,
  Settings,
  ShieldCheck,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  ChevronRight,
  BarChart3,
  Star,
  Home,
  Mail,
} from "lucide-react";
import type { ReactNode } from "react";

type NavItem = {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  badge?: number;
};

function buildNav(roles: AppRole[], unreadCount: number): NavItem[] {
  const items: NavItem[] = [
    { to: "/home", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/browse", icon: Search, label: "Browse" },
    { to: "/community", icon: MessageCircle, label: "Community" },
    { to: "/messages", icon: Mail, label: "Messages" },
  ];
  if (roles.includes("investor")) {
    items.push({ to: "/portfolio", icon: BarChart3, label: "Portfolio" });
    items.push({ to: "/wallet", icon: Wallet, label: "Wallet" });
  }
  if (roles.includes("business_owner")) {
    items.push({ to: "/my-business", icon: Building2, label: "My Business" });
  }
  if (roles.includes("mentor")) {
    items.push({ to: "/suitability", icon: Star, label: "Suitability" });
  }
  items.push({ to: "/notifications", icon: Bell, label: "Notifications", badge: unreadCount });
  items.push({ to: "/settings", icon: Settings, label: "Settings" });
  if (roles.includes("admin")) {
    items.push({ to: "/admin", icon: ShieldCheck, label: "Admin" });
  }
  return items;
}

const MOBILE_NAV = [
  { to: "/home", icon: Home, label: "Home" },
  { to: "/browse", icon: Search, label: "Browse" },
  { to: "/community", icon: MessageCircle, label: "Community" },
  { to: "/messages", icon: Mail, label: "Messages" },
  { to: "/settings", icon: Settings, label: "More" },
] as const;

function MobileBottomNav() {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex h-16 items-stretch border-t border-border bg-background/95 backdrop-blur-xl">
      {MOBILE_NAV.map((item) => {
        const active =
          pathname === item.to ||
          (item.to !== "/home" && pathname.startsWith(item.to));
        return (
          <Link
            key={item.to}
            to={item.to}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold transition-colors ${
              active ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function NavLink({ item, onClick }: { item: NavItem; onClick?: () => void }) {
  const routerState = useRouterState();
  const pathname = routerState.location.pathname;
  const isActive = pathname === item.to || (item.to !== "/home" && pathname.startsWith(item.to));

  return (
    <Link
      to={item.to as never}
      onClick={onClick}
      className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
        isActive
          ? "bg-primary/12 text-primary"
          : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
      }`}
    >
      {isActive && (
        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary" />
      )}
      <item.icon className={`h-4.5 w-4.5 shrink-0 transition-colors ${isActive ? "text-primary" : "text-current"}`} />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge != null && item.badge > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
          {item.badge > 9 ? "9+" : item.badge}
        </span>
      )}
    </Link>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, profile, roles, signOut } = useAuth();
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = (profile?.full_name ?? user?.email ?? "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const { data: unreadCount = 0 } = useQuery({
    enabled: !!user?.id,
    queryKey: ["notifications", "unread-count", user?.id],
    staleTime: 30_000,
    queryFn: async () => {
      const { count } = await (supabase as any)
        .from("user_notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .is("read_at", null);
      return Number(count ?? 0);
    },
  });

  const navItems = buildNav(roles, unreadCount);

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <aside
      className={`flex h-full flex-col ${
        mobile ? "w-72" : "w-60"
      } bg-sidebar border-r border-sidebar-border`}
    >
      <div className="flex h-16 shrink-0 items-center px-5 border-b border-sidebar-border">
        <Link to="/" className="flex items-center gap-2.5" onClick={mobile ? () => setMobileOpen(false) : undefined}>
          <img src={logo} alt="CoFund" className="h-8 w-8 object-contain" />
          <span className="font-display text-[17px] font-bold tracking-tight text-foreground">CoFund</span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map((item) => (
          <NavLink key={item.to} item={item} onClick={mobile ? () => setMobileOpen(false) : undefined} />
        ))}
      </nav>

      <div className="shrink-0 border-t border-sidebar-border p-3 space-y-1">
        <button
          onClick={toggle}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-white/[0.04] hover:text-foreground"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {theme === "dark" ? "Light mode" : "Dark mode"}
        </button>
        <button
          onClick={async () => {
            await signOut();
            navigate({ to: "/" });
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
        <div className="mt-2 flex items-center gap-3 rounded-xl border border-border bg-secondary/40 px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full gradient-brand text-[11px] font-bold text-primary-foreground">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-foreground">
              {profile?.full_name ?? "Member"}
            </p>
            <p className="truncate text-[11px] text-muted-foreground capitalize">
              {roles[0]?.replace(/_/g, " ") ?? "Member"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <div className="hidden md:flex md:flex-col md:shrink-0">
        <Sidebar />
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar mobile />
          </div>
        </div>
      )}

      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-background/80 backdrop-blur-xl px-4 sm:px-6">
          <button
            className="md:hidden flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-accent hover:text-foreground transition"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-4.5 w-4.5" />
          </button>
          <div className="hidden md:flex items-center gap-1 text-sm text-muted-foreground">
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-foreground font-medium">
              {navItems.find((n) => {
                const path = window?.location?.pathname ?? "";
                return path === n.to || (n.to !== "/home" && path.startsWith(n.to));
              })?.label ?? "Dashboard"}
            </span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Link
              to="/notifications"
              className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-border text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
            <Link
              to="/profile"
              className="flex h-9 w-9 items-center justify-center rounded-full gradient-brand text-[12px] font-bold text-primary-foreground transition hover:opacity-90"
            >
              {initials}
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          {children}
        </main>

        {/* Mobile bottom navigation */}
        <MobileBottomNav />
      </div>
    </div>
  );
}
