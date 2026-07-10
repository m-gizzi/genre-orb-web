import type { ArtistMetadataSession, SyncSessionStatus } from "@/api/client";
import { ProgressBar } from "./ProgressBar";
import { StatusBanner } from "./StatusBanner";
import { isSyncActive, syncStatusColor } from "./statusStyles";

const STATUS_LABEL: Record<SyncSessionStatus, string> = {
  pending: "Preparing artist sync...",
  running: "Syncing artist metadata...",
  completed: "Artist sync completed",
  failed: "Artist sync failed",
};

interface ArtistSyncStatusBannerProps {
  session: ArtistMetadataSession;
}

export function ArtistSyncStatusBanner({ session }: ArtistSyncStatusBannerProps) {
  const active = isSyncActive(session.status);

  return (
    <StatusBanner
      colorClass={syncStatusColor[session.status]}
      active={active}
      label={STATUS_LABEL[session.status]}
      headerRight={`${session.progress.completed}/${session.progress.total} batches`}
    >
      {active && (
        <ProgressBar
          percent={session.progress.percent}
          className="bg-white/50"
          barClassName="bg-current"
        />
      )}
    </StatusBanner>
  );
}
