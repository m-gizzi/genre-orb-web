import type { SyncSession } from "@/api/client";

interface SyncStatusBannerProps {
  session: SyncSession;
}

export function SyncStatusBanner({ session }: SyncStatusBannerProps) {
  const isActive =
    session.status === "pending" ||
    session.status === "running" ||
    session.status === "paused";

  const statusText = {
    pending: "Preparing sync...",
    running: "Syncing library...",
    paused: "Sync paused (rate limited)",
    completed: "Sync completed",
    failed: "Sync failed",
    cancelled: "Sync cancelled",
  }[session.status];

  const statusColor = {
    pending: "bg-yellow-100 border-yellow-300 text-yellow-800",
    running: "bg-blue-100 border-blue-300 text-blue-800",
    paused: "bg-orange-100 border-orange-300 text-orange-800",
    completed: "bg-green-100 border-green-300 text-green-800",
    failed: "bg-red-100 border-red-300 text-red-800",
    cancelled: "bg-gray-100 border-gray-300 text-gray-800",
  }[session.status];

  return (
    <div className={`rounded-lg border p-4 ${statusColor}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isActive && (
            <div className="h-3 w-3 animate-pulse rounded-full bg-current" />
          )}
          <span className="font-medium">{statusText}</span>
        </div>
        <span className="text-sm">
          {session.progress.completed}/{session.progress.total} playlists
        </span>
      </div>

      {isActive && (
        <div className="mt-3">
          <div className="mb-2 h-2 overflow-hidden rounded-full bg-white/50">
            <div
              className="h-full bg-current transition-all duration-500"
              style={{ width: `${session.progress.percent}%` }}
            />
          </div>

          <div className="mt-2 space-y-1 text-sm">
            {session.playlists.map((playlist) => (
              <div
                key={playlist.playlist_id}
                className="flex items-center justify-between"
              >
                <span className="truncate">{playlist.playlist_name}</span>
                <span className="ml-2 shrink-0">
                  {playlist.status === "completed" && "Done"}
                  {playlist.status === "fetching_pages" &&
                    `${playlist.page_progress.completed}/${playlist.page_progress.total} pages`}
                  {playlist.status === "pending" && "Waiting..."}
                  {playlist.status === "failed" && "Failed"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
