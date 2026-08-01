import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import {
  playlistsApi,
  type ApiCollection,
  type Playlist,
} from "@/api/client";
import { makeQueryWrapper } from "@/test/utils";
import { usePlaylists, usePlaylistsPage, useLikedPlaylist } from "./usePlaylists";

vi.mock("@/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/client")>();
  return {
    ...actual,
    playlistsApi: { list: vi.fn(), paginated: vi.fn(), liked: vi.fn() },
  };
});

const mockedPlaylistsApi = vi.mocked(playlistsApi);

const paged: ApiCollection<Playlist> = {
  data: [],
  meta: { page: 1, per_page: 25, total: 0, total_pages: 0 },
};

describe("usePlaylists", () => {
  afterEach(() => vi.clearAllMocks());

  it("lists playlists when enabled", async () => {
    const playlists = [{ id: 1 }] as Playlist[];
    mockedPlaylistsApi.list.mockResolvedValue(playlists);
    const { wrapper } = makeQueryWrapper();

    const { result } = renderHook(() => usePlaylists(true), { wrapper });

    await waitFor(() => expect(result.current.data).toBe(playlists));
    expect(mockedPlaylistsApi.list).toHaveBeenCalled();
  });

  it("stays disabled when not enabled", () => {
    const { wrapper } = makeQueryWrapper();
    const { result } = renderHook(() => usePlaylists(false), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockedPlaylistsApi.list).not.toHaveBeenCalled();
  });
});

describe("usePlaylistsPage", () => {
  afterEach(() => vi.clearAllMocks());

  it("fetches a page with the given params", async () => {
    mockedPlaylistsApi.paginated.mockResolvedValue(paged);
    const { wrapper } = makeQueryWrapper();

    const { result } = renderHook(() => usePlaylistsPage({ page: 2 }), { wrapper });

    await waitFor(() => expect(result.current.data).toBe(paged));
    expect(mockedPlaylistsApi.paginated).toHaveBeenCalledWith({ page: 2 });
  });

  it("stays disabled when not enabled", () => {
    const { wrapper } = makeQueryWrapper();
    const { result } = renderHook(() => usePlaylistsPage({}, false), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockedPlaylistsApi.paginated).not.toHaveBeenCalled();
  });
});

describe("useLikedPlaylist", () => {
  afterEach(() => vi.clearAllMocks());

  it("fetches the liked playlist when enabled", async () => {
    const liked = { id: 3, is_liked_songs: true } as Playlist;
    mockedPlaylistsApi.liked.mockResolvedValue(liked);
    const { wrapper } = makeQueryWrapper();

    const { result } = renderHook(() => useLikedPlaylist(true), { wrapper });

    await waitFor(() => expect(result.current.data).toBe(liked));
    expect(mockedPlaylistsApi.liked).toHaveBeenCalled();
  });

  it("stays disabled when not enabled", () => {
    const { wrapper } = makeQueryWrapper();
    const { result } = renderHook(() => useLikedPlaylist(false), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockedPlaylistsApi.liked).not.toHaveBeenCalled();
  });
});
