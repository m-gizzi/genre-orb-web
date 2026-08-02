import { describe, it, expect, vi } from "vitest";
import { QueryClient } from "@tanstack/react-query";
import { invalidateLibraryQueries } from "./invalidate";

describe("invalidateLibraryQueries", () => {
  it("invalidates every catalog root exactly once", () => {
    const queryClient = new QueryClient();
    const spy = vi.spyOn(queryClient, "invalidateQueries").mockResolvedValue();

    invalidateLibraryQueries(queryClient);

    const invalidatedKeys = spy.mock.calls.map(([arg]) => arg?.queryKey);
    expect(invalidatedKeys).toEqual([
      ["playlists"],
      ["playlist"],
      ["smartPlaylists"],
      ["smartPlaylist"],
      ["tracks"],
      ["track"],
      ["artists"],
      ["artist"],
      ["albums"],
      ["album"],
      ["genres"],
      ["genre"],
    ]);
  });
});
