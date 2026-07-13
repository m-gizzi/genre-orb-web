import { useQuery } from "@tanstack/react-query";
import { artistsApi, type PageParams } from "@/api/client";
import { queryKeys } from "@/lib/queryKeys";

export function useArtists(params: PageParams = {}) {
  return useQuery({
    queryKey: queryKeys.artists(params),
    queryFn: () => artistsApi.list(params),
  });
}

export function useArtist(id: number) {
  return useQuery({
    queryKey: queryKeys.artist(id),
    queryFn: () => artistsApi.get(id),
    enabled: Number.isFinite(id),
  });
}
