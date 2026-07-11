import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { spotifyApi } from "@/api/client";
import { queryKeys } from "@/lib/queryKeys";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SpotifyButton } from "@/components/auth/SpotifyButton";
import { SpotifyConnectionCard } from "@/components/spotify/SpotifyConnectionCard";
import { ArtistMetadataPanel, LibrarySection } from "@/components/library";
import { useTransientMessage } from "@/hooks/useTransientMessage";

export function HomePage() {
  const { user, logout, isAuthenticated, refreshUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { message, show, showSuccess, showError } = useTransientMessage();

  const spotifyReady = isAuthenticated && !!user?.spotify_connected;

  const disconnectMutation = useMutation({
    mutationFn: () => spotifyApi.disconnect(),
    onSuccess: async () => {
      await refreshUser();
      queryClient.removeQueries({ queryKey: queryKeys.playlists });
      queryClient.removeQueries({ queryKey: queryKeys.libraryStatus });
    },
    onError: () => showError("Failed to disconnect Spotify"),
  });

  useEffect(() => {
    const state = location.state as {
      spotifyConnected?: boolean;
      spotifyError?: string;
    } | null;
    if (state?.spotifyConnected) {
      showSuccess("Spotify connected successfully!");
    } else if (state?.spotifyError) {
      showError(state.spotifyError);
    }
    if (state) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, location.pathname, navigate, showSuccess, showError]);

  return (
    <div className="mx-auto min-h-screen max-w-2xl p-8">
      <h1 className="mb-8 text-center text-4xl font-bold">Genre Orb</h1>

      {message && (
        <div
          className={cn(
            "mb-4 rounded p-4 text-center text-sm",
            message.type === "error"
              ? "bg-red-100 text-red-800"
              : "bg-muted"
          )}
        >
          {message.text}
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

          {spotifyReady ? (
            <>
              <SpotifyConnectionCard
                profile={user?.spotify_profile}
                onDisconnect={() => disconnectMutation.mutate()}
                isDisconnecting={disconnectMutation.isPending}
              />
              <LibrarySection enabled={spotifyReady} onMessage={show} />
              <ArtistMetadataPanel enabled={spotifyReady} onMessage={show} />
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
