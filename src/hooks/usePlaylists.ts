import { useQuery } from "@tanstack/react-query";
import { playlistsApi } from "@/api/client";
import { queryKeys } from "@/lib/queryKeys";

export function usePlaylists(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.playlists,
    queryFn: playlistsApi.list,
    enabled,
  });
}
