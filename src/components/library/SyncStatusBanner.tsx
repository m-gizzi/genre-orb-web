import { useMemo } from "react";
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
  completed_with_errors: "Sync finished with errors",
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
  onDismiss?: () => void;
}

export function SyncStatusBanner({ session, onDismiss }: SyncStatusBannerProps) {
  const active = isSyncActive(session.status);
  const showErrors =
    !active &&
    (session.status === "failed" ||
      session.status === "completed_with_errors");

  const playlists = useMemo(
    () => [...session.playlists].sort((a, b) => a.playlist_id - b.playlist_id),
    [session.playlists]
  );
  const failedPlaylists = playlists.filter((p) => p.status === "failed");

  return (
    <StatusBanner
      colorClass={syncStatusColor[session.status]}
      active={active}
      label={STATUS_LABEL[session.status]}
      headerRight={`${session.progress.completed}/${session.progress.total} playlists`}
      onDismiss={active ? undefined : onDismiss}
    >
      {active && (
        <>
          <ProgressBar
            percent={session.progress.percent}
            className="mb-2 bg-white/50"
            barClassName="bg-current"
            label="Library sync progress"
          />
          <div className="mt-2 space-y-1 text-sm">
            {playlists.map((playlist) => (
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

      {showErrors && (
        <div className="space-y-1 text-sm">
          {session.error_message && <p>{session.error_message}</p>}
          {failedPlaylists.map((playlist) => (
            <div
              key={playlist.playlist_id}
              className="flex items-center justify-between gap-2"
            >
              <span className="truncate">{playlist.playlist_name}</span>
              <span className="ml-2 shrink-0 opacity-80">
                {playlist.error_message ?? "Failed"}
              </span>
            </div>
          ))}
        </div>
      )}
    </StatusBanner>
  );
}
