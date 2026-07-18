import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useSyncStatus } from "@/contexts/SyncStatusContext";
import { spotifyApi } from "@/api/client";
import { queryKeys } from "@/lib/queryKeys";
import { PageHeader } from "@/components/layout/PageHeader";
import { MessageBanner } from "@/components/layout/MessageBanner";
import { SpotifyButton } from "@/components/auth/SpotifyButton";
import { SpotifyConnectionCard } from "@/components/spotify/SpotifyConnectionCard";
import { SyncActivity, SyncControls } from "@/components/library";
import { EmptyState } from "@/components/catalog";

export function LibraryPage() {
  const { user, refreshUser } = useAuth();
  const queryClient = useQueryClient();
  const {
    message,
    show,
    visibleLibrarySession,
    visibleArtistSession,
    dismissLibrarySession,
    dismissArtistSession,
  } = useSyncStatus();

  const spotifyReady = !!user?.spotify_connected;

  const disconnectMutation = useMutation({
    mutationFn: () => spotifyApi.disconnect(),
    onSuccess: async () => {
      await refreshUser();
      queryClient.removeQueries({ queryKey: queryKeys.playlists });
      queryClient.removeQueries({ queryKey: queryKeys.libraryStatus });
      queryClient.removeQueries({ queryKey: queryKeys.artistSyncStatus });
    },
    onError: () => show({ type: "error", text: "Failed to disconnect Spotify" }),
  });

  return (
    <div>
      <PageHeader
        title="Library"
        description="Manage your Spotify connection, run syncs, and enrich genres."
      />

      <MessageBanner message={message} />

      {spotifyReady ? (
        <div className="space-y-6">
          <SpotifyConnectionCard
            profile={user?.spotify_profile}
            onDisconnect={() => disconnectMutation.mutate()}
            isDisconnecting={disconnectMutation.isPending}
          />
          <SyncControls enabled={spotifyReady} />
          <SyncActivity
            variant="inline"
            librarySession={visibleLibrarySession}
            artistSession={visibleArtistSession}
            onDismissLibrary={dismissLibrarySession}
            onDismissArtist={dismissArtistSession}
          />
        </div>
      ) : (
        <EmptyState
          title="Connect Spotify to get started"
          description="Genre Orb reads your existing playlists and Liked Songs so you can reorganize them into smart playlists."
          action={<SpotifyButton label="Connect Spotify" />}
        />
      )}
    </div>
  );
}
