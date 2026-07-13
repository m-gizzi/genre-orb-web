import { useQuery } from "@tanstack/react-query";
import { playlistsApi, type PageParams } from "@/api/client";
import { queryKeys } from "@/lib/queryKeys";

export function usePlaylist(id: number) {
  return useQuery({
    queryKey: queryKeys.playlist(id),
    queryFn: () => playlistsApi.get(id),
    enabled: Number.isFinite(id),
  });
}

export function usePlaylistTracks(id: number, params: PageParams = {}) {
  return useQuery({
    queryKey: queryKeys.playlistTracks(id, params),
    queryFn: () => playlistsApi.tracks(id, params),
    enabled: Number.isFinite(id),
  });
}
