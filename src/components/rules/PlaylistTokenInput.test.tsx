import { useState } from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ApiCollection, Playlist, PlaylistSummary } from "@/api/client";
import { playlistsApi } from "@/api/client";
import { renderWithProviders } from "@/test/utils";
import { ruleSchema } from "@/test/ruleSchema";
import { PlaylistTokenInput } from "./PlaylistTokenInput";
import { PlaylistNamesProvider } from "./playlistNames";

vi.mock("@/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/client")>();
  return {
    ...actual,
    playlistsApi: { paginated: vi.fn() },
  };
});

const mockedPlaylists = vi.mocked(playlistsApi);

function page(names: Record<number, string>): ApiCollection<Playlist> {
  const data = Object.entries(names).map(
    ([id, name]) => ({ id: Number(id), name }) as Playlist,
  );
  return {
    data,
    meta: { page: 1, per_page: 8, total: data.length, total_pages: 1 },
  };
}

function summary(
  id: number,
  name: string,
  overrides: Partial<PlaylistSummary> = {},
): PlaylistSummary {
  return {
    id,
    name,
    spotify_id: `s${id}`,
    sync_enabled: true,
    track_count: 12,
    is_liked_songs: false,
    ...overrides,
  };
}

afterEach(() => vi.clearAllMocks());

function renderTokens(
  initial: number[] = [],
  { known = [] as PlaylistSummary[], maxValues = ruleSchema.max_list_size } = {},
) {
  const onChange = vi.fn();

  function Harness() {
    const [values, setValues] = useState(initial);
    return (
      <PlaylistNamesProvider known={known}>
        <PlaylistTokenInput
          values={values}
          label="Playlist"
          maxValues={maxValues}
          onChange={(next) => {
            onChange(next);
            setValues(next);
          }}
        />
      </PlaylistNamesProvider>
    );
  }

  renderWithProviders(<Harness />, { withQuery: true });
  return { onChange };
}

const tokenInput = () =>
  screen.getByRole("combobox", { name: "Playlist values" });

describe("PlaylistTokenInput", () => {
  it("stores the id of a chosen playlist and shows its name", async () => {
    mockedPlaylists.paginated.mockResolvedValue(page({ 12: "Road Trip" }));
    const { onChange } = renderTokens();

    await userEvent.type(tokenInput(), "road");
    await userEvent.click(await screen.findByRole("option", { name: "Road Trip" }));

    expect(onChange).toHaveBeenCalledWith([12]);
    expect(screen.getByText("Road Trip")).toBeInTheDocument();
  });

  it("takes no free text, since typing cannot name a playlist", async () => {
    mockedPlaylists.paginated.mockResolvedValue(page({}));
    const { onChange } = renderTokens();

    await userEvent.type(tokenInput(), "Road Trip{Enter}");

    expect(onChange).not.toHaveBeenCalled();
  });

  it("names a saved reference from what the server resolved", () => {
    mockedPlaylists.paginated.mockResolvedValue(page({}));
    renderTokens([4], { known: [summary(4, "Already Heard")] });

    expect(screen.getByText("Already Heard")).toBeInTheDocument();
  });

  it("falls back to the id when no name is known for it", () => {
    mockedPlaylists.paginated.mockResolvedValue(page({}));
    renderTokens([99]);

    expect(screen.getByText("Playlist #99")).toBeInTheDocument();
  });

  it("marks a reference that has nothing synced to match on", () => {
    mockedPlaylists.paginated.mockResolvedValue(page({}));
    renderTokens([4], {
      known: [summary(4, "Never Synced", { sync_enabled: false, track_count: 0 })],
    });

    expect(
      screen.getByText(/Never Synced has no synced tracks/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Marked playlists have no synced tracks yet/),
    ).toBeInTheDocument();
  });

  it("says nothing about a reference that holds tracks", () => {
    mockedPlaylists.paginated.mockResolvedValue(page({}));
    renderTokens([4], { known: [summary(4, "Already Heard")] });

    expect(
      screen.queryByText(/Marked playlists have no synced tracks yet/),
    ).not.toBeInTheDocument();
  });

  it("says nothing about a reference it knows nothing about yet", () => {
    mockedPlaylists.paginated.mockResolvedValue(page({}));
    renderTokens([99]);

    expect(
      screen.queryByText(/Marked playlists have no synced tracks yet/),
    ).not.toBeInTheDocument();
  });

  it("will not add the same playlist twice", async () => {
    mockedPlaylists.paginated.mockResolvedValue(page({ 12: "Road Trip" }));
    renderTokens([12], { known: [summary(12, "Road Trip")] });

    await userEvent.type(tokenInput(), "road");

    expect(screen.queryByRole("option", { name: "Road Trip" })).not.toBeInTheDocument();
  });

  it("removes a chip with its button", async () => {
    mockedPlaylists.paginated.mockResolvedValue(page({}));
    const { onChange } = renderTokens([4, 5], {
      known: [summary(4, "Road Trip"), summary(5, "Rainy Day")],
    });

    await userEvent.click(screen.getByRole("button", { name: "Remove Road Trip" }));

    expect(onChange).toHaveBeenCalledWith([5]);
  });

  it("stops taking values at the cap the server enforces", () => {
    mockedPlaylists.paginated.mockResolvedValue(page({}));
    renderTokens([4, 5], { maxValues: 2 });

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(
      screen.getByText("2 playlists is the most one rule can match."),
    ).toBeInTheDocument();
  });
});
