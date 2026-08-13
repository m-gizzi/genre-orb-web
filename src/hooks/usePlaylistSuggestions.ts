import type { Playlist } from "@/api/client";
import { useLikedPlaylist, usePlaylistsPage } from "@/hooks/usePlaylists";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { SuggestOption } from "@/components/catalog/SuggestCombobox";

const PER_PAGE = 8;

export interface PlaylistSuggestion extends SuggestOption {
  id: number;
  trackCount: number;
}

export interface PlaylistSuggestions {
  options: PlaylistSuggestion[];
  isLoading: boolean;
}

export function usePlaylistSuggestions(query: string): PlaylistSuggestions {
  const debounced = useDebouncedValue(query, 250).trim();
  const ready = debounced.length > 0;

  const page = usePlaylistsPage(
    { search: debounced || undefined, per_page: PER_PAGE },
    ready,
  );
  const liked = useLikedPlaylist(ready);

  const settling = query.trim() !== debounced;
  const likedMatch =
    liked.data && matchesSearch(liked.data.name, debounced) ? [liked.data] : [];

  return {
    options: [...likedMatch, ...(page.data?.data ?? [])].map(toSuggestion),
    isLoading: settling || page.isFetching || liked.isFetching,
  };
}

function matchesSearch(name: string, search: string): boolean {
  return name.toLowerCase().includes(search.toLowerCase());
}

function toSuggestion(playlist: Playlist): PlaylistSuggestion {
  return {
    id: playlist.id,
    label: playlist.name,
    trackCount: playlist.track_count,
  };
}
