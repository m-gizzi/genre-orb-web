import type { RuleFieldSpec } from "@/api/client";
import { useAlbums } from "@/hooks/useAlbums";
import { useArtists } from "@/hooks/useArtists";
import { useGenres } from "@/hooks/useGenres";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { SuggestOption } from "@/components/catalog/SuggestCombobox";

const PER_PAGE = 8;

export interface RuleSuggestions {
  options: SuggestOption[];
  isLoading: boolean;
}

export function useRuleSuggestions(
  suggest: RuleFieldSpec["suggest"],
  query: string,
): RuleSuggestions {
  const debounced = useDebouncedValue(query, 250).trim();
  const params = { search: debounced || undefined, per_page: PER_PAGE };
  const ready = debounced.length > 0;

  const genres = useGenres(params, ready && suggest === "genres");
  const artists = useArtists(params, ready && suggest === "artists");
  const albums = useAlbums(params, ready && suggest === "albums");

  const settling = query.trim() !== debounced;

  switch (suggest) {
    case "genres":
      return {
        options: (genres.data?.data ?? []).map((g) => ({ id: g.id, label: g.name })),
        isLoading: settling || genres.isFetching,
      };
    case "artists":
      return {
        options: (artists.data?.data ?? []).map((a) => ({ id: a.id, label: a.name })),
        isLoading: settling || artists.isFetching,
      };
    case "albums":
      return {
        options: (albums.data?.data ?? []).map((a) => ({ id: a.id, label: a.title })),
        isLoading: settling || albums.isFetching,
      };
    default:
      return { options: [], isLoading: false };
  }
}
