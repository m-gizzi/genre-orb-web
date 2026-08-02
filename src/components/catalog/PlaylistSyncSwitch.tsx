import { useMutation, useQueryClient } from "@tanstack/react-query";
import { playlistsApi } from "@/api/client";
import { queryKeys } from "@/lib/queryKeys";
import { Switch } from "@/components/ui/switch";

const LOCKED_HINT =
  "Smart playlists stay synced so Genre Orb can see what Spotify holds.";

interface PlaylistSyncSwitchProps {
  playlistId: number;
  name: string;
  syncEnabled: boolean;
  locked?: boolean;
}

export function PlaylistSyncSwitch({
  playlistId,
  name,
  syncEnabled,
  locked = false,
}: PlaylistSyncSwitchProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (next: boolean) =>
      playlistsApi.update(playlistId, { sync_enabled: next }),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.playlists });
      queryClient.invalidateQueries({ queryKey: queryKeys.playlist(playlistId) });
    },
  });

  const checked = mutation.isPending ? (mutation.variables ?? syncEnabled) : syncEnabled;

  const control = (
    <Switch
      checked={checked}
      disabled={locked || mutation.isPending}
      onCheckedChange={(next) => mutation.mutate(next)}
      aria-label={`Sync ${name}`}
    />
  );

  if (!locked) return control;

  return (
    <span className="inline-flex" title={LOCKED_HINT}>
      {control}
    </span>
  );
}
