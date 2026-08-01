import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { tracksApi, type ApiCollection, type Track } from "@/api/client";
import { makeQueryWrapper } from "@/test/utils";
import { useTracks, useTrack } from "./useTracks";

vi.mock("@/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/client")>();
  return {
    ...actual,
    tracksApi: { list: vi.fn(), get: vi.fn() },
  };
});

const mockedTracksApi = vi.mocked(tracksApi);

const collection: ApiCollection<Track> = {
  data: [],
  meta: { page: 1, per_page: 25, total: 0, total_pages: 0 },
};

describe("useTracks", () => {
  afterEach(() => vi.clearAllMocks());

  it("lists tracks with the given filters", async () => {
    mockedTracksApi.list.mockResolvedValue(collection);
    const { wrapper } = makeQueryWrapper();

    const { result } = renderHook(() => useTracks({ sort: "year" }), { wrapper });

    await waitFor(() => expect(result.current.data).toBe(collection));
    expect(mockedTracksApi.list).toHaveBeenCalledWith({ sort: "year" });
  });
});

describe("useTrack", () => {
  afterEach(() => vi.clearAllMocks());

  it("fetches a track by id", async () => {
    const track = { id: 7 } as Track;
    mockedTracksApi.get.mockResolvedValue(track);
    const { wrapper } = makeQueryWrapper();

    const { result } = renderHook(() => useTrack(7), { wrapper });

    await waitFor(() => expect(result.current.data).toBe(track));
    expect(mockedTracksApi.get).toHaveBeenCalledWith(7);
  });

  it("stays disabled for a non-finite id", () => {
    const { wrapper } = makeQueryWrapper();
    const { result } = renderHook(() => useTrack(NaN), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockedTracksApi.get).not.toHaveBeenCalled();
  });
});
