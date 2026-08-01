import { useParams } from "react-router-dom";
import { usePlaylist, usePlaylistTracks } from "@/hooks/usePlaylistDetail";
import { usePagination } from "@/hooks/usePagination";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  EmptyState,
  ErrorState,
  Pagination,
  PlaylistSyncSwitch,
  QueryState,
  TableSkeleton,
  TrackTable,
} from "@/components/catalog";
import { formatDate, formatNumber } from "@/lib/format";

export function PlaylistDetailPage() {
  const { id } = useParams();
  const playlistId = Number(id);
  const { page, perPage, setPage, setPerPage } = usePagination(50);

  const playlist = usePlaylist(playlistId);
  const tracks = usePlaylistTracks(playlistId, { page, per_page: perPage });
  const trackRows = tracks.data?.data ?? [];

  if (!Number.isFinite(playlistId)) {
    return (
      <ErrorState
        title="Playlist not found"
        description="This playlist doesn't exist or isn't in your library."
      />
    );
  }
  if (playlist.isError) {
    return <ErrorState error={playlist.error} onRetry={() => playlist.refetch()} />;
  }

  return (
    <div>
      {playlist.isLoading || !playlist.data ? (
        <Skeleton className="mb-6 h-12 w-64" />
      ) : (
        <PageHeader
          title={
            <span className="flex items-center gap-2">
              {playlist.data.name}
              {playlist.data.is_liked_songs && (
                <Badge variant="secondary">Liked</Badge>
              )}
            </span>
          }
          description={`${formatNumber(playlist.data.track_count)} tracks · synced ${formatDate(playlist.data.last_synced_at, "Never")}`}
          actions={
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              Sync
              <PlaylistSyncSwitch
                playlistId={playlist.data.id}
                name={playlist.data.name}
                syncEnabled={playlist.data.sync_enabled}
              />
            </label>
          }
        />
      )}

      <QueryState
        query={tracks}
        skeleton={<TableSkeleton />}
        isEmpty={trackRows.length === 0}
        empty={
          <EmptyState
            title="No tracks in this version"
            description="This playlist hasn't been synced yet, or its current version is empty."
          />
        }
      >
        <TrackTable tracks={trackRows} numbering="index" />
        {tracks.data && (
          <Pagination
            meta={tracks.data.meta}
            label="tracks"
            onPageChange={setPage}
            onPerPageChange={setPerPage}
          />
        )}
      </QueryState>
    </div>
  );
}
