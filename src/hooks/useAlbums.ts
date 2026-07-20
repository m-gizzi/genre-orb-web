import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { albumsApi, type AlbumListParams } from "@/api/client";
import { queryKeys } from "@/lib/queryKeys";

export function useAlbums(params: AlbumListParams = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.albums(params),
    queryFn: () => albumsApi.list(params),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useAlbum(id: number) {
  return useQuery({
    queryKey: queryKeys.album(id),
    queryFn: () => albumsApi.get(id),
    enabled: Number.isFinite(id),
  });
}
