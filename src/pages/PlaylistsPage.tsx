import { useState } from "react";
import { Link } from "react-router-dom";
import { HeartIcon, ListMusicIcon, PlusIcon, SparklesIcon } from "lucide-react";
import type { Playlist } from "@/api/client";
import { useLikedPlaylist, usePlaylistsPage } from "@/hooks/usePlaylists";
import { useUrlListParams } from "@/hooks/useUrlListParams";
import {
  parsePlaylistFilters,
  playlistFiltersToParams,
} from "@/lib/catalogFilterParams";
import { CARD_PER_PAGE_OPTIONS } from "@/lib/config";
import type { PlaylistSort } from "@/lib/sorts";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CardGridSkeleton,
  DebouncedSearchInput,
  EmptyState,
  Pagination,
  PlaylistSyncSwitch,
  QueryState,
  SortControl,
} from "@/components/catalog";
import { CreatePlaylistDialog } from "@/components/playlists/CreatePlaylistDialog";
import { MakeSmartDialog } from "@/components/smartPlaylists/MakeSmartDialog";
import { SmartBadge } from "@/components/smartPlaylists/SmartBadge";
import { formatDate, formatNumber } from "@/lib/format";

const SORT_LABELS: Record<PlaylistSort, string> = {
  name: "Name",
  last_synced_at: "Last synced",
  track_count: "Tracks",
};

export function PlaylistsPage() {
  const { filters, applyPatch } = useUrlListParams(
    parsePlaylistFilters,
    playlistFiltersToParams
  );

  const [creating, setCreating] = useState(false);
  const [convertTarget, setConvertTarget] = useState<Playlist | null>(null);

  const liked = useLikedPlaylist();
  const query = usePlaylistsPage(filters);
  const playlists = query.data?.data ?? [];

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
              sort={filters.sort}
              order={filters.order}
              options={SORT_LABELS}
              onSortChange={(sort) => applyPatch({ sort })}
              onOrderChange={(order) => applyPatch({ order })}
            />
            <Button onClick={() => setCreating(true)}>
              <PlusIcon /> New
            </Button>
          </div>
        }
      />

      {!filters.search && liked.data && <LikedSongsCard playlist={liked.data} />}

      <QueryState
        query={query}
        skeleton={<CardGridSkeleton />}
        isEmpty={playlists.length === 0}
        empty={
          filters.search ? (
            <EmptyState title="No playlists match your search" showOrb={false} />
          ) : (
            <EmptyState
              title="No playlists yet"
              description="Fetch and sync your Spotify playlists from the Library page."
              action={<Button render={<Link to="/library" />}>Go to Library</Button>}
            />
          )
        }
      >
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
                </Link>
                <div className="flex shrink-0 items-center gap-2">
                  {playlist.smart_playlist_id != null && (
                    <SmartBadge smartPlaylistId={playlist.smart_playlist_id} />
                  )}
                  <PlaylistSyncSwitch
                    playlistId={playlist.id}
                    name={playlist.name}
                    syncEnabled={playlist.sync_enabled}
                    locked={playlist.is_smart}
                  />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {formatNumber(playlist.track_count)} tracks · synced{" "}
                {formatDate(playlist.last_synced_at, "Never")}
              </p>
              {!playlist.is_smart && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="-mx-2 mt-1 justify-start"
                  onClick={() => setConvertTarget(playlist)}
                >
                  <SparklesIcon /> Make smart
                </Button>
              )}
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
      </QueryState>

      <CreatePlaylistDialog open={creating} onOpenChange={setCreating} />
      {convertTarget && (
        <MakeSmartDialog
          playlist={convertTarget}
          open
          onOpenChange={(open) => !open && setConvertTarget(null)}
        />
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
              {formatDate(playlist.last_synced_at, "Never")}
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
