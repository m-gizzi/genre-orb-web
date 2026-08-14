import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  artistGenresApi,
  genrePreferencesApi,
  trackGenresApi,
  type GenreOverrideInput,
  type GenrePreferences,
  type GenrePreferencesUpdate,
} from "@/api/client";
import { queryKeys } from "@/lib/queryKeys";
import { invalidateLibraryQueries } from "@/lib/invalidate";

export function useGenrePreferences() {
  return useQuery({
    queryKey: queryKeys.genrePreferences,
    queryFn: () => genrePreferencesApi.get(),
  });
}

export function useUpdateGenrePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (update: GenrePreferencesUpdate) =>
      genrePreferencesApi.update(update),
    onSuccess: (preferences: GenrePreferences) => {
      queryClient.setQueryData(queryKeys.genrePreferences, preferences);
      invalidateLibraryQueries(queryClient);
    },
  });
}

export function useBlockedGenreIds(): Set<number> {
  const { data } = useGenrePreferences();
  return new Set((data?.blocked_genres ?? []).map((genre) => genre.id));
}

export function useToggleBlockedGenre() {
  const { data } = useGenrePreferences();
  const update = useUpdateGenrePreferences();

  return {
    ...update,
    ready: data != null,
    toggle: (genreId: number, blocked: boolean) => {
      if (!data) return Promise.resolve(null);

      const current = data.blocked_genres.map((genre) => genre.id);
      const next = blocked
        ? [...new Set([...current, genreId])]
        : current.filter((id) => id !== genreId);

      return update.mutateAsync({ blocked_genre_ids: next });
    },
  };
}

type Subject = "track" | "artist";

const apis = { track: trackGenresApi, artist: artistGenresApi };

export function useGenreOverrides(subject: Subject, id: number) {
  const queryClient = useQueryClient();
  const api = apis[subject];
  const onSuccess = () => invalidateLibraryQueries(queryClient);

  const set = useMutation({
    mutationFn: (genre: GenreOverrideInput) => api.set(id, genre),
    onSuccess,
  });

  const clear = useMutation({
    mutationFn: (genreId: number) => api.clear(id, genreId),
    onSuccess,
  });

  return {
    hide: (genreId: number) => set.mutate({ genre_id: genreId, action: "hidden" }),
    add: (name: string) => set.mutate({ name, action: "added" }),
    revert: (genreId: number) => clear.mutate(genreId),
    isPending: set.isPending || clear.isPending,
    error: set.error ?? clear.error,
  };
}
