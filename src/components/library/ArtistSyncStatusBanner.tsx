import type { ArtistMetadataSession } from "@/api/client";

interface ArtistSyncStatusBannerProps {
  session: ArtistMetadataSession;
}

export function ArtistSyncStatusBanner({
  session,
}: ArtistSyncStatusBannerProps) {
  const isActive = session.status === "pending" || session.status === "running";

  const statusText = {
    pending: "Preparing artist sync...",
    running: "Syncing artist metadata...",
    completed: "Artist sync completed",
    failed: "Artist sync failed",
  }[session.status];

  const statusColor = {
    pending: "bg-yellow-100 border-yellow-300 text-yellow-800",
    running: "bg-blue-100 border-blue-300 text-blue-800",
    completed: "bg-green-100 border-green-300 text-green-800",
    failed: "bg-red-100 border-red-300 text-red-800",
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
          {session.progress.completed}/{session.progress.total} batches
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
        </div>
      )}
    </div>
  );
}
