import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ListMusicIcon,
  Music2Icon,
  UsersIcon,
  Disc3Icon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePlaylistsPage } from "@/hooks/usePlaylists";
import { useTracks } from "@/hooks/useTracks";
import { useArtists } from "@/hooks/useArtists";
import { useAlbums } from "@/hooks/useAlbums";
import { useTransientMessage } from "@/hooks/useTransientMessage";
import { Orb } from "@/components/orb/Orb";
import { Button } from "@/components/ui/button";
import { SpotifyButton } from "@/components/auth/SpotifyButton";
import { StatTile } from "@/components/catalog";
import { MessageBanner } from "@/components/layout/MessageBanner";
import helloOrb from "@/assets/hello_orb.png";

export function DashboardPage() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { message, showSuccess, showError } = useTransientMessage();

  const spotifyConnected = !!user?.spotify_connected;

  useEffect(() => {
    const state = location.state as {
      spotifyConnected?: boolean;
      spotifyError?: string;
    } | null;
    if (state?.spotifyConnected) showSuccess("Spotify connected successfully!");
    else if (state?.spotifyError) showError(state.spotifyError);
    if (state) navigate(location.pathname, { replace: true, state: null });
  }, [location.state, location.pathname, navigate, showSuccess, showError]);

  const playlists = usePlaylistsPage(
    spotifyConnected ? { per_page: 1 } : {},
    spotifyConnected
  );
  const tracks = useTracks(spotifyConnected ? { per_page: 1 } : {});
  const artists = useArtists(spotifyConnected ? { per_page: 1 } : {});
  const albums = useAlbums(spotifyConnected ? { per_page: 1 } : {});

  return (
    <div>
      <MessageBanner message={message} />

      <div className="mb-8 flex flex-col items-center gap-3 py-6 text-center">
        <Orb size={170} label="Genre Orb" />
        <img src={helloOrb} alt="Hello, my name is Genre Orb" className="w-52" />
        <p className="max-w-md text-muted-foreground">
          {spotifyConnected
            ? "Browse and reorganize your music library."
            : "Connect Spotify to start building smart playlists from your library."}
        </p>
      </div>

      {spotifyConnected ? (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatTile
              label="Playlists"
              value={playlists.data?.meta.total}
              icon={<ListMusicIcon className="size-4" />}
              to="/playlists"
              isLoading={playlists.isLoading}
            />
            <StatTile
              label="Tracks"
              value={tracks.data?.meta.total}
              icon={<Music2Icon className="size-4" />}
              to="/tracks"
              isLoading={tracks.isLoading}
            />
            <StatTile
              label="Artists"
              value={artists.data?.meta.total}
              icon={<UsersIcon className="size-4" />}
              to="/artists"
              isLoading={artists.isLoading}
            />
            <StatTile
              label="Albums"
              value={albums.data?.meta.total}
              icon={<Disc3Icon className="size-4" />}
              to="/albums"
              isLoading={albums.isLoading}
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Button variant="outline" render={<Link to="/library" />}>
              Manage library
            </Button>
          </div>
        </>
      ) : (
        <div className="flex justify-center">
          <SpotifyButton label="Connect Spotify" />
        </div>
      )}
    </div>
  );
}
