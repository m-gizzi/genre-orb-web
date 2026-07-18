import { describe, it, expect } from "vitest";
import {
  parseTrackFilters,
  trackFiltersToParams,
} from "./trackFilterParams";

describe("parseTrackFilters", () => {
  it("applies defaults for an empty query", () => {
    const filters = parseTrackFilters(new URLSearchParams());
    expect(filters).toEqual({
      sort: "title",
      order: "asc",
      page: 1,
      per_page: 25,
    });
  });

  it("parses strings, numbers, and the explicit flag", () => {
    const params = new URLSearchParams({
      title: "war",
      genre: "12",
      year_min: "1990",
      duration_max: "240000",
      explicit: "true",
      sort: "popularity",
      order: "desc",
      page: "3",
    });
    const filters = parseTrackFilters(params);
    expect(filters).toMatchObject({
      title: "war",
      genre: "12",
      year_min: 1990,
      duration_max: 240000,
      explicit: true,
      sort: "popularity",
      order: "desc",
      page: 3,
    });
  });

  it("treats explicit=false as clean-only", () => {
    expect(parseTrackFilters(new URLSearchParams({ explicit: "false" })).explicit).toBe(
      false
    );
  });
});

describe("trackFiltersToParams", () => {
  it("omits defaults and empty values", () => {
    expect(
      trackFiltersToParams({ sort: "title", order: "asc", page: 1, title: "" })
    ).toEqual({});
  });

  it("serializes only non-default values", () => {
    expect(
      trackFiltersToParams({
        sort: "year",
        order: "desc",
        page: 2,
        genre: "5",
        explicit: true,
      })
    ).toEqual({
      sort: "year",
      order: "desc",
      page: "2",
      genre: "5",
      explicit: "true",
    });
  });

  it("omits the default per_page but keeps a custom one", () => {
    expect(trackFiltersToParams({ per_page: 25 })).toEqual({});
    expect(trackFiltersToParams({ per_page: 50 })).toEqual({ per_page: "50" });
  });

  it("round-trips through parse", () => {
    const original = new URLSearchParams({
      genre: "7",
      sort: "duration",
      order: "desc",
      page: "4",
    });
    const params = trackFiltersToParams(parseTrackFilters(original));
    expect(params).toEqual({
      genre: "7",
      sort: "duration",
      order: "desc",
      page: "4",
    });
  });
});
