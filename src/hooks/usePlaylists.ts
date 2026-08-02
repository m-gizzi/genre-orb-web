import {
  useInfiniteQuery,
  useQuery,
  keepPreviousData,
} from "@tanstack/react-query";
import { playlistsApi, type PlaylistListParams } from "@/api/client";
import { PLAYLIST_PICKER_PAGE_SIZE } from "@/lib/config";
import { queryKeys } from "@/lib/queryKeys";

export function usePlaylistsPage(params: PlaylistListParams = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.playlistsPaged(params),
    queryFn: () => playlistsApi.paginated(params),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useInfinitePlaylists(search: string, enabled = true) {
  return useInfiniteQuery({
    queryKey: queryKeys.playlistsInfinite(search),
    queryFn: ({ pageParam }) =>
      playlistsApi.paginated({
        search: search || undefined,
        page: pageParam,
        per_page: PLAYLIST_PICKER_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.meta.page < lastPage.meta.total_pages
        ? lastPage.meta.page + 1
        : undefined,
    enabled,
  });
}

export function useLikedPlaylist(enabled = true) {
  return useQuery({
    queryKey: queryKeys.likedPlaylist,
    queryFn: playlistsApi.liked,
    enabled,
  });
}
