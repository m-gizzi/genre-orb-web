import { useMutation, useQueryClient } from "@tanstack/react-query";
import { playlistsApi } from "@/api/client";
import { queryKeys } from "@/lib/queryKeys";
import { Switch } from "@/components/ui/switch";

interface PlaylistSyncSwitchProps {
  playlistId: number;
  name: string;
  syncEnabled: boolean;
}

export function PlaylistSyncSwitch({
  playlistId,
  name,
  syncEnabled,
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

  return (
    <Switch
      checked={checked}
      disabled={mutation.isPending}
      onCheckedChange={(next) => mutation.mutate(next)}
      aria-label={`Sync ${name}`}
    />
  );
}
