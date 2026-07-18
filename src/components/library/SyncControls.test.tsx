import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import type { Playlist } from "@/api/client";
import { useSyncStatus } from "@/contexts/SyncStatusContext";
import { useLikedPlaylist, usePlaylists } from "@/hooks/usePlaylists";
import { SyncControls } from "./SyncControls";

vi.mock("@/contexts/SyncStatusContext", () => ({ useSyncStatus: vi.fn() }));
vi.mock("@/hooks/usePlaylists", () => ({
  usePlaylists: vi.fn(),
  useLikedPlaylist: vi.fn(),
}));

const mockedUseSyncStatus = vi.mocked(useSyncStatus);
const mockedUsePlaylists = vi.mocked(usePlaylists);
const mockedUseLikedPlaylist = vi.mocked(useLikedPlaylist);

type SyncStatus = ReturnType<typeof useSyncStatus>;

function status(overrides: Partial<SyncStatus> = {}): SyncStatus {
  return {
    visibleLibrarySession: null,
    hasActiveLibrarySync: false,
    librarySyncError: false,
    startLibrarySync: vi.fn(),
    isStartingLibrarySync: false,
    fetchPlaylists: vi.fn(),
    isFetchingPlaylists: false,
    dismissLibrarySession: vi.fn(),
    visibleArtistSession: null,
    hasActiveArtistSync: false,
    artistSyncError: false,
    artistsTotal: 10,
    artistsSynced: 4,
    hasArtistsToSync: true,
    startArtistSync: vi.fn(),
    isStartingArtistSync: false,
    resyncAllArtists: vi.fn(),
    isResyncingArtists: false,
    refetchArtistStatus: vi.fn(),
    dismissArtistSession: vi.fn(),
    message: null,
    show: vi.fn(),
    ...overrides,
  };
}

function setPlaylists(playlists: Playlist[] | undefined) {
  mockedUsePlaylists.mockReturnValue({
    data: playlists,
  } as ReturnType<typeof usePlaylists>);
  mockedUseLikedPlaylist.mockReturnValue({
    data: undefined,
  } as ReturnType<typeof useLikedPlaylist>);
}

function playlist(overrides: Partial<Playlist> = {}): Playlist {
  return { sync_enabled: false, ...overrides } as Playlist;
}

describe("SyncControls", () => {
  afterEach(() => vi.clearAllMocks());

  it("hides the artist section when the user has no artists yet", () => {
    mockedUseSyncStatus.mockReturnValue(status({ artistsTotal: 0, artistsSynced: 0 }));
    setPlaylists([]);

    render(<SyncControls enabled />);

    expect(screen.queryByText("Artist Metadata")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Sync Genres" })
    ).not.toBeInTheDocument();
  });

  it("shows the artist progress and enables Sync Genres when work remains", () => {
    mockedUseSyncStatus.mockReturnValue(status());
    setPlaylists([]);

    render(<SyncControls enabled />);

    expect(screen.getByText("4 / 10")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sync Genres" })).toBeEnabled();
    expect(
      screen.queryByText("All artists have genre metadata!")
    ).not.toBeInTheDocument();
  });

  it("disables Sync Genres and confirms completion once every artist is synced", () => {
    mockedUseSyncStatus.mockReturnValue(
      status({ artistsSynced: 10, hasArtistsToSync: false })
    );
    setPlaylists([]);

    render(<SyncControls enabled />);

    expect(
      screen.getByText("All artists have genre metadata!")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sync Genres" })).toBeDisabled();
  });

  it("shows the library Sync button only when a playlist is sync-enabled", () => {
    mockedUseSyncStatus.mockReturnValue(status());

    setPlaylists([playlist({ sync_enabled: false })]);
    const { rerender } = render(<SyncControls enabled />);
    expect(screen.queryByRole("button", { name: "Sync" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();

    setPlaylists([playlist({ sync_enabled: true })]);
    rerender(<SyncControls enabled />);
    expect(screen.getByRole("button", { name: "Sync" })).toBeInTheDocument();
  });

  it("labels the fetch button 'Fetch Playlists' when none are loaded", () => {
    mockedUseSyncStatus.mockReturnValue(status());
    setPlaylists(undefined);

    render(<SyncControls enabled />);

    expect(
      screen.getByRole("button", { name: "Fetch Playlists" })
    ).toBeInTheDocument();
  });

  it("surfaces an artist status error with a retry", () => {
    const refetchArtistStatus = vi.fn();
    mockedUseSyncStatus.mockReturnValue(status({ artistSyncError: true, refetchArtistStatus }));
    setPlaylists([]);

    render(<SyncControls enabled />);

    expect(
      screen.getByText("Couldn't load artist metadata status.")
    ).toBeInTheDocument();
    screen.getByRole("button", { name: "Try again" }).click();
    expect(refetchArtistStatus).toHaveBeenCalled();
  });
});
