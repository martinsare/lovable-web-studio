import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { buildSecuritySnapshot, type SecuritySnapshot } from "@/lib/auth-security";
import { useAuth } from "@/hooks/use-auth";

export function useSecurity() {
  const { user, profile, roles } = useAuth();
  const [security, setSecurity] = useState<SecuritySnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadSecurity() {
      if (!user) {
        if (active) {
          setSecurity(null);
          setLoading(false);
        }
        return;
      }

      setLoading(true);
      const [{ data: assurance }, { data: factors }] = await Promise.all([
        supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
        supabase.auth.mfa.listFactors(),
      ]);

      if (!active) return;

      const verifiedFactors = [
        ...(factors?.totp ?? []),
        ...(factors?.phone ?? []),
        ...(factors?.webauthn ?? []),
      ].filter((factor) => factor.status === "verified").length;

      setSecurity(
        buildSecuritySnapshot({
          user,
          profile,
          roles,
          currentLevel: assurance?.currentLevel,
          nextLevel: assurance?.nextLevel,
          verifiedFactors,
        }),
      );
      setLoading(false);
    }

    void loadSecurity();
    return () => {
      active = false;
    };
  }, [user, profile, roles]);

  return { security, loading };
}
