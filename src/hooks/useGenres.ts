import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { genresApi, type SearchListParams } from "@/api/client";
import { queryKeys } from "@/lib/queryKeys";

export function useGenres(params: SearchListParams = {}) {
  return useQuery({
    queryKey: queryKeys.genres(params),
    queryFn: () => genresApi.list(params),
    placeholderData: keepPreviousData,
  });
}

export function useGenre(id: number) {
  return useQuery({
    queryKey: queryKeys.genre(id),
    queryFn: () => genresApi.get(id),
    enabled: Number.isFinite(id),
  });
}
