import { useState } from "react";
import { useParams } from "react-router-dom";
import { PencilIcon, SparklesIcon } from "lucide-react";
import { usePlaylist, usePlaylistTracks } from "@/hooks/usePlaylistDetail";
import { usePagination } from "@/hooks/usePagination";
import { pageStartIndex } from "@/lib/pagination";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { EditPlaylistDialog } from "@/components/playlists/EditPlaylistDialog";
import { MakeSmartDialog } from "@/components/smartPlaylists/MakeSmartDialog";
import { SmartBadge } from "@/components/smartPlaylists/SmartBadge";
import { formatDate, formatNumber } from "@/lib/format";

export function PlaylistDetailPage() {
  const { id } = useParams();
  const playlistId = Number(id);
  const { page, perPage, setPage, setPerPage } = usePagination(50);
  const [editing, setEditing] = useState(false);
  const [converting, setConverting] = useState(false);

  const playlist = usePlaylist(playlistId);
  const tracks = usePlaylistTracks(playlistId, { page, per_page: perPage });
  const trackRows = tracks.data?.data ?? [];
  const data = playlist.data;

  // Liked Songs has no Spotify playlist behind it, so it can be neither edited
  // nor used as a smart playlist target.
  const canEdit = data != null && !data.is_liked_songs;
  const canMakeSmart = canEdit && !data.is_smart;

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
      {playlist.isLoading || !data ? (
        <Skeleton className="mb-6 h-12 w-64" />
      ) : (
        <PageHeader
          title={
            <span className="flex items-center gap-2">
              {data.name}
              {data.is_liked_songs && <Badge variant="secondary">Liked</Badge>}
              {data.smart_playlist_id != null && (
                <SmartBadge smartPlaylistId={data.smart_playlist_id} />
              )}
            </span>
          }
          description={
            <>
              {data.description && <span className="block">{data.description}</span>}
              {formatNumber(data.track_count)} tracks · synced{" "}
              {formatDate(data.last_synced_at, "Never")}
            </>
          }
          actions={
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <span aria-hidden="true">Sync</span>
                <PlaylistSyncSwitch
                  playlistId={data.id}
                  name={data.name}
                  syncEnabled={data.sync_enabled}
                  locked={data.is_smart}
                />
              </span>
              {canEdit && (
                <Button variant="outline" onClick={() => setEditing(true)}>
                  <PencilIcon /> Edit
                </Button>
              )}
              {canMakeSmart && (
                <Button onClick={() => setConverting(true)}>
                  <SparklesIcon /> Make smart
                </Button>
              )}
            </div>
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
        <TrackTable
          tracks={trackRows}
          numbering="index"
          startIndex={pageStartIndex(tracks.data?.meta)}
        />
        {tracks.data && (
          <Pagination
            meta={tracks.data.meta}
            label="tracks"
            onPageChange={setPage}
            onPerPageChange={setPerPage}
          />
        )}
      </QueryState>

      {data && (
        <>
          {canEdit && (
            <EditPlaylistDialog
              playlist={data}
              open={editing}
              onOpenChange={setEditing}
            />
          )}
          {canMakeSmart && (
            <MakeSmartDialog
              playlist={data}
              open={converting}
              onOpenChange={setConverting}
            />
          )}
        </>
      )}
    </div>
  );
}
