import { describe, it, expect } from "vitest";
import { ARTIST_SORTS } from "./sorts";
import {
  parseListParams,
  listParamsToParams,
  parseArtistFilters,
  artistFiltersToParams,
  parseAlbumFilters,
  albumFiltersToParams,
} from "./catalogFilterParams";

describe("parseListParams", () => {
  it("applies defaults for an empty query", () => {
    expect(parseListParams(new URLSearchParams(), { sorts: ARTIST_SORTS, defaultSort: "name" })).toEqual({
      sort: "name",
      order: "asc",
      page: 1,
      per_page: 24,
    });
  });

  it("parses provided values and honours a custom default per_page", () => {
    const params = new URLSearchParams({
      sort: "popularity",
      order: "desc",
      page: "3",
      per_page: "60",
      search: "war",
    });
    expect(
      parseListParams(params, {
        sorts: ARTIST_SORTS,
        defaultSort: "name",
        defaultPerPage: 60,
      })
    ).toEqual({
      sort: "popularity",
      order: "desc",
      page: 3,
      per_page: 60,
      search: "war",
    });
  });

  it("falls back to the default for a sort key the resource doesn't support", () => {
    expect(
      parseListParams(new URLSearchParams({ sort: "'; DROP TABLE --" }), {
        sorts: ARTIST_SORTS,
        defaultSort: "name",
      }).sort
    ).toBe("name");

    expect(
      parseListParams(new URLSearchParams({ sort: "track_count" }), {
        sorts: ARTIST_SORTS,
        defaultSort: "name",
      }).sort
    ).toBe("name");
  });

  it("ignores non-numeric pagination values", () => {
    const filters = parseListParams(
      new URLSearchParams({ page: "abc", per_page: "many" }),
      { sorts: ARTIST_SORTS, defaultSort: "name" }
    );
    expect(filters.page).toBe(1);
    expect(filters.per_page).toBe(24);
  });

  it("falls back to asc for an unrecognized order", () => {
    expect(
      parseListParams(new URLSearchParams({ order: "sideways" }), {
        sorts: ARTIST_SORTS,
        defaultSort: "name",
      }).order
    ).toBe("asc");
  });
});

describe("listParamsToParams", () => {
  it("omits defaults and empty values", () => {
    expect(
      listParamsToParams(
        { sort: "name", order: "asc", page: 1, per_page: 24, search: "" },
        { defaultSort: "name" }
      )
    ).toEqual({});
  });

  it("serializes only non-default values", () => {
    expect(
      listParamsToParams(
        { sort: "title", order: "desc", page: 2, per_page: 48, search: "war" },
        { defaultSort: "name" }
      )
    ).toEqual({
      sort: "title",
      order: "desc",
      page: "2",
      per_page: "48",
      search: "war",
    });
  });
});

describe("artist filters", () => {
  it("parses the genre facet as a string", () => {
    expect(parseArtistFilters(new URLSearchParams({ genre: "12" }))).toMatchObject({
      sort: "name",
      genre: "12",
    });
  });

  it("round-trips through parse", () => {
    const params = artistFiltersToParams(
      parseArtistFilters(
        new URLSearchParams({ genre: "5", sort: "popularity", order: "desc" })
      )
    );
    expect(params).toEqual({ genre: "5", sort: "popularity", order: "desc" });
  });
});

describe("album filters", () => {
  it("parses artist, genre, and year range", () => {
    const params = new URLSearchParams({
      artist: "radiohead",
      genre: "7",
      year_min: "1990",
      year_max: "2000",
    });
    expect(parseAlbumFilters(params)).toMatchObject({
      sort: "title",
      artist: "radiohead",
      genre: "7",
      year_min: 1990,
      year_max: 2000,
    });
  });

  it("round-trips through parse", () => {
    const params = albumFiltersToParams(
      parseAlbumFilters(
        new URLSearchParams({ artist: "radiohead", year_min: "1990", page: "2" })
      )
    );
    expect(params).toEqual({ artist: "radiohead", year_min: "1990", page: "2" });
  });
});
