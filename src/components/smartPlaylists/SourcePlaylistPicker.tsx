import { useEffect, useMemo, useState, type UIEvent } from "react";
import { HeartIcon, ListMusicIcon } from "lucide-react";
import type { PlaylistSummary } from "@/api/client";
import { useInfinitePlaylists, useLikedPlaylist } from "@/hooks/usePlaylists";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { SearchInput } from "@/components/catalog";
import { formatNumber } from "@/lib/format";

const SCROLL_THRESHOLD_PX = 48;

interface PlaylistOption {
  id: number;
  name: string;
  is_liked_songs: boolean;
  track_count?: number;
}

interface SourcePlaylistPickerProps {
  selectedIds: number[];
  onChange: (ids: number[]) => void;
  excludePlaylistId?: number;
  initialSelected?: PlaylistSummary[];
}

function matchesSearch(option: PlaylistOption, search: string) {
  return option.name.toLowerCase().includes(search.trim().toLowerCase());
}

export function SourcePlaylistPicker({
  selectedIds,
  onChange,
  excludePlaylistId,
  initialSelected = [],
}: SourcePlaylistPickerProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const query = useInfinitePlaylists(debouncedSearch);
  const liked = useLikedPlaylist();

  const loaded = useMemo(
    () => (query.data?.pages ?? []).flatMap((page) => page.data),
    [query.data],
  );

  const [seen, setSeen] = useState<Map<number, PlaylistOption>>(
    () => new Map(initialSelected.map((playlist) => [playlist.id, playlist])),
  );

  useEffect(() => {
    const incoming = [...loaded, ...(liked.data ? [liked.data] : [])];
    if (incoming.length === 0) return;

    setSeen((previous) => {
      const next = new Map(previous);
      let changed = false;
      for (const option of incoming) {
        if (!next.has(option.id)) {
          next.set(option.id, option);
          changed = true;
        }
      }
      return changed ? next : previous;
    });
  }, [loaded, liked.data]);

  const selected = selectedIds
    .filter((id) => id !== excludePlaylistId)
    .map((id) => seen.get(id))
    .filter((option): option is PlaylistOption => option != null);

  const results = [
    ...(liked.data && matchesSearch(liked.data, debouncedSearch) ? [liked.data] : []),
    ...loaded,
  ].filter(
    (option) => option.id !== excludePlaylistId && !selectedIds.includes(option.id),
  );

  function toggle(id: number, checked: boolean) {
    onChange(checked ? [...selectedIds, id] : selectedIds.filter((v) => v !== id));
  }

  function handleScroll(event: UIEvent<HTMLDivElement>) {
    const { scrollTop, clientHeight, scrollHeight } = event.currentTarget;
    if (scrollHeight - scrollTop - clientHeight > SCROLL_THRESHOLD_PX) return;
    if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
  }

  return (
    <div className="space-y-2">
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search playlists…"
      />

      <div
        className="max-h-52 overflow-y-auto rounded-md border"
        onScroll={handleScroll}
        data-testid="source-playlist-scroller"
      >
        {selected.length > 0 && (
          <>
            <p className="sticky top-0 bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
              Selected ({selected.length})
            </p>
            <div className="divide-y">
              {selected.map((option) => (
                <PlaylistRow
                  key={option.id}
                  option={option}
                  checked
                  onToggle={toggle}
                />
              ))}
            </div>
          </>
        )}

        {query.isLoading ? (
          <div className="space-y-2 p-3">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </div>
        ) : (
          <div className="divide-y">
            {results.map((option) => (
              <PlaylistRow
                key={option.id}
                option={option}
                checked={false}
                onToggle={toggle}
              />
            ))}
          </div>
        )}

        {query.isFetchingNextPage && (
          <p className="px-3 py-2 text-xs text-muted-foreground">Loading more…</p>
        )}

        {!query.isLoading && results.length === 0 && selected.length === 0 && (
          <p className="p-3 text-sm text-muted-foreground">
            {debouncedSearch
              ? "No playlists match your search."
              : "No playlists available to filter from. Sync your library first."}
          </p>
        )}
      </div>
    </div>
  );
}

interface PlaylistRowProps {
  option: PlaylistOption;
  checked: boolean;
  onToggle: (id: number, checked: boolean) => void;
}

function PlaylistRow({ option, checked, onToggle }: PlaylistRowProps) {
  return (
    <Label className="cursor-pointer gap-3 px-3 py-2 font-normal hover:bg-muted/50">
      <input
        type="checkbox"
        className="size-4 accent-primary"
        checked={checked}
        onChange={(event) => onToggle(option.id, event.target.checked)}
      />
      {option.is_liked_songs ? (
        <HeartIcon className="size-4 shrink-0 text-primary" />
      ) : (
        <ListMusicIcon className="size-4 shrink-0 text-muted-foreground" />
      )}
      <span className="min-w-0 flex-1 truncate">{option.name}</span>
      {option.track_count != null && (
        <span className="shrink-0 text-xs text-muted-foreground">
          {formatNumber(option.track_count)}
        </span>
      )}
    </Label>
  );
}
