import { useQuery } from "@tanstack/react-query";
import { smartPlaylistsApi } from "@/api/client";
import { queryKeys } from "@/lib/queryKeys";

export function useRuleSchema() {
  return useQuery({
    queryKey: queryKeys.ruleSchema,
    queryFn: () => smartPlaylistsApi.schema(),
    staleTime: Infinity,
    gcTime: Infinity,
  });
}
