import { describe, it, expect, vi, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ApiCollection, Playlist } from "@/api/client";
import { playlistsApi } from "@/api/client";
import { renderWithProviders } from "@/test/utils";
import { PlaylistsPage } from "./PlaylistsPage";

vi.mock("@/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/client")>();
  return {
    ...actual,
    playlistsApi: { paginated: vi.fn(), liked: vi.fn(), create: vi.fn() },
    smartPlaylistsApi: { create: vi.fn() },
  };
});

const mockedApi = vi.mocked(playlistsApi);

function playlist(overrides: Partial<Playlist> = {}): Playlist {
  return {
    id: 1,
    name: "Metal Mix",
    track_count: 10,
    is_liked_songs: false,
    sync_enabled: false,
    last_synced_at: null,
    is_smart: false,
    smart_playlist_id: null,
    ...overrides,
  } as Playlist;
}

function renderPage(rows: Playlist[]) {
  mockedApi.paginated.mockResolvedValue({
    data: rows,
    meta: { page: 1, per_page: 24, total: rows.length, total_pages: 1 },
  } as ApiCollection<Playlist>);
  mockedApi.liked.mockResolvedValue(null as unknown as Playlist);

  return renderWithProviders(<PlaylistsPage />, {
    route: "/playlists",
    withQuery: true,
  });
}

afterEach(() => vi.clearAllMocks());

describe("PlaylistsPage", () => {
  it("opens the create dialog from the New button", async () => {
    renderPage([playlist()]);
    await screen.findByText("Metal Mix");

    await userEvent.click(screen.getByRole("button", { name: /New/ }));

    expect(await screen.findByText("New playlist")).toBeInTheDocument();
    expect(
      screen.getByText("Genre Orb creates this on Spotify straight away."),
    ).toBeInTheDocument();
  });

  it("offers Make smart for a regular playlist and names it in the dialog", async () => {
    renderPage([playlist()]);

    await userEvent.click(await screen.findByRole("button", { name: /Make smart/ }));

    expect(
      await screen.findByText(/Make “Metal Mix” a smart playlist/),
    ).toBeInTheDocument();
  });

  it("hides Make smart for a playlist that is already rule-managed", async () => {
    renderPage([playlist({ is_smart: true, smart_playlist_id: 5 })]);
    await screen.findByText("Metal Mix");

    expect(
      screen.queryByRole("button", { name: /Make smart/ }),
    ).not.toBeInTheDocument();
  });

  it("links a rule-managed playlist to its smart playlist and locks its sync switch", async () => {
    renderPage([playlist({ is_smart: true, smart_playlist_id: 5, sync_enabled: true })]);

    expect(await screen.findByRole("link", { name: /Smart/ })).toHaveAttribute(
      "href",
      "/smart-playlists/5",
    );
    expect(screen.getByRole("switch", { name: "Sync Metal Mix" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });
});
