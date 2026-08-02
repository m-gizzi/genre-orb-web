import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import {
  smartPlaylistsApi,
  type ApiCollection,
  type SmartPlaylist,
  type SmartPlaylistDetail,
} from "@/api/client";
import { makeQueryWrapper } from "@/test/utils";
import {
  useCreateSmartPlaylist,
  useDeleteSmartPlaylist,
  useSmartPlaylist,
  useSmartPlaylistsPage,
  useUpdateSmartPlaylist,
} from "./useSmartPlaylists";

vi.mock("@/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/client")>();
  return {
    ...actual,
    smartPlaylistsApi: {
      paginated: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      remove: vi.fn(),
    },
  };
});

const mockedApi = vi.mocked(smartPlaylistsApi);

const paged: ApiCollection<SmartPlaylist> = {
  data: [],
  meta: { page: 1, per_page: 24, total: 0, total_pages: 0 },
};

afterEach(() => vi.clearAllMocks());

describe("useSmartPlaylistsPage", () => {
  it("fetches a page with the given params", async () => {
    mockedApi.paginated.mockResolvedValue(paged);
    const { wrapper } = makeQueryWrapper();

    const { result } = renderHook(() => useSmartPlaylistsPage({ page: 2 }), { wrapper });

    await waitFor(() => expect(result.current.data).toBe(paged));
    expect(mockedApi.paginated).toHaveBeenCalledWith({ page: 2 });
  });

  it("stays disabled when not enabled", () => {
    const { wrapper } = makeQueryWrapper();
    const { result } = renderHook(() => useSmartPlaylistsPage({}, false), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockedApi.paginated).not.toHaveBeenCalled();
  });
});

describe("useSmartPlaylist", () => {
  it("fetches one smart playlist", async () => {
    const detail = { id: 7 } as SmartPlaylistDetail;
    mockedApi.get.mockResolvedValue(detail);
    const { wrapper } = makeQueryWrapper();

    const { result } = renderHook(() => useSmartPlaylist(7), { wrapper });

    await waitFor(() => expect(result.current.data).toBe(detail));
    expect(mockedApi.get).toHaveBeenCalledWith(7);
  });

  it("stays idle for a non-numeric id", () => {
    const { wrapper } = makeQueryWrapper();
    const { result } = renderHook(() => useSmartPlaylist(Number("abc")), { wrapper });

    expect(result.current.fetchStatus).toBe("idle");
    expect(mockedApi.get).not.toHaveBeenCalled();
  });
});

describe("useCreateSmartPlaylist", () => {
  it("creates and invalidates smart playlist and playlist queries", async () => {
    const detail = { id: 7 } as SmartPlaylistDetail;
    mockedApi.create.mockResolvedValue(detail);
    const { wrapper, queryClient } = makeQueryWrapper();
    const spy = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue();

    const { result } = renderHook(() => useCreateSmartPlaylist(), { wrapper });
    result.current.mutate({ target_playlist_id: 1, source_playlist_ids: [2] });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.create).toHaveBeenCalledWith({
      target_playlist_id: 1,
      source_playlist_ids: [2],
    });
    const keys = spy.mock.calls.map(([arg]) => arg?.queryKey);
    expect(keys).toContainEqual(["smartPlaylists"]);
    expect(keys).toContainEqual(["playlists"]);
  });
});

describe("useUpdateSmartPlaylist", () => {
  it("updates and invalidates the single smart playlist", async () => {
    mockedApi.update.mockResolvedValue({ id: 7 } as SmartPlaylistDetail);
    const { wrapper, queryClient } = makeQueryWrapper();
    const spy = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue();

    const { result } = renderHook(() => useUpdateSmartPlaylist(7), { wrapper });
    result.current.mutate({ is_enabled: true });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.update).toHaveBeenCalledWith(7, { is_enabled: true });
    expect(spy.mock.calls.map(([arg]) => arg?.queryKey)).toContainEqual([
      "smartPlaylist",
      7,
    ]);
  });
});

describe("useDeleteSmartPlaylist", () => {
  it("deletes and invalidates by the mutated id", async () => {
    mockedApi.remove.mockResolvedValue(undefined);
    const { wrapper, queryClient } = makeQueryWrapper();
    const spy = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue();

    const { result } = renderHook(() => useDeleteSmartPlaylist(), { wrapper });
    result.current.mutate(7);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.remove).toHaveBeenCalledWith(7);
    expect(spy.mock.calls.map(([arg]) => arg?.queryKey)).toContainEqual([
      "smartPlaylist",
      7,
    ]);
  });
});
