import { describe, it, expect, vi, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ApiCollection, Genre, GenrePreferences } from "@/api/client";
import { genrePreferencesApi, genresApi } from "@/api/client";
import { renderWithProviders } from "@/test/utils";
import { GenresPage } from "./GenresPage";

vi.mock("@/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/client")>();
  return {
    ...actual,
    genresApi: { list: vi.fn(), get: vi.fn() },
    genrePreferencesApi: { get: vi.fn(), update: vi.fn() },
  };
});

const mockedGenres = vi.mocked(genresApi);
const mockedPreferences = vi.mocked(genrePreferencesApi);

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

function renderPage(rows: Genre[], blocked: { id: number; name: string }[] = []) {
  mockedGenres.list.mockResolvedValue({
    data: rows,
    meta: { page: 1, per_page: 60, total: rows.length, total_pages: 1 },
  } as ApiCollection<Genre>);
  mockedPreferences.get.mockResolvedValue(preferences(blocked));
  mockedPreferences.update.mockResolvedValue(preferences(blocked));

  return renderWithProviders(<GenresPage />, { route: "/genres", withQuery: true });
}

afterEach(() => vi.clearAllMocks());

describe("GenresPage preferences panel", () => {
  // The cloud is what the page is for; a long blocklist would push it below the fold.
  it("starts collapsed", async () => {
    renderPage([]);
    await screen.findByRole("button", { name: /Genre sources/ });

    expect(screen.queryByLabelText("Last.fm minimum confidence")).not.toBeInTheDocument();
  });

  it("opens on click", async () => {
    renderPage([]);
    await userEvent.click(await screen.findByRole("button", { name: /Genre sources/ }));

    expect(screen.getByLabelText("Last.fm minimum confidence")).toBeInTheDocument();
  });

  it("summarises what is filtering the list while closed", async () => {
    renderPage([], [{ id: 3, name: "seen live" }]);

    expect(await screen.findByText(/1 blocked/)).toBeInTheDocument();
  });

  it("says so when nothing is filtering the list", async () => {
    renderPage([]);

    expect(await screen.findByText("All sources on")).toBeInTheDocument();
  });
});

describe("GenresPage chips", () => {
  it("blocks through an icon, not a labelled button", async () => {
    renderPage([{ id: 1, name: "seen live", blocked: false }]);

    const block = await screen.findByRole("button", { name: "Block seen live" });
    expect(screen.queryByText("Block")).not.toBeInTheDocument();

    await userEvent.click(block);
    expect(mockedPreferences.update).toHaveBeenCalledWith({ blocked_genre_ids: [1] });
  });

  it("offers to unblock a blocked genre shown by the toggle", async () => {
    renderPage([{ id: 1, name: "seen live", blocked: true }], [{ id: 1, name: "seen live" }]);

    await userEvent.click(await screen.findByRole("button", { name: "Unblock seen live" }));

    expect(mockedPreferences.update).toHaveBeenCalledWith({ blocked_genre_ids: [] });
  });
});

describe("GenresPage rule-usage filter", () => {
  it("asks the API for only the genres no rule names", async () => {
    renderPage([]);

    await userEvent.click(await screen.findByRole("combobox", { name: "Filter by rule usage" }));
    await userEvent.click(screen.getByRole("option", { name: "Not used in rules" }));

    expect(mockedGenres.list).toHaveBeenLastCalledWith(
      expect.objectContaining({ rule_usage: "unused" }),
    );
  });

  it("drops the param again when set back to all", async () => {
    renderPage([]);
    const open = async () =>
      userEvent.click(await screen.findByRole("combobox", { name: "Filter by rule usage" }));

    await open();
    await userEvent.click(await screen.findByRole("option", { name: "Used in rules" }));
    await open();
    await userEvent.click(await screen.findByRole("option", { name: "All genres" }));

    expect(mockedGenres.list).toHaveBeenLastCalledWith(
      expect.not.objectContaining({ rule_usage: expect.anything() }),
    );
  });
});
