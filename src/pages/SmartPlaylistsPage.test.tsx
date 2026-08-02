import { describe, it, expect, vi, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ApiCollection, SmartPlaylist } from "@/api/client";
import { smartPlaylistsApi } from "@/api/client";
import { renderWithProviders } from "@/test/utils";
import { SmartPlaylistsPage } from "./SmartPlaylistsPage";

vi.mock("@/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/client")>();
  return {
    ...actual,
    smartPlaylistsApi: { paginated: vi.fn(), create: vi.fn() },
    playlistsApi: { paginated: vi.fn(), liked: vi.fn() },
  };
});

const mockedApi = vi.mocked(smartPlaylistsApi);

function smartPlaylist(overrides: Partial<SmartPlaylist> = {}): SmartPlaylist {
  return {
    id: 1,
    name: "Metal Mix",
    is_enabled: false,
    is_ready: false,
    rules: { match: "all", rules: [] },
    match_count: 0,
    source_count: 2,
    last_evaluated_at: null,
    last_pushed_at: null,
    ...overrides,
  } as SmartPlaylist;
}

function collection(rows: SmartPlaylist[]): ApiCollection<SmartPlaylist> {
  return {
    data: rows,
    meta: { page: 1, per_page: 24, total: rows.length, total_pages: 1 },
  };
}

function renderPage(rows: SmartPlaylist[], route = "/smart-playlists") {
  mockedApi.paginated.mockResolvedValue(collection(rows));
  return renderWithProviders(<SmartPlaylistsPage />, { route, withQuery: true });
}

afterEach(() => vi.clearAllMocks());

describe("SmartPlaylistsPage", () => {
  it("invites the user to create one when they have none", async () => {
    renderPage([]);

    expect(await screen.findByText("No smart playlists yet")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "New smart playlist" }),
    ).toBeInTheDocument();
  });

  it("distinguishes an empty search result from an empty library", async () => {
    renderPage([], "/smart-playlists?search=zzz");

    expect(
      await screen.findByText("No smart playlists match your search"),
    ).toBeInTheDocument();
    expect(screen.queryByText("No smart playlists yet")).not.toBeInTheDocument();
  });

  it("marks a draft as not ready", async () => {
    renderPage([smartPlaylist()]);

    expect(await screen.findByText("Not ready")).toBeInTheDocument();
  });

  it("marks a rule-filled but paused smart playlist as paused", async () => {
    renderPage([smartPlaylist({ is_ready: true, is_enabled: false })]);

    expect(await screen.findByText("Paused")).toBeInTheDocument();
  });

  it("marks a running smart playlist as enabled", async () => {
    renderPage([smartPlaylist({ is_ready: true, is_enabled: true })]);

    expect(await screen.findByText("Enabled")).toBeInTheDocument();
  });

  it("summarises the sources and rule count", async () => {
    renderPage([smartPlaylist({ source_count: 1 })]);

    expect(await screen.findByText(/1 source · no rules yet/)).toBeInTheDocument();
  });

  it("opens the create dialog from the New button", async () => {
    renderPage([smartPlaylist()]);
    await screen.findByText("Metal Mix");

    await userEvent.click(screen.getByRole("button", { name: /New/ }));

    expect(await screen.findByText("New smart playlist")).toBeInTheDocument();
  });
});
