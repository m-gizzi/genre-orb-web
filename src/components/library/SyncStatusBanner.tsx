import type {
  SyncSession,
  SyncSessionPlaylist,
  SyncSessionStatus,
} from "@/api/client";
import { assertNever } from "@/lib/utils";
import { ProgressBar } from "./ProgressBar";
import { StatusBanner } from "./StatusBanner";
import { isSyncActive, syncStatusColor } from "./statusStyles";

const STATUS_LABEL: Record<SyncSessionStatus, string> = {
  pending: "Preparing sync...",
  running: "Syncing library...",
  completed: "Sync completed",
  failed: "Sync failed",
};

function playlistStatusText(playlist: SyncSessionPlaylist): string {
  switch (playlist.status) {
    case "completed":
      return "Done";
    case "fetching_pages":
      return `${playlist.page_progress.completed}/${playlist.page_progress.total} pages`;
    case "pending":
      return "Waiting...";
    case "failed":
      return "Failed";
    case "skipped":
      return "Skipped";
    default:
      return assertNever(playlist.status);
  }
}

interface SyncStatusBannerProps {
  session: SyncSession;
}

export function SyncStatusBanner({ session }: SyncStatusBannerProps) {
  const active = isSyncActive(session.status);

  return (
    <StatusBanner
      colorClass={syncStatusColor[session.status]}
      active={active}
      label={STATUS_LABEL[session.status]}
      headerRight={`${session.progress.completed}/${session.progress.total} playlists`}
    >
      {active && (
        <>
          <ProgressBar
            percent={session.progress.percent}
            className="mb-2 bg-white/50"
            barClassName="bg-current"
          />
          <div className="mt-2 space-y-1 text-sm">
            {session.playlists.map((playlist) => (
              <div
                key={playlist.playlist_id}
                className="flex items-center justify-between"
              >
                <span className="truncate">{playlist.playlist_name}</span>
                <span className="ml-2 shrink-0">
                  {playlistStatusText(playlist)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </StatusBanner>
  );
}
