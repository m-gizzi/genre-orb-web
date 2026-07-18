import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import {
  albumsApi,
  type ApiCollection,
  type Album,
  type AlbumDetail,
} from "@/api/client";
import { makeQueryWrapper } from "@/test/utils";
import { useAlbums, useAlbum } from "./useAlbums";

vi.mock("@/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/client")>();
  return {
    ...actual,
    albumsApi: { list: vi.fn(), get: vi.fn() },
  };
});

const mockedAlbumsApi = vi.mocked(albumsApi);

const collection: ApiCollection<Album> = {
  data: [],
  meta: { page: 1, per_page: 24, total: 0, total_pages: 0 },
};

describe("useAlbums", () => {
  afterEach(() => vi.clearAllMocks());

  it("lists albums with the given params", async () => {
    mockedAlbumsApi.list.mockResolvedValue(collection);
    const { wrapper } = makeQueryWrapper();

    const { result } = renderHook(() => useAlbums({ artist: "muse" }), { wrapper });

    await waitFor(() => expect(result.current.data).toBe(collection));
    expect(mockedAlbumsApi.list).toHaveBeenCalledWith({ artist: "muse" });
  });
});

describe("useAlbum", () => {
  afterEach(() => vi.clearAllMocks());

  it("fetches an album by id", async () => {
    const album = { id: 9 } as AlbumDetail;
    mockedAlbumsApi.get.mockResolvedValue(album);
    const { wrapper } = makeQueryWrapper();

    const { result } = renderHook(() => useAlbum(9), { wrapper });

    await waitFor(() => expect(result.current.data).toBe(album));
    expect(mockedAlbumsApi.get).toHaveBeenCalledWith(9);
  });

  it("stays disabled for a non-finite id", () => {
    const { wrapper } = makeQueryWrapper();
    const { result } = renderHook(() => useAlbum(NaN), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockedAlbumsApi.get).not.toHaveBeenCalled();
  });
});
