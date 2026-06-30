import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { spotifyApi } from "@/api/client";
import { Button } from "@/components/ui/button";
import { SpotifyButton } from "@/components/auth/SpotifyButton";

export function HomePage() {
  const { user, logout, isAuthenticated, refreshUser } = useAuth();
  const location = useLocation();
  const [message, setMessage] = useState<string | null>(null);

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

  const handleDisconnectSpotify = async () => {
    try {
      await spotifyApi.disconnect();
      await refreshUser();
    } catch (error) {
      console.error("Failed to disconnect Spotify:", error);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="mb-8 text-4xl font-bold">Genre Orb</h1>

      {message && (
        <div className="mb-4 rounded bg-muted p-4 text-sm">{message}</div>
      )}

      {isAuthenticated ? (
        <div className="space-y-4 text-center">
          <p className="text-lg">Welcome, {user?.email}!</p>

          {user?.spotify_connected ? (
            <div className="rounded-lg border p-4">
              <p className="mb-2 font-medium text-green-600">
                Spotify Connected
              </p>
              {user.spotify_profile && (
                <p className="text-sm text-muted-foreground">
                  {user.spotify_profile.display_name}
                </p>
              )}
              <Button
                onClick={handleDisconnectSpotify}
                variant="outline"
                size="sm"
                className="mt-2"
              >
                Disconnect Spotify
              </Button>
            </div>
          ) : (
            <SpotifyButton
              label="Connect Spotify"
              variant="default"
              className="bg-green-600 hover:bg-green-700"
            />
          )}

          <div>
            <Button onClick={logout} variant="outline">
              Logout
            </Button>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-sm space-y-6 text-center">
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
