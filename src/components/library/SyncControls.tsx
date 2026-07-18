import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/library/ProgressBar";
import { useSyncStatus } from "@/contexts/SyncStatusContext";
import { useLikedPlaylist, usePlaylists } from "@/hooks/usePlaylists";

interface SyncControlsProps {
  enabled: boolean;
}

export function SyncControls({ enabled }: SyncControlsProps) {
  const {
    hasActiveLibrarySync,
    startLibrarySync,
    isStartingLibrarySync,
    fetchPlaylists,
    isFetchingPlaylists,
    artistSyncError,
    artistsTotal,
    artistsSynced,
    hasArtistsToSync,
    hasActiveArtistSync,
    startArtistSync,
    isStartingArtistSync,
    resyncAllArtists,
    isResyncingArtists,
    refetchArtistStatus,
  } = useSyncStatus();

  const playlistsQuery = usePlaylists(enabled);
  const likedQuery = useLikedPlaylist(enabled);
  const liked = likedQuery.data ?? null;
  const playlists = liked
    ? [liked, ...(playlistsQuery.data ?? [])]
    : playlistsQuery.data;
  const hasPlaylists = !!playlists && playlists.length > 0;
  const hasSyncEnabled = playlists?.some((p) => p.sync_enabled) ?? false;

  const artistPercent = artistsTotal > 0 ? (artistsSynced * 100) / artistsTotal : 0;

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl font-semibold">Playlists</h2>
          <div className="flex gap-2">
            <Button
              onClick={() => fetchPlaylists()}
              variant="outline"
              size="sm"
              disabled={isFetchingPlaylists}
            >
              {isFetchingPlaylists
                ? "Fetching..."
                : hasPlaylists
                  ? "Refresh"
                  : "Fetch Playlists"}
            </Button>
            {hasSyncEnabled && (
              <Button
                onClick={() => startLibrarySync()}
                size="sm"
                disabled={hasActiveLibrarySync || isStartingLibrarySync}
              >
                {isStartingLibrarySync
                  ? "Starting..."
                  : hasActiveLibrarySync
                    ? "Syncing..."
                    : "Sync"}
              </Button>
            )}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Choose which playlists to sync on the Playlists page, then sync here.
        </p>
      </section>

      {artistSyncError ? (
        <div className="rounded-lg border border-dashed border-destructive/40 p-6 text-center text-sm text-destructive">
          <p>Couldn't load artist metadata status.</p>
          <button
            type="button"
            onClick={() => refetchArtistStatus()}
            className="mt-1 underline"
          >
            Try again
          </button>
        </div>
      ) : artistsTotal > 0 ? (
        <section className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl font-semibold">Artist Metadata</h2>
            <div className="flex gap-2">
              <Button
                onClick={() => startArtistSync()}
                size="sm"
                disabled={
                  hasActiveArtistSync ||
                  !hasArtistsToSync ||
                  isStartingArtistSync ||
                  isResyncingArtists
                }
              >
                {isStartingArtistSync
                  ? "Starting..."
                  : hasActiveArtistSync
                    ? "Syncing..."
                    : "Sync Genres"}
              </Button>
              <Button
                onClick={() => resyncAllArtists()}
                variant="outline"
                size="sm"
                disabled={
                  hasActiveArtistSync || isStartingArtistSync || isResyncingArtists
                }
              >
                {isResyncingArtists ? "Starting..." : "Resync All"}
              </Button>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Artists with genres
              </span>
              <span className="font-medium">
                {artistsSynced} / {artistsTotal}
              </span>
            </div>
            <ProgressBar
              percent={artistPercent}
              className="mt-2"
              label="Artists with genres"
            />
            {!hasArtistsToSync && (
              <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
                All artists have genre metadata!
              </p>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
