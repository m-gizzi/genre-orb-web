import { describe, it, expect, vi, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import type { ApiCollection, PlaylistDetail, Track } from "@/api/client";
import { playlistsApi } from "@/api/client";
import { renderWithProviders } from "@/test/utils";
import { PlaylistDetailPage } from "./PlaylistDetailPage";

vi.mock("@/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/client")>();
  return {
    ...actual,
    playlistsApi: { get: vi.fn(), tracks: vi.fn(), update: vi.fn() },
  };
});

const mockedPlaylistsApi = vi.mocked(playlistsApi);

const noTracks: ApiCollection<Track> = {
  data: [],
  meta: { page: 1, per_page: 50, total: 0, total_pages: 0 },
};

function detail(overrides: Partial<PlaylistDetail> = {}): PlaylistDetail {
  return {
    id: 1,
    name: "Metal Mix",
    description: null,
    spotify_id: "spotify_1",
    is_liked_songs: false,
    track_count: 0,
    sync_enabled: true,
    last_synced_at: null,
    available_on_spotify: true,
    is_smart: false,
    smart_playlist_id: null,
    current_version: null,
    ...overrides,
  };
}

function renderPlaylist(playlist: PlaylistDetail) {
  mockedPlaylistsApi.get.mockResolvedValue(playlist);
  mockedPlaylistsApi.tracks.mockResolvedValue(noTracks);

  return renderWithProviders(
    <Routes>
      <Route path="/playlists/:id" element={<PlaylistDetailPage />} />
    </Routes>,
    { route: `/playlists/${playlist.id}`, withQuery: true },
  );
}

afterEach(() => vi.clearAllMocks());

describe("PlaylistDetailPage", () => {
  it("reports not found for a non-numeric id instead of loading forever", () => {
    renderWithProviders(
      <Routes>
        <Route path="/playlists/:id" element={<PlaylistDetailPage />} />
      </Routes>,
      { route: "/playlists/not-an-id", withQuery: true },
    );

    expect(screen.getByText("Playlist not found")).toBeInTheDocument();
    expect(mockedPlaylistsApi.get).not.toHaveBeenCalled();
  });

  it("offers Edit and Make smart for a regular playlist", async () => {
    renderPlaylist(detail());

    expect(await screen.findByRole("button", { name: /Edit/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Make smart/ })).toBeInTheDocument();
  });

  it("offers neither Edit nor Make smart for Liked Songs", async () => {
    renderPlaylist(
      detail({ id: 2, name: "Liked Songs", is_liked_songs: true, spotify_id: null }),
    );

    await screen.findByText("Liked");
    expect(screen.queryByRole("button", { name: /Edit/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Make smart/ })).not.toBeInTheDocument();
  });

  it("hides Make smart once the playlist is already rule-managed", async () => {
    renderPlaylist(detail({ is_smart: true, smart_playlist_id: 5 }));

    expect(await screen.findByRole("button", { name: /Edit/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Make smart/ })).not.toBeInTheDocument();
  });

  it("renders the description when the playlist has one", async () => {
    renderPlaylist(detail({ description: "Heavy stuff" }));

    expect(await screen.findByText("Heavy stuff")).toBeInTheDocument();
  });

  it("locks the sync switch for a rule-managed playlist", async () => {
    renderPlaylist(detail({ is_smart: true, smart_playlist_id: 5 }));

    const control = await screen.findByRole("switch", { name: "Sync Metal Mix" });
    await waitFor(() => expect(control).toHaveAttribute("aria-disabled", "true"));
  });

  it("names the sync switch correctly", async () => {
    renderPlaylist(detail());

    expect(await screen.findByRole("switch", { name: "Sync Metal Mix" })).toBeEnabled();
  });
});
