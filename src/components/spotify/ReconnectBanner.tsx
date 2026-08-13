import { SpotifyButton } from "@/components/auth/SpotifyButton";

export function ReconnectBanner() {
  return (
    <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium">Spotify access has expired</p>
          <p className="text-sm">
            Syncs and pushes are paused until you reconnect your account.
          </p>
        </div>
        <SpotifyButton label="Reconnect Spotify" />
      </div>
    </div>
  );
}
