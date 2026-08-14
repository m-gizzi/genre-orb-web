import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { SourcedGenre } from "@/api/client";
import { renderWithProviders } from "@/test/utils";
import { GenreEditor } from "./GenreEditor";

const overrides = { hide: vi.fn(), add: vi.fn(), revert: vi.fn(), isPending: false, error: null };

vi.mock("@/hooks/useGenreCuration", () => ({
  useGenreOverrides: () => overrides,
}));

vi.mock("@/hooks/useGenres", () => ({
  useGenres: () => ({ data: { data: [{ id: 9, name: "sludge" }] }, isFetching: false }),
}));

function genre(name: string, source: SourcedGenre["source"], id = 1): SourcedGenre {
  return { genre_id: id, name, source, confidence: 1 };
}

function renderEditor(genres: SourcedGenre[]) {
  return renderWithProviders(
    <GenreEditor subject="track" subjectId={7} genres={genres} emptyMessage="Nothing yet" />,
    { withQuery: true },
  );
}

beforeEach(() => vi.clearAllMocks());

describe("GenreEditor", () => {
  it("shows the empty message when there is nothing to show", () => {
    renderEditor([]);

    expect(screen.getByText("Nothing yet")).toBeInTheDocument();
  });

  // A provider's claim has to be *hidden*, or it simply comes back on the next pass.
  it("hides a genre a provider claimed", async () => {
    renderEditor([genre("metal", "spotify", 3)]);

    await userEvent.click(screen.getByRole("button", { name: "Hide metal" }));

    expect(overrides.hide).toHaveBeenCalledWith(3);
    expect(overrides.revert).not.toHaveBeenCalled();
  });

  // Yours alone means there is nothing underneath to hide — clearing the override is both
  // the same visible result and one row lighter.
  it("reverts a genre only you claimed", async () => {
    renderEditor([genre("post-metal", "user", 4)]);

    await userEvent.click(screen.getByRole("button", { name: "Undo adding post-metal" }));

    expect(overrides.revert).toHaveBeenCalledWith(4);
    expect(overrides.hide).not.toHaveBeenCalled();
  });

  it("hides rather than reverts when a provider agrees with you", async () => {
    renderEditor([genre("metal", "user", 3), genre("metal", "lastfm", 3)]);

    await userEvent.click(screen.getByRole("button", { name: "Hide metal" }));

    expect(overrides.hide).toHaveBeenCalledWith(3);
  });

  it("adds a genre by the name typed, even one not on the list", async () => {
    renderEditor([]);

    const input = screen.getByRole("combobox", { name: "Add a genre to this track" });
    await userEvent.type(input, "blackgaze{Enter}");

    expect(overrides.add).toHaveBeenCalledWith("blackgaze");
  });

  it("does not suggest a genre the subject already carries", async () => {
    renderEditor([genre("sludge", "spotify", 9)]);

    const input = screen.getByRole("combobox", { name: "Add a genre to this track" });
    await userEvent.type(input, "slu");

    expect(screen.queryByRole("option", { name: "sludge" })).not.toBeInTheDocument();
  });
});
