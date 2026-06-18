import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type RefItem = {
  value: string;
  label: string;
  metadata: Record<string, any> | null;
  sort_order: number;
};

export function useReferenceData(category: string) {
  return useQuery<RefItem[]>({
    queryKey: ["ref", category],
    staleTime: 1000 * 60 * 30,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("reference_data")
        .select("value, label, metadata, sort_order")
        .eq("category", category)
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return (data ?? []) as RefItem[];
    },
  });
}

export function useRefValues(category: string, fallback: string[] = []): string[] {
  const { data } = useReferenceData(category);
  return data ? data.map((r) => r.value) : fallback;
}
