import type { QueryClient } from "@tanstack/react-query";

const CATALOG_ROOTS = [
  ["playlists"],
  ["playlist"],
  ["tracks"],
  ["track"],
  ["artists"],
  ["artist"],
  ["albums"],
  ["album"],
  ["genres"],
  ["genre"],
] as const;

export function invalidateLibraryQueries(queryClient: QueryClient) {
  for (const key of CATALOG_ROOTS) {
    queryClient.invalidateQueries({ queryKey: key });
  }
}
