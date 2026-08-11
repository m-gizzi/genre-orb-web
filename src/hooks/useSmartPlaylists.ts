import {
  useMutation,
  useQuery,
  useQueryClient,
  keepPreviousData,
  type QueryClient,
} from "@tanstack/react-query";
import {
  smartPlaylistsApi,
  type CreateSmartPlaylistInput,
  type SearchListParams,
  type UpdateSmartPlaylistInput,
} from "@/api/client";
import { queryKeys } from "@/lib/queryKeys";

export function invalidateSmartPlaylists(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: queryKeys.smartPlaylists });
  queryClient.invalidateQueries({ queryKey: queryKeys.smartPlaylistDetails });
  queryClient.invalidateQueries({ queryKey: queryKeys.playlists });
  queryClient.invalidateQueries({ queryKey: queryKeys.playlistDetails });
  queryClient.invalidateQueries({ queryKey: [queryKeys.ruleMatchesRoot] });
}

export function useSmartPlaylistsPage(
  params: SearchListParams = {},
  enabled = true
) {
  return useQuery({
    queryKey: queryKeys.smartPlaylistsPaged(params),
    queryFn: () => smartPlaylistsApi.paginated(params),
    enabled,
    placeholderData: keepPreviousData,
  });
}

export function useSmartPlaylist(id: number) {
  return useQuery({
    queryKey: queryKeys.smartPlaylist(id),
    queryFn: () => smartPlaylistsApi.get(id),
    enabled: Number.isFinite(id),
  });
}

export function useCreateSmartPlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSmartPlaylistInput) => smartPlaylistsApi.create(input),
    onSuccess: () => invalidateSmartPlaylists(queryClient),
  });
}

export function useUpdateSmartPlaylist(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateSmartPlaylistInput) => smartPlaylistsApi.update(id, input),
    onSuccess: () => invalidateSmartPlaylists(queryClient),
  });
}

export function useDeleteSmartPlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => smartPlaylistsApi.remove(id),
    onSuccess: () => invalidateSmartPlaylists(queryClient),
  });
}
