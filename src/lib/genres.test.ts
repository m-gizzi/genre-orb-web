import { describe, it, expect } from "vitest";
import type { GenreSource, SourcedGenre } from "@/api/client";
import { groupGenres, describeSources } from "./genres";

let nextId = 1;

function entry(
  genreId: number,
  name: string,
  source: GenreSource,
  confidence = 1,
): SourcedGenre {
  return { id: nextId++, genre_id: genreId, name, source, confidence };
}

describe("groupGenres", () => {
  it("returns one entry per genre regardless of how many sources claim it", () => {
    const grouped = groupGenres([
      entry(1, "metal", "spotify"),
      entry(1, "metal", "musicbrainz"),
      entry(1, "metal", "lastfm"),
    ]);

    expect(grouped.map((genre) => genre.name)).toEqual(["metal"]);
  });

  it("collects every source that claimed the genre", () => {
    const grouped = groupGenres([
      entry(1, "metal", "lastfm"),
      entry(1, "metal", "spotify"),
    ]);

    expect(grouped.map((genre) => genre.sources)).toEqual([
      ["spotify", "lastfm"],
    ]);
  });

  it("keeps the strongest confidence any source offered", () => {
    const grouped = groupGenres([
      entry(1, "metal", "lastfm", 0.4),
      entry(1, "metal", "musicbrainz", 0.9),
    ]);

    expect(grouped.map((genre) => genre.confidence)).toEqual([0.9]);
  });

  it("pins a genre you added ahead of anything the providers agreed on", () => {
    const grouped = groupGenres([
      entry(1, "metal", "spotify"),
      entry(1, "metal", "musicbrainz"),
      entry(1, "metal", "lastfm"),
      entry(2, "chill", "user"),
    ]);

    expect(grouped.map((genre) => genre.name)).toEqual(["chill", "metal"]);
  });

  it("still ranks your own genres against each other by confidence", () => {
    const grouped = groupGenres([
      entry(1, "chill", "user", 0.4),
      entry(2, "focus", "user", 0.9),
    ]);

    expect(grouped.map((genre) => genre.name)).toEqual(["focus", "chill"]);
  });

  it("orders better-corroborated genres first", () => {
    const grouped = groupGenres([
      entry(1, "doom", "lastfm", 1),
      entry(2, "metal", "spotify", 0.2),
      entry(2, "metal", "musicbrainz", 0.2),
    ]);

    expect(grouped.map((genre) => genre.name)).toEqual(["metal", "doom"]);
  });

  it("orders by confidence within the same level of agreement", () => {
    const grouped = groupGenres([
      entry(1, "doom", "lastfm", 0.3),
      entry(2, "sludge", "lastfm", 0.8),
    ]);

    expect(grouped.map((genre) => genre.name)).toEqual(["sludge", "doom"]);
  });

  it("breaks ties on name so the order is stable", () => {
    const grouped = groupGenres([
      entry(1, "zeuhl", "lastfm", 0.5),
      entry(2, "ambient", "lastfm", 0.5),
    ]);

    expect(grouped.map((genre) => genre.name)).toEqual(["ambient", "zeuhl"]);
  });

  it("does not repeat a source that appears twice for one genre", () => {
    const grouped = groupGenres([
      entry(1, "metal", "spotify"),
      entry(1, "metal", "spotify"),
    ]);

    expect(grouped.map((genre) => genre.sources)).toEqual([["spotify"]]);
  });

  it("keeps genres with the same name but different ids apart", () => {
    const grouped = groupGenres([
      entry(1, "metal", "spotify"),
      entry(2, "metal", "lastfm"),
    ]);

    expect(grouped).toHaveLength(2);
  });

  it("returns nothing for no genres", () => {
    expect(groupGenres([])).toEqual([]);
  });
});

describe("describeSources", () => {
  it("names a single source", () => {
    expect(describeSources(["spotify"])).toBe("From Spotify");
  });

  it("phrases a user-added genre as authorship rather than a source", () => {
    expect(describeSources(["user"])).toBe("Added by you");
  });

  it("joins two sources with and", () => {
    expect(describeSources(["spotify", "lastfm"])).toBe(
      "From Spotify and Last.fm",
    );
  });

  it("comma-separates three sources", () => {
    expect(describeSources(["spotify", "musicbrainz", "lastfm"])).toBe(
      "From Spotify, MusicBrainz and Last.fm",
    );
  });

  it("handles an empty list", () => {
    expect(describeSources([])).toBe("Source unknown");
  });
});
