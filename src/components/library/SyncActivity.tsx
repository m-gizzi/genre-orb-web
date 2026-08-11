import type {
  ArtistMetadataSession,
  PushSession,
  SyncSession,
} from "@/api/client";
import { SyncStatusBanner } from "./SyncStatusBanner";
import { ArtistSyncStatusBanner } from "./ArtistSyncStatusBanner";
import { PushStatusBanner } from "./PushStatusBanner";

interface SyncActivityProps {
  librarySession: SyncSession | null;
  artistSession: ArtistMetadataSession | null;
  activePushes?: PushSession[];
  finishedPush?: PushSession | null;
  variant?: "inline" | "panel";
  onDismissLibrary?: () => void;
  onDismissArtist?: () => void;
  onDismissPush?: () => void;
}

export function SyncActivity({
  librarySession,
  artistSession,
  activePushes = [],
  finishedPush = null,
  variant = "inline",
  onDismissLibrary,
  onDismissArtist,
  onDismissPush,
}: SyncActivityProps) {
  const pushes = finishedPush ? [...activePushes, finishedPush] : activePushes;

  if (!librarySession && !artistSession && pushes.length === 0) {
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
      {pushes.map((push) => (
        <PushStatusBanner
          key={push.id}
          session={push}
          onDismiss={onDismissPush}
        />
      ))}
    </div>
  );
}
