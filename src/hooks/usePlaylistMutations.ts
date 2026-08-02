import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import {
  playlistsApi,
  type NewPlaylistAttributes,
  type PlaylistUpdate,
} from "@/api/client";
import { queryKeys } from "@/lib/queryKeys";

function invalidatePlaylists(queryClient: QueryClient, id?: number) {
  queryClient.invalidateQueries({ queryKey: queryKeys.playlists });
  if (id != null) {
    queryClient.invalidateQueries({ queryKey: queryKeys.playlist(id) });
  }
}

export function useCreatePlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: NewPlaylistAttributes) => playlistsApi.create(data),
    onSuccess: () => invalidatePlaylists(queryClient),
  });
}

export function useUpdatePlaylist(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PlaylistUpdate) => playlistsApi.update(id, data),
    onSuccess: () => invalidatePlaylists(queryClient, id),
  });
}
