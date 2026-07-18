import type { ArtistMetadataSession, SyncSession } from "@/api/client";
import { SyncStatusBanner } from "./SyncStatusBanner";
import { ArtistSyncStatusBanner } from "./ArtistSyncStatusBanner";

interface SyncActivityProps {
  librarySession: SyncSession | null;
  artistSession: ArtistMetadataSession | null;
  variant?: "inline" | "panel";
  onDismissLibrary?: () => void;
  onDismissArtist?: () => void;
}

export function SyncActivity({
  librarySession,
  artistSession,
  variant = "inline",
  onDismissLibrary,
  onDismissArtist,
}: SyncActivityProps) {
  if (!librarySession && !artistSession) {
    if (variant === "panel") {
      return <p className="text-sm text-muted-foreground">No active syncs.</p>;
    }
    return null;
  }

  return (
    <div className="space-y-4">
      {librarySession && (
        <SyncStatusBanner session={librarySession} onDismiss={onDismissLibrary} />
      )}
      {artistSession && (
        <ArtistSyncStatusBanner
          session={artistSession}
          onDismiss={onDismissArtist}
        />
      )}
    </div>
  );
}
