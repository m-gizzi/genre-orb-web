import { describe, it, expect, vi, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import {
  artistGenresApi,
  genrePreferencesApi,
  trackGenresApi,
  type GenrePreferences,
} from "@/api/client";
import { makeQueryWrapper } from "@/test/utils";
import { queryKeys } from "@/lib/queryKeys";
import {
  useGenreOverrides,
  useGenrePreferences,
  useToggleBlockedGenre,
  useUpdateGenrePreferences,
} from "./useGenreCuration";

vi.mock("@/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/client")>();
  return {
    ...actual,
    genrePreferencesApi: { get: vi.fn(), update: vi.fn() },
    trackGenresApi: { set: vi.fn(), clear: vi.fn() },
    artistGenresApi: { set: vi.fn(), clear: vi.fn() },
  };
});

const mockedPreferences = vi.mocked(genrePreferencesApi);
const mockedTrackGenres = vi.mocked(trackGenresApi);
const mockedArtistGenres = vi.mocked(artistGenresApi);

function preferences(blocked: { id: number; name: string }[] = []): GenrePreferences {
  return {
    sources: {
      spotify: { enabled: true, min_confidence: 0 },
      musicbrainz: { enabled: true, min_confidence: 0 },
      lastfm: { enabled: true, min_confidence: 0 },
    },
    blocked_genres: blocked,
  };
}

afterEach(() => vi.clearAllMocks());

describe("useGenrePreferences", () => {
  it("fetches the current preferences", async () => {
    mockedPreferences.get.mockResolvedValue(preferences());
    const { wrapper } = makeQueryWrapper();

    const { result } = renderHook(() => useGenrePreferences(), { wrapper });

    await waitFor(() => expect(result.current.data).toEqual(preferences()));
  });
});

describe("useUpdateGenrePreferences", () => {
  // Preferences change what every genre surface reports and what smart playlists match, so
  // a save has to invalidate the catalog rather than just its own key.
  it("invalidates the catalog, not only the preferences key", async () => {
    mockedPreferences.update.mockResolvedValue(preferences());
    const { wrapper, queryClient } = makeQueryWrapper();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useUpdateGenrePreferences(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ sources: { lastfm: { enabled: false } } });
    });

    const roots = invalidate.mock.calls.map((call) => call[0]?.queryKey?.[0]);
    expect(roots).toEqual(expect.arrayContaining(["tracks", "genres", "ruleMatches"]));
  });

  it("writes the response straight into the preferences cache" , async () => {
    const updated = preferences([{ id: 3, name: "seen live" }]);
    mockedPreferences.update.mockResolvedValue(updated);
    const { wrapper, queryClient } = makeQueryWrapper();

    const { result } = renderHook(() => useUpdateGenrePreferences(), { wrapper });
    await act(async () => {
      await result.current.mutateAsync({ blocked_genre_ids: [3] });
    });

    expect(queryClient.getQueryData(queryKeys.genrePreferences)).toEqual(updated);
  });
});

describe("useToggleBlockedGenre", () => {
  it("adds one genre to the list the API replaces wholesale", async () => {
    mockedPreferences.get.mockResolvedValue(preferences([{ id: 1, name: "rock" }]));
    mockedPreferences.update.mockResolvedValue(preferences());
    const { wrapper } = makeQueryWrapper();

    const { result } = renderHook(
      () => ({ prefs: useGenrePreferences(), blocked: useToggleBlockedGenre() }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.prefs.data).toBeDefined());
    await act(async () => {
      await result.current.blocked.toggle(2, true);
    });

    expect(mockedPreferences.update).toHaveBeenCalledWith({ blocked_genre_ids: [1, 2] });
  });

  it("removes one without disturbing the rest", async () => {
    mockedPreferences.get.mockResolvedValue(
      preferences([
        { id: 1, name: "rock" },
        { id: 2, name: "seen live" },
      ]),
    );
    mockedPreferences.update.mockResolvedValue(preferences());
    const { wrapper } = makeQueryWrapper();

    const { result } = renderHook(
      () => ({ prefs: useGenrePreferences(), blocked: useToggleBlockedGenre() }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.prefs.data).toBeDefined());
    await act(async () => {
      await result.current.blocked.toggle(2, false);
    });

    expect(mockedPreferences.update).toHaveBeenCalledWith({ blocked_genre_ids: [1] });
  });

  // The API replaces the list wholesale, so a click before preferences land would send an
  // empty array and silently unblock everything.
  it("refuses to send anything before preferences have loaded", async () => {
    mockedPreferences.get.mockReturnValue(new Promise(() => {}));
    const { wrapper } = makeQueryWrapper();

    const { result } = renderHook(() => useToggleBlockedGenre(), { wrapper });
    expect(result.current.ready).toBe(false);
    await act(async () => {
      await result.current.toggle(2, true);
    });

    expect(mockedPreferences.update).not.toHaveBeenCalled();
  });
});

describe("useGenreOverrides", () => {
  it("hides a genre through the track resource", async () => {
    mockedTrackGenres.set.mockResolvedValue([]);
    const { wrapper } = makeQueryWrapper();

    const { result } = renderHook(() => useGenreOverrides("track", 7), { wrapper });
    act(() => result.current.hide(3));

    await waitFor(() =>
      expect(mockedTrackGenres.set).toHaveBeenCalledWith(7, {
        genre_id: 3,
        action: "hidden",
      }),
    );
  });

  // A genre nobody has fetched yet is exactly the one worth typing in, so adds travel by
  // name rather than by id.
  it("adds a genre by name", async () => {
    mockedArtistGenres.set.mockResolvedValue([]);
    const { wrapper } = makeQueryWrapper();

    const { result } = renderHook(() => useGenreOverrides("artist", 9), { wrapper });
    act(() => result.current.add("post-metal"));

    await waitFor(() =>
      expect(mockedArtistGenres.set).toHaveBeenCalledWith(9, {
        name: "post-metal",
        action: "added",
      }),
    );
  });

  it("reverts by clearing the override rather than writing another one", async () => {
    mockedTrackGenres.clear.mockResolvedValue([]);
    const { wrapper } = makeQueryWrapper();

    const { result } = renderHook(() => useGenreOverrides("track", 7), { wrapper });
    act(() => result.current.revert(3));

    await waitFor(() => expect(mockedTrackGenres.clear).toHaveBeenCalledWith(7, 3));
    expect(mockedTrackGenres.set).not.toHaveBeenCalled();
  });
});
