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

  if (playlist.isError) return <ErrorState error={playlist.error} />;

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
          description={`${formatNumber(playlist.data.track_count)} tracks · synced ${formatDate(playlist.data.last_synced_at)}`}
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

      {tracks.isLoading ? (
        <TableSkeleton />
      ) : tracks.isError ? (
        <ErrorState error={tracks.error} />
      ) : (tracks.data?.data.length ?? 0) === 0 ? (
        <EmptyState
          title="No tracks in this version"
          description="This playlist hasn't been synced yet, or its current version is empty."
        />
      ) : (
        <>
          <TrackTable tracks={tracks.data!.data} numbering="index" />
          <Pagination
            meta={tracks.data!.meta}
            label="tracks"
            onPageChange={setPage}
            onPerPageChange={setPerPage}
          />
        </>
      )}
    </div>
  );
}
