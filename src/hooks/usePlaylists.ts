import { useQuery } from "@tanstack/react-query";
import { playlistsApi, type PlaylistListParams } from "@/api/client";
import { queryKeys } from "@/lib/queryKeys";

export function usePlaylists(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.playlists,
    queryFn: playlistsApi.list,
    enabled,
  });
}

export function usePlaylistsPage(params: PlaylistListParams = {}, enabled = true) {
  return useQuery({
    queryKey: queryKeys.playlistsPaged(params),
    queryFn: () => playlistsApi.paginated(params),
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
