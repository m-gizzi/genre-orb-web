import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { spotifyApi, libraryApi, playlistsApi, artistsApi } from "@/api/client";
import { Button } from "@/components/ui/button";
import { SpotifyButton } from "@/components/auth/SpotifyButton";
import {
  SyncStatusBanner,
  ArtistSyncStatusBanner,
  PlaylistList,
} from "@/components/library";

export function HomePage() {
  const { user, logout, isAuthenticated, refreshUser } = useAuth();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const { data: libraryStatus } = useQuery({
    queryKey: ["libraryStatus"],
    queryFn: libraryApi.getStatus,
    enabled: isAuthenticated && user?.spotify_connected,
    refetchInterval: (query) =>
      query.state.data?.has_active_sync ? 2000 : false,
  });

  const { data: playlists } = useQuery({
    queryKey: ["playlists"],
    queryFn: playlistsApi.list,
    enabled: isAuthenticated && user?.spotify_connected,
  });

  const { data: artistSyncStatus } = useQuery({
    queryKey: ["artistSyncStatus"],
    queryFn: artistsApi.getSyncStatus,
    enabled: isAuthenticated && user?.spotify_connected,
    refetchInterval: (query) =>
      query.state.data?.has_active_sync ? 2000 : false,
  });

  const fetchPlaylistsMutation = useMutation({
    mutationFn: libraryApi.fetchPlaylists,
    onSuccess: () => {
      setMessage("Fetching playlists from Spotify...");
      const interval = setInterval(async () => {
        const status = await libraryApi.getStatus();
        if (status.playlists_metadata_fetched_at) {
          clearInterval(interval);
          queryClient.invalidateQueries({ queryKey: ["playlists"] });
          queryClient.invalidateQueries({ queryKey: ["libraryStatus"] });
          setMessage("Playlists loaded!");
        }
      }, 1000);
      setTimeout(() => clearInterval(interval), 30000);
    },
  });

  const syncMutation = useMutation({
    mutationFn: libraryApi.sync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["libraryStatus"] });
      setMessage("Sync started!");
    },
    onError: (error: Error) => {
      setMessage(`Error: ${error.message}`);
    },
  });

  const artistSyncMutation = useMutation({
    mutationFn: () => artistsApi.sync(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artistSyncStatus"] });
      setMessage("Artist metadata sync started!");
    },
    onError: (error: Error) => {
      setMessage(`Error: ${error.message}`);
    },
  });

  const artistResyncAllMutation = useMutation({
    mutationFn: () => artistsApi.sync({ syncAll: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artistSyncStatus"] });
      setMessage("Resyncing all artist metadata...");
    },
    onError: (error: Error) => {
      setMessage(`Error: ${error.message}`);
    },
  });

  useEffect(() => {
    const state = location.state as {
      spotifyConnected?: boolean;
      spotifyError?: string;
    } | null;
    if (state?.spotifyConnected) {
      setMessage("Spotify connected successfully!");
    } else if (state?.spotifyError) {
      setMessage(`Error: ${state.spotifyError}`);
    }
    window.history.replaceState({}, document.title);
  }, [location.state]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  const handleDisconnectSpotify = async () => {
    setIsDisconnecting(true);
    try {
      await spotifyApi.disconnect();
      await refreshUser();
      queryClient.removeQueries({ queryKey: ["playlists"] });
      queryClient.removeQueries({ queryKey: ["libraryStatus"] });
    } catch {
      setMessage("Error: Failed to disconnect Spotify");
    } finally {
      setIsDisconnecting(false);
    }
  };

  const hasPlaylists = playlists && playlists.length > 0;
  const hasSyncEnabled = playlists?.some((p) => p.sync_enabled);
  const hasActiveSync = libraryStatus?.has_active_sync;
  const hasActiveArtistSync = artistSyncStatus?.has_active_sync;
  const hasArtistsToSync =
    artistSyncStatus &&
    artistSyncStatus.artists_total > artistSyncStatus.artists_synced;

  return (
    <div className="mx-auto min-h-screen max-w-2xl p-8">
      <h1 className="mb-8 text-center text-4xl font-bold">Genre Orb</h1>

      {message && (
        <div className="mb-4 rounded bg-muted p-4 text-center text-sm">
          {message}
        </div>
      )}

      {isAuthenticated ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-lg">Welcome, {user?.email}!</p>
            <Button onClick={logout} variant="outline" size="sm">
              Logout
            </Button>
          </div>

          {user?.spotify_connected ? (
            <>
              <div className="flex items-center justify-between rounded-lg border bg-card p-4">
                <div>
                  <p className="font-medium text-green-600">Spotify Connected</p>
                  {user.spotify_profile && (
                    <p className="text-sm text-muted-foreground">
                      {user.spotify_profile.display_name}
                    </p>
                  )}
                </div>
                <Button
                  onClick={handleDisconnectSpotify}
                  variant="outline"
                  size="sm"
                  disabled={isDisconnecting}
                >
                  {isDisconnecting ? "Disconnecting..." : "Disconnect"}
                </Button>
              </div>

              {libraryStatus?.current_session && (
                <SyncStatusBanner session={libraryStatus.current_session} />
              )}

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Your Playlists</h2>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => fetchPlaylistsMutation.mutate()}
                      variant="outline"
                      size="sm"
                      disabled={fetchPlaylistsMutation.isPending}
                    >
                      {fetchPlaylistsMutation.isPending
                        ? "Fetching..."
                        : hasPlaylists
                          ? "Refresh"
                          : "Fetch Playlists"}
                    </Button>
                    {hasSyncEnabled && (
                      <Button
                        onClick={() => syncMutation.mutate()}
                        size="sm"
                        disabled={hasActiveSync || syncMutation.isPending}
                      >
                        {syncMutation.isPending
                          ? "Starting..."
                          : hasActiveSync
                            ? "Syncing..."
                            : "Sync"}
                      </Button>
                    )}
                  </div>
                </div>

                {hasPlaylists ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Toggle the playlists you want to sync, then click Sync.
                    </p>
                    <PlaylistList playlists={playlists} />
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
                    <p>No playlists loaded yet.</p>
                    <p className="mt-1 text-sm">
                      Click "Fetch Playlists" to load your Spotify playlists.
                    </p>
                  </div>
                )}
              </div>

              {artistSyncStatus && artistSyncStatus.artists_total > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold">Artist Metadata</h2>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => artistSyncMutation.mutate()}
                        size="sm"
                        disabled={
                          hasActiveArtistSync ||
                          !hasArtistsToSync ||
                          artistSyncMutation.isPending ||
                          artistResyncAllMutation.isPending
                        }
                      >
                        {artistSyncMutation.isPending
                          ? "Starting..."
                          : hasActiveArtistSync
                            ? "Syncing..."
                            : "Sync Genres"}
                      </Button>
                      <Button
                        onClick={() => artistResyncAllMutation.mutate()}
                        variant="outline"
                        size="sm"
                        disabled={
                          hasActiveArtistSync ||
                          artistSyncMutation.isPending ||
                          artistResyncAllMutation.isPending
                        }
                      >
                        {artistResyncAllMutation.isPending
                          ? "Starting..."
                          : "Resync All"}
                      </Button>
                    </div>
                  </div>

                  {artistSyncStatus.current_session && (
                    <ArtistSyncStatusBanner
                      session={artistSyncStatus.current_session}
                    />
                  )}

                  <div className="rounded-lg border bg-card p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Artists with genres
                      </span>
                      <span className="font-medium">
                        {artistSyncStatus.artists_synced} /{" "}
                        {artistSyncStatus.artists_total}
                      </span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{
                          width: `${artistSyncStatus.artists_total > 0 ? (artistSyncStatus.artists_synced * 100) / artistSyncStatus.artists_total : 0}%`,
                        }}
                      />
                    </div>
                    {!hasArtistsToSync && artistSyncStatus.artists_total > 0 && (
                      <p className="mt-2 text-sm text-green-600">
                        All artists have genre metadata!
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4 text-center">
              <p className="text-muted-foreground">
                Connect your Spotify account to get started.
              </p>
              <SpotifyButton
                label="Connect Spotify"
                variant="default"
                className="bg-green-600 hover:bg-green-700"
              />
            </div>
          )}
        </div>
      ) : (
        <div className="mx-auto w-full max-w-sm space-y-6 text-center">
          <p className="text-muted-foreground">
            Manage your music library with smart playlists
          </p>
          <Button className="w-full" render={<Link to="/login" />}>
            Get Started
          </Button>
        </div>
      )}
    </div>
  );
}
