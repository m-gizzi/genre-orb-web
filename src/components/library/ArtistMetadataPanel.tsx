import { Button } from "@/components/ui/button";
import { ArtistSyncStatusBanner } from "@/components/library/ArtistSyncStatusBanner";
import { ProgressBar } from "@/components/library/ProgressBar";
import { useArtistSync } from "@/hooks/useArtistSync";
import type { TransientMessage } from "@/hooks/useTransientMessage";

interface ArtistMetadataPanelProps {
  enabled: boolean;
  onMessage: (message: TransientMessage) => void;
}

export function ArtistMetadataPanel({ enabled, onMessage }: ArtistMetadataPanelProps) {
  const {
    status,
    isError,
    refetch,
    currentSession,
    hasActiveSync,
    artistsTotal,
    artistsSynced,
    hasArtistsToSync,
    sync,
    isSyncing,
    resyncAll,
    isResyncing,
  } = useArtistSync({ enabled, onMessage });

  if (isError) {
    return (
      <div className="rounded-lg border border-dashed border-red-300 p-6 text-center text-sm text-red-700">
        <p>Couldn't load artist metadata status.</p>
        <button type="button" onClick={() => refetch()} className="mt-1 underline">
          Try again
        </button>
      </div>
    );
  }

  if (!status || artistsTotal === 0) return null;

  const percent = (artistsSynced * 100) / artistsTotal;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Artist Metadata</h2>
        <div className="flex gap-2">
          <Button
            onClick={() => sync()}
            size="sm"
            disabled={hasActiveSync || !hasArtistsToSync || isSyncing || isResyncing}
          >
            {isSyncing ? "Starting..." : hasActiveSync ? "Syncing..." : "Sync Genres"}
          </Button>
          <Button
            onClick={() => resyncAll()}
            variant="outline"
            size="sm"
            disabled={hasActiveSync || isSyncing || isResyncing}
          >
            {isResyncing ? "Starting..." : "Resync All"}
          </Button>
        </div>
      </div>

      {currentSession && <ArtistSyncStatusBanner session={currentSession} />}

      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Artists with genres</span>
          <span className="font-medium">
            {artistsSynced} / {artistsTotal}
          </span>
        </div>
        <ProgressBar percent={percent} className="mt-2" label="Artists with genres" />
        {!hasArtistsToSync && (
          <p className="mt-2 text-sm text-green-600">
            All artists have genre metadata!
          </p>
        )}
      </div>
    </div>
  );
}
