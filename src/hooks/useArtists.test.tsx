import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import {
  artistsApi,
  type ApiCollection,
  type Artist,
  type ArtistDetail,
} from "@/api/client";
import { makeQueryWrapper } from "@/test/utils";
import { useArtists, useArtist } from "./useArtists";

vi.mock("@/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/client")>();
  return {
    ...actual,
    artistsApi: { list: vi.fn(), get: vi.fn() },
  };
});

const mockedArtistsApi = vi.mocked(artistsApi);

const collection: ApiCollection<Artist> = {
  data: [],
  meta: { page: 1, per_page: 24, total: 0, total_pages: 0 },
};

describe("useArtists", () => {
  afterEach(() => vi.clearAllMocks());

  it("lists artists with the given params", async () => {
    mockedArtistsApi.list.mockResolvedValue(collection);
    const { wrapper } = makeQueryWrapper();

    const { result } = renderHook(() => useArtists({ genre: 3 }), { wrapper });

    await waitFor(() => expect(result.current.data).toBe(collection));
    expect(mockedArtistsApi.list).toHaveBeenCalledWith({ genre: 3 });
  });
});

describe("useArtist", () => {
  afterEach(() => vi.clearAllMocks());

  it("fetches an artist by id", async () => {
    const artist = { id: 5 } as ArtistDetail;
    mockedArtistsApi.get.mockResolvedValue(artist);
    const { wrapper } = makeQueryWrapper();

    const { result } = renderHook(() => useArtist(5), { wrapper });

    await waitFor(() => expect(result.current.data).toBe(artist));
    expect(mockedArtistsApi.get).toHaveBeenCalledWith(5);
  });

  it("stays disabled for a non-finite id", () => {
    const { wrapper } = makeQueryWrapper();
    const { result } = renderHook(() => useArtist(NaN), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockedArtistsApi.get).not.toHaveBeenCalled();
  });
});
