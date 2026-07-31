import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { playlistsApi, type Pagination } from "@/api/client";
import { queryKeys } from "@/lib/queryKeys";

export function usePlaylist(id: number) {
  return useQuery({
    queryKey: queryKeys.playlist(id),
    queryFn: () => playlistsApi.get(id),
    enabled: Number.isFinite(id),
  });
}

export function usePlaylistTracks(id: number, params: Pagination = {}) {
  return useQuery({
    queryKey: queryKeys.playlistTracks(id, params),
    queryFn: () => playlistsApi.tracks(id, params),
    placeholderData: keepPreviousData,
    enabled: Number.isFinite(id),
  });
}
