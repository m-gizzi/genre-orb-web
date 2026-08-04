import { createBrowserRouter, RouterProvider, type RouteObject } from "react-router-dom";
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
import { SmartPlaylistEditPage } from "@/pages/SmartPlaylistEditPage";
import { TracksPage } from "@/pages/TracksPage";
import { TrackDetailPage } from "@/pages/TrackDetailPage";
import { ArtistsPage } from "@/pages/ArtistsPage";
import { ArtistDetailPage } from "@/pages/ArtistDetailPage";
import { AlbumsPage } from "@/pages/AlbumsPage";
import { AlbumDetailPage } from "@/pages/AlbumDetailPage";
import { GenresPage } from "@/pages/GenresPage";
import { GenreDetailPage } from "@/pages/GenreDetailPage";

const routes: RouteObject[] = [
  { path: "/login", element: <LoginPage /> },
  { path: "/signup", element: <SignupPage /> },
  { path: SPOTIFY_CALLBACK_PATH, element: <SpotifyCallbackPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/", element: <DashboardPage /> },
          { path: "/library", element: <LibraryPage /> },
          { path: "/playlists", element: <PlaylistsPage /> },
          { path: "/playlists/:id", element: <PlaylistDetailPage /> },
          { path: "/smart-playlists", element: <SmartPlaylistsPage /> },
          { path: "/smart-playlists/:id", element: <SmartPlaylistDetailPage /> },
          { path: "/smart-playlists/:id/edit", element: <SmartPlaylistEditPage /> },
          { path: "/tracks", element: <TracksPage /> },
          { path: "/tracks/:id", element: <TrackDetailPage /> },
          { path: "/artists", element: <ArtistsPage /> },
          { path: "/artists/:id", element: <ArtistDetailPage /> },
          { path: "/albums", element: <AlbumsPage /> },
          { path: "/albums/:id", element: <AlbumDetailPage /> },
          { path: "/genres", element: <GenresPage /> },
          { path: "/genres/:id", element: <GenreDetailPage /> },
        ],
      },
    ],
  },
];

const router = createBrowserRouter(routes);

export function Router() {
  return <RouterProvider router={router} />;
}
