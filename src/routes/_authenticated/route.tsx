import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth", search: { mode: "signin" } });
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const pageVariants = {
    hidden: { opacity: 0, y: 18, scale: 0.992 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.45,
        ease: [0.25, 0.46, 0.45, 0.94],
        when: "beforeChildren",
        staggerChildren: 0.06,
      },
    },
    exit: { opacity: 0, y: -10, scale: 0.992, transition: { duration: 0.18 } },
  } as const;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={window.location.pathname}
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="min-h-full"
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
}
