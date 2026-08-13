import type { PushSession, PushSessionStatus } from "@/api/client";
import { formatNumber } from "@/lib/format";
import { ProgressBar } from "./ProgressBar";
import { StatusBanner } from "./StatusBanner";
import { isSyncActive, syncStatusColor } from "./statusStyles";

const STATUS_LABEL: Record<PushSessionStatus, (name: string) => string> = {
  pending: (name) => `Preparing to push ${name}...`,
  running: (name) => `Pushing ${name} to Spotify...`,
  completed: (name) => `Pushed ${name} to Spotify`,
  failed: (name) => `Push of ${name} failed`,
  skipped: (name) => `Nothing to push for ${name}`,
};

function changeSummary(session: PushSession): string | undefined {
  const parts: string[] = [];
  if (session.tracks_added > 0) {
    parts.push(`${formatNumber(session.tracks_added)} added`);
  }
  if (session.tracks_removed > 0) {
    parts.push(`${formatNumber(session.tracks_removed)} removed`);
  }
  if (parts.length > 0) return parts.join(", ");
  return session.status === "completed" ? "already up to date" : undefined;
}

interface PushStatusBannerProps {
  session: PushSession;
  onDismiss?: () => void;
}

export function PushStatusBanner({ session, onDismiss }: PushStatusBannerProps) {
  const active = isSyncActive(session.status);

  return (
    <StatusBanner
      colorClass={syncStatusColor[session.status]}
      active={active}
      label={STATUS_LABEL[session.status](session.smart_playlist_name)}
      headerRight={changeSummary(session)}
      onDismiss={active ? undefined : onDismiss}
    >
      {active && (
        <ProgressBar
          percent={session.progress.percent}
          className="bg-white/50"
          barClassName="bg-current"
          label={`Push progress for ${session.smart_playlist_name}`}
        />
      )}
      {session.sampled && (
        <p className="mt-2 text-sm">
          These rules match {formatNumber(session.match_count)} tracks, over
          Spotify's 10,000 limit. A random 10,000 were pushed — pushing again
          rotates the selection.
        </p>
      )}
      {session.error_message && (
        <p className="mt-2 text-sm">{session.error_message}</p>
      )}
    </StatusBanner>
  );
}
