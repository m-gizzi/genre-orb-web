import { useQuery } from "@tanstack/react-query";
import { albumsApi, type PageParams } from "@/api/client";
import { queryKeys } from "@/lib/queryKeys";

export function useAlbums(params: PageParams = {}) {
  return useQuery({
    queryKey: queryKeys.albums(params),
    queryFn: () => albumsApi.list(params),
  });
}

export function useAlbum(id: number) {
  return useQuery({
    queryKey: queryKeys.album(id),
    queryFn: () => albumsApi.get(id),
    enabled: Number.isFinite(id),
  });
}
