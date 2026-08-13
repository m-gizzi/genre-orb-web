import type {
  ArtistMetadataSession,
  PushSession,
  SyncSession,
} from "@/api/client";
import { ReconnectBanner } from "@/components/spotify/ReconnectBanner";
import { SyncStatusBanner } from "./SyncStatusBanner";
import { ArtistSyncStatusBanner } from "./ArtistSyncStatusBanner";
import { PushStatusBanner } from "./PushStatusBanner";

interface SyncActivityProps {
  librarySession: SyncSession | null;
  artistSession: ArtistMetadataSession | null;
  activePushes?: PushSession[];
  finishedPushes?: PushSession[];
  needsReauth?: boolean;
  variant?: "inline" | "panel";
  onDismissLibrary?: () => void;
  onDismissArtist?: () => void;
  onDismissPush?: (id: number) => void;
}

export function SyncActivity({
  librarySession,
  artistSession,
  activePushes = [],
  finishedPushes = [],
  needsReauth = false,
  variant = "inline",
  onDismissLibrary,
  onDismissArtist,
  onDismissPush,
}: SyncActivityProps) {
  const pushes = [...activePushes, ...finishedPushes];

  if (!needsReauth && !librarySession && !artistSession && pushes.length === 0) {
    if (variant === "panel") {
      return <p className="text-sm text-muted-foreground">No active syncs.</p>;
    }
    return null;
  }

  return (
    <div className="space-y-4">
      {needsReauth && <ReconnectBanner />}
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
          onDismiss={onDismissPush ? () => onDismissPush(push.id) : undefined}
        />
      ))}
    </div>
  );
}
