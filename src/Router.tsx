import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SPOTIFY_CALLBACK_PATH } from "@/lib/config";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import { LoginPage } from "@/pages/LoginPage";
import { SignupPage } from "@/pages/SignupPage";
import { SpotifyCallbackPage } from "@/pages/SpotifyCallbackPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { LibraryPage } from "@/pages/LibraryPage";
import { PlaylistsPage } from "@/pages/PlaylistsPage";
import { PlaylistDetailPage } from "@/pages/PlaylistDetailPage";
import { SmartPlaylistsPage } from "@/pages/SmartPlaylistsPage";
import { SmartPlaylistDetailPage } from "@/pages/SmartPlaylistDetailPage";
import { TracksPage } from "@/pages/TracksPage";
import { TrackDetailPage } from "@/pages/TrackDetailPage";
import { ArtistsPage } from "@/pages/ArtistsPage";
import { ArtistDetailPage } from "@/pages/ArtistDetailPage";
import { AlbumsPage } from "@/pages/AlbumsPage";
import { AlbumDetailPage } from "@/pages/AlbumDetailPage";
import { GenresPage } from "@/pages/GenresPage";
import { GenreDetailPage } from "@/pages/GenreDetailPage";

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path={SPOTIFY_CALLBACK_PATH} element={<SpotifyCallbackPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/playlists" element={<PlaylistsPage />} />
            <Route path="/playlists/:id" element={<PlaylistDetailPage />} />
            <Route path="/smart-playlists" element={<SmartPlaylistsPage />} />
            <Route
              path="/smart-playlists/:id"
              element={<SmartPlaylistDetailPage />}
            />
            <Route path="/tracks" element={<TracksPage />} />
            <Route path="/tracks/:id" element={<TrackDetailPage />} />
            <Route path="/artists" element={<ArtistsPage />} />
            <Route path="/artists/:id" element={<ArtistDetailPage />} />
            <Route path="/albums" element={<AlbumsPage />} />
            <Route path="/albums/:id" element={<AlbumDetailPage />} />
            <Route path="/genres" element={<GenresPage />} />
            <Route path="/genres/:id" element={<GenreDetailPage />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
