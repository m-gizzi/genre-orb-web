import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import {
  playlistsApi,
  type ApiCollection,
  type PlaylistDetail,
  type Track,
} from "@/api/client";
import { makeQueryWrapper } from "@/test/utils";
import { usePlaylist, usePlaylistTracks } from "./usePlaylistDetail";

vi.mock("@/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/client")>();
  return {
    ...actual,
    playlistsApi: { get: vi.fn(), tracks: vi.fn() },
  };
});

const mockedPlaylistsApi = vi.mocked(playlistsApi);

const trackCollection: ApiCollection<Track> = {
  data: [],
  meta: { page: 1, per_page: 25, total: 0, total_pages: 0 },
};

describe("usePlaylist", () => {
  afterEach(() => vi.clearAllMocks());

  it("fetches a playlist by id", async () => {
    const playlist = { id: 2 } as PlaylistDetail;
    mockedPlaylistsApi.get.mockResolvedValue(playlist);
    const { wrapper } = makeQueryWrapper();

    const { result } = renderHook(() => usePlaylist(2), { wrapper });

    await waitFor(() => expect(result.current.data).toBe(playlist));
    expect(mockedPlaylistsApi.get).toHaveBeenCalledWith(2);
  });

  it("stays disabled for a non-finite id", () => {
    const { wrapper } = makeQueryWrapper();
    const { result } = renderHook(() => usePlaylist(NaN), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockedPlaylistsApi.get).not.toHaveBeenCalled();
  });
});

describe("usePlaylistTracks", () => {
  afterEach(() => vi.clearAllMocks());

  it("fetches tracks for a playlist with pagination", async () => {
    mockedPlaylistsApi.tracks.mockResolvedValue(trackCollection);
    const { wrapper } = makeQueryWrapper();

    const { result } = renderHook(() => usePlaylistTracks(2, { page: 3 }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.data).toBe(trackCollection));
    expect(mockedPlaylistsApi.tracks).toHaveBeenCalledWith(2, { page: 3 });
  });

  it("stays disabled for a non-finite id", () => {
    const { wrapper } = makeQueryWrapper();
    const { result } = renderHook(() => usePlaylistTracks(NaN), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockedPlaylistsApi.tracks).not.toHaveBeenCalled();
  });
});
