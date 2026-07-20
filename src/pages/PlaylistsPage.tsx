import { useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { HeartIcon, ListMusicIcon } from "lucide-react";
import type { Playlist, SearchListParams } from "@/api/client";
import { useLikedPlaylist, usePlaylistsPage } from "@/hooks/usePlaylists";
import {
  parseListParams,
  listParamsToParams,
} from "@/lib/catalogFilterParams";
import { CARD_PER_PAGE_OPTIONS } from "@/lib/config";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CardGridSkeleton,
  DebouncedSearchInput,
  EmptyState,
  ErrorState,
  Pagination,
  PlaylistSyncSwitch,
  SortControl,
} from "@/components/catalog";
import { formatDate, formatNumber } from "@/lib/format";

const SORT_LABELS: Record<string, string> = {
  name: "Name",
  last_synced_at: "Last synced",
  track_count: "Tracks",
};
const LIST_OPTIONS = { defaultSort: "name" };

export function PlaylistsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseListParams(searchParams, LIST_OPTIONS);

  const liked = useLikedPlaylist();
  const query = usePlaylistsPage(filters);
  const playlists = query.data?.data ?? [];

  const applyPatch = useCallback(
    (patch: Partial<SearchListParams>) => {
      const next = { ...parseListParams(searchParams, LIST_OPTIONS), ...patch };
      if (!("page" in patch)) next.page = 1;
      setSearchParams(listParamsToParams(next, LIST_OPTIONS), { replace: true });
    },
    [searchParams, setSearchParams]
  );

  return (
    <div>
      <PageHeader
        title="Playlists"
        description="Your synced playlists and Liked Songs."
        actions={
          <div className="flex items-center gap-2">
            <DebouncedSearchInput
              value={filters.search ?? ""}
              onCommit={(value) => applyPatch({ search: value || undefined })}
              placeholder="Search playlists…"
            />
            <SortControl
              sort={filters.sort ?? "name"}
              order={filters.order ?? "asc"}
              options={SORT_LABELS}
              onSortChange={(sort) => applyPatch({ sort })}
              onOrderChange={(order) => applyPatch({ order })}
            />
          </div>
        }
      />

      {!filters.search && liked.data && <LikedSongsCard playlist={liked.data} />}

      {query.isLoading ? (
        <CardGridSkeleton />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : playlists.length === 0 ? (
        filters.search ? (
          <EmptyState title="No playlists match your search" showOrb={false} />
        ) : (
          <EmptyState
            title="No playlists yet"
            description="Fetch and sync your Spotify playlists from the Library page."
            action={<Button render={<Link to="/library" />}>Go to Library</Button>}
          />
        )
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {playlists.map((playlist) => (
              <Card key={playlist.id} className="gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    to={`/playlists/${playlist.id}`}
                    className="flex min-w-0 items-center gap-2 hover:text-primary"
                  >
                    <ListMusicIcon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate font-medium">{playlist.name}</span>
                    {playlist.is_liked_songs && (
                      <Badge variant="secondary" className="shrink-0">
                        Liked
                      </Badge>
                    )}
                  </Link>
                  <PlaylistSyncSwitch
                    playlistId={playlist.id}
                    name={playlist.name}
                    syncEnabled={playlist.sync_enabled}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatNumber(playlist.track_count)} tracks · synced{" "}
                  {formatDate(playlist.last_synced_at)}
                </p>
              </Card>
            ))}
          </div>
          {query.data && (
            <Pagination
              meta={query.data.meta}
              label="playlists"
              onPageChange={(page) => applyPatch({ page })}
              onPerPageChange={(per_page) => applyPatch({ per_page })}
              perPageOptions={CARD_PER_PAGE_OPTIONS}
            />
          )}
        </>
      )}
    </div>
  );
}

function LikedSongsCard({ playlist }: { playlist: Playlist }) {
  return (
    <Card className="mb-6 gap-0 border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center justify-between gap-3">
        <Link
          to={`/playlists/${playlist.id}`}
          className="flex min-w-0 items-center gap-3 hover:text-primary"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
            <HeartIcon className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block font-medium">Liked Songs</span>
            <span className="block text-sm text-muted-foreground">
              {formatNumber(playlist.track_count)} tracks · synced{" "}
              {formatDate(playlist.last_synced_at)}
            </span>
          </span>
        </Link>
        <PlaylistSyncSwitch
          playlistId={playlist.id}
          name="Liked Songs"
          syncEnabled={playlist.sync_enabled}
        />
      </div>
    </Card>
  );
}
