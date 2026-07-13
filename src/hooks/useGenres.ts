import { useQuery } from "@tanstack/react-query";
import { genresApi, type PageParams } from "@/api/client";
import { queryKeys } from "@/lib/queryKeys";

export function useGenres(params: PageParams = {}) {
  return useQuery({
    queryKey: queryKeys.genres(params),
    queryFn: () => genresApi.list(params),
  });
}
