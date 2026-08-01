import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/library/ProgressBar";
import { useSyncStatus } from "@/contexts/SyncStatusContext";
import { useLikedPlaylist, usePlaylists } from "@/hooks/usePlaylists";

interface SyncControlsProps {
  enabled: boolean;
}

export function SyncControls({ enabled }: SyncControlsProps) {
  const { library, artist } = useSyncStatus();

  const playlistsQuery = usePlaylists(enabled);
  const likedQuery = useLikedPlaylist(enabled);
  const liked = likedQuery.data ?? null;
  const playlists = liked
    ? [liked, ...(playlistsQuery.data ?? [])]
    : playlistsQuery.data;
  const hasPlaylists = !!playlists && playlists.length > 0;
  const hasSyncEnabled = playlists?.some((p) => p.sync_enabled) ?? false;

  const artistPercent =
    artist.artistsTotal > 0
      ? (artist.artistsSynced * 100) / artist.artistsTotal
      : 0;

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl font-semibold">Playlists</h2>
          <div className="flex gap-2">
            <Button
              onClick={() => library.fetchPlaylists()}
              variant="outline"
              size="sm"
              disabled={library.isFetchingPlaylists}
            >
              {library.isFetchingPlaylists
                ? "Fetching..."
                : hasPlaylists
                  ? "Refresh"
                  : "Fetch Playlists"}
            </Button>
            {hasSyncEnabled && (
              <Button
                onClick={() => library.start()}
                size="sm"
                disabled={library.hasActiveSync || library.isStarting}
              >
                {library.isStarting
                  ? "Starting..."
                  : library.hasActiveSync
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

      {artist.isError ? (
        <div className="rounded-lg border border-dashed border-destructive/40 p-6 text-center text-sm text-destructive">
          <p>Couldn't load artist metadata status.</p>
          <button
            type="button"
            onClick={() => artist.refetchStatus()}
            className="mt-1 underline"
          >
            Try again
          </button>
        </div>
      ) : artist.artistsTotal > 0 ? (
        <section className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-xl font-semibold">Artist Metadata</h2>
            <div className="flex gap-2">
              <Button
                onClick={() => artist.start()}
                size="sm"
                disabled={
                  artist.hasActiveSync ||
                  !artist.hasArtistsToSync ||
                  artist.isStarting ||
                  artist.isResyncing
                }
              >
                {artist.isStarting
                  ? "Starting..."
                  : artist.hasActiveSync
                    ? "Syncing..."
                    : "Sync Genres"}
              </Button>
              <Button
                onClick={() => artist.resyncAll()}
                variant="outline"
                size="sm"
                disabled={
                  artist.hasActiveSync || artist.isStarting || artist.isResyncing
                }
              >
                {artist.isResyncing ? "Starting..." : "Resync All"}
              </Button>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Artists with genres
              </span>
              <span className="font-medium">
                {artist.artistsSynced} / {artist.artistsTotal}
              </span>
            </div>
            <ProgressBar
              percent={artistPercent}
              className="mt-2"
              label="Artists with genres"
            />
            {!artist.hasArtistsToSync && (
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
