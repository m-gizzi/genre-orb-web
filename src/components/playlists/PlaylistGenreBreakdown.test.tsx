import { describe, it, expect, vi, afterEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ApiCollection, PlaylistGenre } from "@/api/client";
import { playlistsApi } from "@/api/client";
import { renderWithProviders } from "@/test/utils";
import { PlaylistGenreBreakdown } from "./PlaylistGenreBreakdown";

vi.mock("@/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/client")>();
  return { ...actual, playlistsApi: { genres: vi.fn() } };
});

const mockedApi = vi.mocked(playlistsApi);

const GENRES: PlaylistGenre[] = [
  { id: 1, name: "shoegaze", blocked: false, track_count: 5 },
  { id: 2, name: "dream pop", blocked: false, track_count: 3 },
  { id: 3, name: "new wave", blocked: false, track_count: 1 },
  { id: 4, name: "post-punk", blocked: false, track_count: 1 },
];

function collection(genres = GENRES): ApiCollection<PlaylistGenre> {
  return {
    data: genres,
    meta: { page: 1, per_page: 25, total: genres.length, total_pages: 1 },
  };
}

function renderBreakdown(props: Partial<Parameters<typeof PlaylistGenreBreakdown>[0]> = {}) {
  const onSelectGenre = props.onSelectGenre ?? vi.fn();
  renderWithProviders(
    <PlaylistGenreBreakdown
      playlistId={7}
      trackCount={10}
      onSelectGenre={onSelectGenre}
      {...props}
    />,
    { withQuery: true },
  );
  return { onSelectGenre };
}

async function open() {
  await userEvent.click(
    await screen.findByRole("button", { name: /Genre breakdown/ }),
  );
}

/** The params of the most recent request. */
function lastParams() {
  return mockedApi.genres.mock.lastCall?.[1];
}

afterEach(() => vi.clearAllMocks());

describe("PlaylistGenreBreakdown", () => {
  it("summarises the playlist while collapsed, without listing the rows", async () => {
    mockedApi.genres.mockResolvedValue(collection());
    renderBreakdown();

    expect(await screen.findByText("4 genres · shoegaze, dream pop, new wave")).toBeInTheDocument();
    expect(screen.queryByText("post-punk")).not.toBeInTheDocument();
  });

  it("asks for the biggest genres first, so the summary names the dominant ones", async () => {
    mockedApi.genres.mockResolvedValue(collection());
    renderBreakdown();

    await waitFor(() => expect(mockedApi.genres).toHaveBeenCalled());
    expect(lastParams()).toMatchObject({ sort: "track_count", order: "desc" });
  });

  it("says so when the playlist has no genres yet", async () => {
    mockedApi.genres.mockResolvedValue(collection([]));
    renderBreakdown();

    expect(await screen.findByText("No genres yet")).toBeInTheDocument();
  });

  it("reveals the rows once opened", async () => {
    mockedApi.genres.mockResolvedValue(collection());
    renderBreakdown();
    await open();

    expect(await screen.findByText("shoegaze")).toBeInTheDocument();
    expect(screen.getByText("post-punk")).toBeInTheDocument();
  });

  it("shows each genre's count and its share of the playlist's tracks", async () => {
    mockedApi.genres.mockResolvedValue(collection());
    renderBreakdown();
    await open();

    const row = (await screen.findByText("shoegaze")).closest("li");
    expect(row).toHaveTextContent("5");
    expect(row).toHaveTextContent("50%");
    expect(screen.getByRole("progressbar", { name: "shoegaze share of tracks" })).toHaveAttribute(
      "aria-valuenow",
      "50",
    );
  });

  it("links each genre to its detail page", async () => {
    mockedApi.genres.mockResolvedValue(collection());
    renderBreakdown();
    await open();

    expect(await screen.findByRole("link", { name: "Open shoegaze" })).toHaveAttribute(
      "href",
      "/genres/1",
    );
  });

  it("selects a genre when its row is clicked", async () => {
    mockedApi.genres.mockResolvedValue(collection());
    const { onSelectGenre } = renderBreakdown();
    await open();

    await userEvent.click(
      await screen.findByRole("button", { name: "Filter the tracks by shoegaze" }),
    );

    expect(onSelectGenre).toHaveBeenCalledWith(GENRES[0]);
  });

  it("clears the selection when the active row is clicked again", async () => {
    mockedApi.genres.mockResolvedValue(collection());
    const { onSelectGenre } = renderBreakdown({ activeGenreId: 1 });
    await open();

    await userEvent.click(
      await screen.findByRole("button", { name: "Stop filtering by shoegaze" }),
    );

    expect(onSelectGenre).toHaveBeenCalledWith(null);
  });

  it("marks the active row as pressed", async () => {
    mockedApi.genres.mockResolvedValue(collection());
    renderBreakdown({ activeGenreId: 2 });
    await open();

    expect(
      await screen.findByRole("button", { name: "Stop filtering by dream pop" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("sorts by name on request", async () => {
    mockedApi.genres.mockResolvedValue(collection());
    renderBreakdown();
    await open();

    await userEvent.click(screen.getByRole("combobox", { name: "Sort by" }));
    await userEvent.click(await screen.findByRole("option", { name: "Name" }));

    await waitFor(() => expect(lastParams()).toMatchObject({ sort: "name" }));
  });

  it("asks for blocked genres when the switch is on", async () => {
    mockedApi.genres.mockResolvedValue(collection());
    renderBreakdown();
    await open();

    await userEvent.click(screen.getByRole("switch", { name: /Show blocked genres/ }));

    await waitFor(() => expect(lastParams()).toMatchObject({ include_blocked: true }));
  });

  it("filters by whether a rule names the genre", async () => {
    mockedApi.genres.mockResolvedValue(collection());
    renderBreakdown();
    await open();

    await userEvent.click(screen.getByRole("combobox", { name: "Filter by rule usage" }));
    await userEvent.click(await screen.findByRole("option", { name: "Not used in rules" }));

    await waitFor(() => expect(lastParams()).toMatchObject({ rule_usage: "unused" }));
  });

  it("warns that the counts overlap, so they don't read as broken", async () => {
    mockedApi.genres.mockResolvedValue(collection());
    renderBreakdown();
    await open();

    expect(
      await screen.findByText(/add up to more than the playlist's 10 tracks/),
    ).toBeInTheDocument();
  });
});
