import type { SpotifyProfile } from "@/api/client";
import { Button } from "@/components/ui/button";

interface SpotifyConnectionCardProps {
  profile?: SpotifyProfile;
  onDisconnect: () => void;
  isDisconnecting: boolean;
}

export function SpotifyConnectionCard({
  profile,
  onDisconnect,
  isDisconnecting,
}: SpotifyConnectionCardProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-card p-4">
      <div>
        <p className="font-medium text-green-600">Spotify Connected</p>
        {profile && (
          <p className="text-sm text-muted-foreground">{profile.display_name}</p>
        )}
      </div>
      <Button
        onClick={onDisconnect}
        variant="outline"
        size="sm"
        disabled={isDisconnecting}
      >
        {isDisconnecting ? "Disconnecting..." : "Disconnect"}
      </Button>
    </div>
  );
}
