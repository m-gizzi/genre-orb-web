import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { playlistsApi, type Playlist } from "@/api/client";
import { makeQueryWrapper } from "@/test/utils";
import { useCreatePlaylist, useUpdatePlaylist } from "./usePlaylistMutations";

vi.mock("@/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/client")>();
  return {
    ...actual,
    playlistsApi: { create: vi.fn(), update: vi.fn() },
  };
});

const mockedApi = vi.mocked(playlistsApi);

afterEach(() => vi.clearAllMocks());

describe("useCreatePlaylist", () => {
  it("creates a playlist and invalidates the list", async () => {
    mockedApi.create.mockResolvedValue({ id: 1 } as Playlist);
    const { wrapper, queryClient } = makeQueryWrapper();
    const spy = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue();

    const { result } = renderHook(() => useCreatePlaylist(), { wrapper });
    result.current.mutate({ name: "Metal Mix" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.create).toHaveBeenCalledWith({ name: "Metal Mix" });
    expect(spy.mock.calls.map(([arg]) => arg?.queryKey)).toContainEqual(["playlists"]);
  });

  it("surfaces the API error", async () => {
    mockedApi.create.mockRejectedValue(new Error("Spotify is temporarily unavailable."));
    const { wrapper } = makeQueryWrapper();

    const { result } = renderHook(() => useCreatePlaylist(), { wrapper });
    result.current.mutate({ name: "Metal Mix" });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe("Spotify is temporarily unavailable.");
  });
});

describe("useUpdatePlaylist", () => {
  it("updates a playlist and invalidates both list and detail", async () => {
    mockedApi.update.mockResolvedValue({ id: 4 } as Playlist);
    const { wrapper, queryClient } = makeQueryWrapper();
    const spy = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue();

    const { result } = renderHook(() => useUpdatePlaylist(4), { wrapper });
    result.current.mutate({ name: "Renamed" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockedApi.update).toHaveBeenCalledWith(4, { name: "Renamed" });
    const keys = spy.mock.calls.map(([arg]) => arg?.queryKey);
    expect(keys).toContainEqual(["playlists"]);
    expect(keys).toContainEqual(["playlist", 4]);
  });
});
