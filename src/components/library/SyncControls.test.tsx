import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ApiCollection, Playlist } from "@/api/client";
import { useSyncStatus } from "@/contexts/SyncStatusContext";
import { useLikedPlaylist, usePlaylistsPage } from "@/hooks/usePlaylists";
import { SyncControls } from "./SyncControls";

vi.mock("@/contexts/SyncStatusContext", () => ({ useSyncStatus: vi.fn() }));
vi.mock("@/hooks/usePlaylists", () => ({
  usePlaylistsPage: vi.fn(),
  useLikedPlaylist: vi.fn(),
}));

const mockedUseSyncStatus = vi.mocked(useSyncStatus);
const mockedUsePlaylistsPage = vi.mocked(usePlaylistsPage);
const mockedUseLikedPlaylist = vi.mocked(useLikedPlaylist);

type SyncStatus = ReturnType<typeof useSyncStatus>;

function status(overrides: {
  library?: Partial<SyncStatus["library"]>;
  artist?: Partial<SyncStatus["artist"]>;
} = {}): SyncStatus {
  return {
    library: {
      visibleSession: null,
      hasActiveSync: false,
      isError: false,
      start: vi.fn(),
      isStarting: false,
      fetchPlaylists: vi.fn(),
      isFetchingPlaylists: false,
      dismissSession: vi.fn(),
      ...overrides.library,
    },
    artist: {
      visibleSession: null,
      hasActiveSync: false,
      isError: false,
      artistsTotal: 10,
      artistsSynced: 4,
      hasArtistsToSync: true,
      start: vi.fn(),
      isStarting: false,
      resyncAll: vi.fn(),
      isResyncing: false,
      refetchStatus: vi.fn(),
      dismissSession: vi.fn(),
      ...overrides.artist,
    },
    message: null,
    show: vi.fn(),
  };
}

function collection(total: number): ApiCollection<Playlist> {
  return { data: [], meta: { page: 1, per_page: 1, total, total_pages: total } };
}

function setCounts({ total, syncEnabled }: { total?: number; syncEnabled?: number }) {
  mockedUsePlaylistsPage.mockImplementation((params) => {
    const value = params?.sync_enabled ? syncEnabled : total;
    return {
      data: value == null ? undefined : collection(value),
    } as ReturnType<typeof usePlaylistsPage>;
  });
  mockedUseLikedPlaylist.mockReturnValue({
    data: undefined,
  } as ReturnType<typeof useLikedPlaylist>);
}

describe("SyncControls", () => {
  afterEach(() => vi.clearAllMocks());

  it("hides the artist section when the user has no artists yet", () => {
    mockedUseSyncStatus.mockReturnValue(status({ artist: { artistsTotal: 0, artistsSynced: 0 } }));
    setCounts({ total: 0, syncEnabled: 0 });

    render(<SyncControls enabled />);

    expect(screen.queryByText("Artist Metadata")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Sync Genres" })
    ).not.toBeInTheDocument();
  });

  it("shows the artist progress and enables Sync Genres when work remains", () => {
    mockedUseSyncStatus.mockReturnValue(status());
    setCounts({ total: 0, syncEnabled: 0 });

    render(<SyncControls enabled />);

    expect(screen.getByText("4 / 10")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sync Genres" })).toBeEnabled();
    expect(
      screen.queryByText("All artists have genre metadata!")
    ).not.toBeInTheDocument();
  });

  it("disables Sync Genres and confirms completion once every artist is synced", () => {
    mockedUseSyncStatus.mockReturnValue(
      status({ artist: { artistsSynced: 10, hasArtistsToSync: false } })
    );
    setCounts({ total: 0, syncEnabled: 0 });

    render(<SyncControls enabled />);

    expect(
      screen.getByText("All artists have genre metadata!")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sync Genres" })).toBeDisabled();
  });

  it("shows the library Sync button only when a playlist is sync-enabled", () => {
    mockedUseSyncStatus.mockReturnValue(status());

    setCounts({ total: 1, syncEnabled: 0 });
    const { rerender } = render(<SyncControls enabled />);
    expect(screen.queryByRole("button", { name: "Sync" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();

    setCounts({ total: 1, syncEnabled: 1 });
    rerender(<SyncControls enabled />);
    expect(screen.getByRole("button", { name: "Sync" })).toBeInTheDocument();
  });

  it("shows the Sync button when the only sync-enabled playlist is past page one", () => {
    mockedUseSyncStatus.mockReturnValue(status());
    setCounts({ total: 500, syncEnabled: 1 });

    render(<SyncControls enabled />);

    expect(screen.getByRole("button", { name: "Sync" })).toBeInTheDocument();
  });

  it("labels the fetch button 'Fetch Playlists' when none are loaded", () => {
    mockedUseSyncStatus.mockReturnValue(status());
    setCounts({});

    render(<SyncControls enabled />);

    expect(
      screen.getByRole("button", { name: "Fetch Playlists" })
    ).toBeInTheDocument();
  });

  it("surfaces an artist status error with a retry", () => {
    const refetchArtistStatus = vi.fn();
    mockedUseSyncStatus.mockReturnValue(status({ artist: { isError: true, refetchStatus: refetchArtistStatus } }));
    setCounts({ total: 0, syncEnabled: 0 });

    render(<SyncControls enabled />);

    expect(
      screen.getByText("Couldn't load artist metadata status.")
    ).toBeInTheDocument();
    screen.getByRole("button", { name: "Try again" }).click();
    expect(refetchArtistStatus).toHaveBeenCalled();
  });
});
