import { Button } from "@/components/ui/button";
import { PlaylistList } from "@/components/library/PlaylistList";
import { SyncStatusBanner } from "@/components/library/SyncStatusBanner";
import { useLibrarySync } from "@/hooks/useLibrarySync";
import { usePlaylists } from "@/hooks/usePlaylists";
import type { TransientMessage } from "@/hooks/useTransientMessage";

interface LibrarySectionProps {
  enabled: boolean;
  onMessage: (message: TransientMessage) => void;
}

export function LibrarySection({ enabled, onMessage }: LibrarySectionProps) {
  const {
    currentSession,
    hasActiveSync,
    sync,
    isSyncing,
    fetchPlaylists,
    isFetchingPlaylists,
  } = useLibrarySync({ enabled, onMessage });

  const playlistsQuery = usePlaylists(enabled);
  const playlists = playlistsQuery.data;
  const hasPlaylists = !!playlists && playlists.length > 0;
  const hasSyncEnabled = playlists?.some((p) => p.sync_enabled) ?? false;

  return (
    <>
      {currentSession && <SyncStatusBanner session={currentSession} />}

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Your Playlists</h2>
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
                onClick={() => sync()}
                size="sm"
                disabled={hasActiveSync || isSyncing}
              >
                {isSyncing ? "Starting..." : hasActiveSync ? "Syncing..." : "Sync"}
              </Button>
            )}
          </div>
        </div>

        {playlistsQuery.isLoading ? (
          <p className="text-sm text-muted-foreground">Loading playlists...</p>
        ) : playlistsQuery.isError ? (
          <div className="rounded-lg border border-dashed border-red-300 p-6 text-center text-sm text-red-700">
            <p>Couldn't load your playlists.</p>
            <button
              type="button"
              onClick={() => playlistsQuery.refetch()}
              className="mt-1 underline"
            >
              Try again
            </button>
          </div>
        ) : playlists && playlists.length > 0 ? (
          <>
            <p className="text-sm text-muted-foreground">
              Toggle the playlists you want to sync, then click Sync.
            </p>
            <PlaylistList playlists={playlists} />
          </>
        ) : (
          <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            <p>No playlists loaded yet.</p>
            <p className="mt-1 text-sm">
              Click "Fetch Playlists" to load your Spotify playlists.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
