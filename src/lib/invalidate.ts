import type { QueryClient } from "@tanstack/react-query";
import { CATALOG_QUERY_ROOTS } from "@/lib/queryKeys";

export function invalidateLibraryQueries(queryClient: QueryClient) {
  for (const root of CATALOG_QUERY_ROOTS) {
    queryClient.invalidateQueries({ queryKey: [root] });
  }
}
