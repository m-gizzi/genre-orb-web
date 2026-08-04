import type { RuleFieldSpec } from "@/api/client";
import { useAlbums } from "@/hooks/useAlbums";
import { useArtists } from "@/hooks/useArtists";
import { useGenres } from "@/hooks/useGenres";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { SuggestOption } from "@/components/catalog/SuggestCombobox";

const PER_PAGE = 8;

export function useRuleSuggestions(
  suggest: RuleFieldSpec["suggest"],
  query: string,
): SuggestOption[] {
  const search = useDebouncedValue(query, 250).trim();
  const params = { search: search || undefined, per_page: PER_PAGE };
  const ready = search.length > 0;

  const genres = useGenres(params, ready && suggest === "genres");
  const artists = useArtists(params, ready && suggest === "artists");
  const albums = useAlbums(params, ready && suggest === "albums");

  switch (suggest) {
    case "genres":
      return (genres.data?.data ?? []).map((g) => ({ id: g.id, label: g.name }));
    case "artists":
      return (artists.data?.data ?? []).map((a) => ({ id: a.id, label: a.name }));
    case "albums":
      return (albums.data?.data ?? []).map((a) => ({ id: a.id, label: a.title }));
    default:
      return [];
  }
}
