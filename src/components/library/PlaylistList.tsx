import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Playlist } from "@/api/client";
import { playlistsApi } from "@/api/client";
import { queryKeys } from "@/lib/queryKeys";
import { Switch } from "@/components/ui/switch";

interface PlaylistListProps {
  playlists: Playlist[];
}

export function PlaylistList({ playlists }: PlaylistListProps) {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: ({ id, syncEnabled }: { id: number; syncEnabled: boolean }) =>
      playlistsApi.update(id, { sync_enabled: syncEnabled }),
    onMutate: async ({ id, syncEnabled }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.playlists });
      const previous = queryClient.getQueryData<Playlist[]>(queryKeys.playlists);
      queryClient.setQueryData<Playlist[]>(queryKeys.playlists, (old) =>
        old?.map((p) => (p.id === id ? { ...p, sync_enabled: syncEnabled } : p))
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.playlists, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.playlists });
    },
  });

  const handleToggle = (playlist: Playlist) => {
    updateMutation.mutate({
      id: playlist.id,
      syncEnabled: !playlist.sync_enabled,
    });
  };

  const sortedPlaylists = [...playlists].sort((a, b) => {
    if (a.is_liked_songs) return -1;
    if (b.is_liked_songs) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <div className="space-y-2">
      {sortedPlaylists.map((playlist) => (
        <div
          key={playlist.id}
          className="flex items-center justify-between rounded-lg border bg-card p-3"
        >
          <div className="flex-1 truncate">
            <div className="flex items-center gap-2">
              <span className="font-medium">{playlist.name}</span>
              {playlist.is_liked_songs && (
                <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700">
                  Liked
                </span>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {playlist.track_count} tracks
              {playlist.last_synced_at && (
                <>
                  {" "}
                  &middot; Last synced{" "}
                  {new Date(playlist.last_synced_at).toLocaleDateString()}
                </>
              )}
            </div>
          </div>
          <Switch
            checked={playlist.sync_enabled}
            onCheckedChange={() => handleToggle(playlist)}
            disabled={updateMutation.isPending}
            aria-label={`Sync ${playlist.name}`}
          />
        </div>
      ))}
    </div>
  );
}
