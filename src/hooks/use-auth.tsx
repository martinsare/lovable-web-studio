import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole =
  | "investor"
  | "business_owner"
  | "startup_builder"
  | "mentor"
  | "professional"
  | "community_member"
  | "admin";

export interface Profile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  onboarded: boolean;
}

interface AuthCtx {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadProfileAndRoles(userId: string) {
    const [{ data: prof }, { data: rs }] = await Promise.all([
      supabase.from("profiles").select("id,full_name,username,avatar_url,onboarded").eq("id", userId).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", userId),
    ]);
    setProfile((prof as Profile) ?? null);
    setRoles((rs ?? []).map((r) => r.role as AppRole));
  }

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      if (data.session?.user) await loadProfileAndRoles(data.session.user.id);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      if (s?.user) {
        // defer DB calls
        setTimeout(() => loadProfileAndRoles(s.user.id), 0);
      } else {
        setProfile(null);
        setRoles([]);
      }
    });
    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <Ctx.Provider
      value={{
        user: session?.user ?? null,
        session,
        profile,
        roles,
        loading,
        signOut: async () => {
          await supabase.auth.signOut();
        },
        refresh: async () => {
          if (session?.user) await loadProfileAndRoles(session.user.id);
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}