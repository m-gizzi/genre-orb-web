import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import type { Track, TrackGenre } from "@/api/client";
import { renderWithProviders } from "@/test/utils";
import { TrackTable } from "./TrackTable";

function genre(id: number, name: string): TrackGenre {
  return { id, genre_id: id, name, source: "spotify" };
}

function makeTrack(overrides: Partial<Track> = {}): Track {
  return {
    id: 1,
    title: "Time Is Running Out",
    spotify_id: "sp1",
    duration_ms: 237000,
    track_number: 3,
    explicit: false,
    popularity: 70,
    preview_url: null,
    album: { id: 1, title: "Absolution", spotify_id: "a1", release_year: 2003, artwork_url: null },
    artists: [{ id: 1, name: "Muse", spotify_id: "s1", image_url: null }],
    genres: [],
    ...overrides,
  };
}

describe("TrackTable", () => {
  it("renders a row per track", () => {
    renderWithProviders(
      <TrackTable
        tracks={[makeTrack({ id: 1, title: "One" }), makeTrack({ id: 2, title: "Two" })]}
      />
    );
    expect(screen.getByRole("link", { name: "One" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Two" })).toBeInTheDocument();
  });

  it("shows the explicit badge only for explicit tracks", () => {
    const { rerender } = renderWithProviders(
      <TrackTable tracks={[makeTrack({ explicit: false })]} />
    );
    expect(screen.queryByTitle("Explicit")).not.toBeInTheDocument();

    rerender(<TrackTable tracks={[makeTrack({ explicit: true })]} />);
    expect(screen.getByTitle("Explicit")).toBeInTheDocument();
  });

  it("caps genres at three with an overflow count", () => {
    renderWithProviders(
      <TrackTable
        tracks={[
          makeTrack({
            genres: [genre(1, "a"), genre(2, "b"), genre(3, "c"), genre(4, "d"), genre(5, "e")],
          }),
        ]}
      />
    );
    expect(screen.getByText("a")).toBeInTheDocument();
    expect(screen.getByText("c")).toBeInTheDocument();
    expect(screen.queryByText("d")).not.toBeInTheDocument();
    expect(screen.getByText("+2")).toBeInTheDocument();
  });

  it("numbers rows by index when track_number is missing", () => {
    renderWithProviders(
      <TrackTable
        numbering="track"
        tracks={[makeTrack({ id: 1, track_number: null })]}
      />
    );
    expect(screen.getByRole("cell", { name: "1" })).toBeInTheDocument();
  });
});
