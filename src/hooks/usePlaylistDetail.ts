import { useQuery, keepPreviousData } from "@tanstack/react-query";
import {
  playlistsApi,
  type GenreListParams,
  type PlaylistTrackParams,
} from "@/api/client";
import { queryKeys } from "@/lib/queryKeys";

export function usePlaylist(id: number) {
  return useQuery({
    queryKey: queryKeys.playlist(id),
    queryFn: () => playlistsApi.get(id),
    enabled: Number.isFinite(id),
  });
}

export function usePlaylistTracks(id: number, params: PlaylistTrackParams = {}) {
  return useQuery({
    queryKey: queryKeys.playlistTracks(id, params),
    queryFn: () => playlistsApi.tracks(id, params),
    placeholderData: keepPreviousData,
    enabled: Number.isFinite(id),
  });
}

export function usePlaylistGenres(id: number, params: GenreListParams = {}) {
  return useQuery({
    queryKey: queryKeys.playlistGenres(id, params),
    queryFn: () => playlistsApi.genres(id, params),
    placeholderData: keepPreviousData,
    enabled: Number.isFinite(id),
  });
}
