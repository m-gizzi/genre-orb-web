import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { playlistsApi, type ApiCollection, type Playlist } from "@/api/client";
import { makeQueryWrapper } from "@/test/utils";
import {
  useInfinitePlaylists,
  usePlaylistsPage,
  useLikedPlaylist,
} from "./usePlaylists";

vi.mock("@/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/client")>();
  return {
    ...actual,
    playlistsApi: { paginated: vi.fn(), liked: vi.fn() },
  };
});

const mockedPlaylistsApi = vi.mocked(playlistsApi);

function page(
  playlists: Partial<Playlist>[],
  meta: Partial<ApiCollection<Playlist>["meta"]> = {},
): ApiCollection<Playlist> {
  return {
    data: playlists as Playlist[],
    meta: { page: 1, per_page: 30, total: playlists.length, total_pages: 1, ...meta },
  };
}

afterEach(() => vi.clearAllMocks());

describe("usePlaylistsPage", () => {
  it("fetches a page with the given params", async () => {
    const paged = page([]);
    mockedPlaylistsApi.paginated.mockResolvedValue(paged);
    const { wrapper } = makeQueryWrapper();

    const { result } = renderHook(() => usePlaylistsPage({ page: 2 }), { wrapper });

    await waitFor(() => expect(result.current.data).toBe(paged));
    expect(mockedPlaylistsApi.paginated).toHaveBeenCalledWith({ page: 2 });
  });

  it("passes sync_enabled through as a filter", async () => {
    mockedPlaylistsApi.paginated.mockResolvedValue(page([]));
    const { wrapper } = makeQueryWrapper();

    renderHook(() => usePlaylistsPage({ per_page: 1, sync_enabled: true }), { wrapper });

    await waitFor(() =>
      expect(mockedPlaylistsApi.paginated).toHaveBeenCalledWith({
        per_page: 1,
        sync_enabled: true,
      }),
    );
  });

  it("stays disabled when not enabled", () => {
    const { wrapper } = makeQueryWrapper();
    const { result } = renderHook(() => usePlaylistsPage({}, false), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockedPlaylistsApi.paginated).not.toHaveBeenCalled();
  });
});

describe("useInfinitePlaylists", () => {
  it("requests the first page with the search term", async () => {
    mockedPlaylistsApi.paginated.mockResolvedValue(page([{ id: 1 }]));
    const { wrapper } = makeQueryWrapper();

    const { result } = renderHook(() => useInfinitePlaylists("metal"), { wrapper });

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(mockedPlaylistsApi.paginated).toHaveBeenCalledWith({
      search: "metal",
      page: 1,
      per_page: 30,
    });
  });

  it("omits an empty search term", async () => {
    mockedPlaylistsApi.paginated.mockResolvedValue(page([]));
    const { wrapper } = makeQueryWrapper();

    renderHook(() => useInfinitePlaylists(""), { wrapper });

    await waitFor(() =>
      expect(mockedPlaylistsApi.paginated).toHaveBeenCalledWith({
        search: undefined,
        page: 1,
        per_page: 30,
      }),
    );
  });

  it("offers a next page while more remain and fetches it", async () => {
    mockedPlaylistsApi.paginated
      .mockResolvedValueOnce(page([{ id: 1 }], { page: 1, total: 60, total_pages: 2 }))
      .mockResolvedValueOnce(page([{ id: 2 }], { page: 2, total: 60, total_pages: 2 }));
    const { wrapper } = makeQueryWrapper();

    const { result } = renderHook(() => useInfinitePlaylists(""), { wrapper });

    await waitFor(() => expect(result.current.hasNextPage).toBe(true));
    result.current.fetchNextPage();

    await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));
    expect(mockedPlaylistsApi.paginated).toHaveBeenLastCalledWith({
      search: undefined,
      page: 2,
      per_page: 30,
    });
    expect(result.current.hasNextPage).toBe(false);
  });

  it("reports no next page on the last page", async () => {
    mockedPlaylistsApi.paginated.mockResolvedValue(
      page([{ id: 1 }], { page: 1, total: 1, total_pages: 1 }),
    );
    const { wrapper } = makeQueryWrapper();

    const { result } = renderHook(() => useInfinitePlaylists(""), { wrapper });

    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.hasNextPage).toBe(false);
  });
});

describe("useLikedPlaylist", () => {
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
