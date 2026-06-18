import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { AppLayout } from "@/components/app-layout";
import { InvestorDashboard } from "@/components/dashboards/investor-dashboard";
import { BusinessDashboard } from "@/components/dashboards/business-dashboard";
import { StartupDashboard } from "@/components/dashboards/startup-dashboard";
import { CommunityDashboard } from "@/components/dashboards/community-dashboard";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({ meta: [{ title: "Dashboard · CoFund" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { profile, loading, roles, session } = useAuth();
  if (!loading && profile && !profile.onboarded) throw redirect({ to: "/onboarding" });

  const name = profile?.full_name?.split(" ")[0] ?? "there";
  const userId = session?.user?.id ?? "";

  const content = (() => {
    if (roles.includes("business_owner")) {
      return <BusinessDashboard name={name} userId={userId} />;
    }
    if (roles.includes("startup_builder")) {
      return (
        <StartupDashboard
          name={name}
          userId={userId}
          profileOnboarded={profile?.onboarded ?? false}
        />
      );
    }
    if (roles.includes("investor")) {
      return <InvestorDashboard name={name} />;
    }
    return <CommunityDashboard name={name} />;
  })();

  return <AppLayout>{content}</AppLayout>;
}
