import { TRACK_SORTS, type TrackFilters, type TrackSort } from "@/api/client";
import { DEFAULT_PER_PAGE } from "@/lib/config";
import { listParamsToParams, type Parsed } from "@/lib/catalogFilterParams";
import { toNumber } from "@/lib/parse";
import { pickSort } from "@/lib/sorts";

export type ParsedTrackFilters = Parsed<TrackFilters, TrackSort>;

const TEXT_KEYS = ["title", "artist", "album", "genre"] as const;

const NUMERIC_KEYS = [
  "year",
  "year_min",
  "year_max",
  "duration_min",
  "duration_max",
] as const;

const SERIALIZE_OPTIONS = {
  defaultSort: "title",
  defaultPerPage: DEFAULT_PER_PAGE,
} as const;

export function parseTrackFilters(params: URLSearchParams): ParsedTrackFilters {
  const page = toNumber(params.get("page") ?? "");
  const perPage = toNumber(params.get("per_page") ?? "");

  const filters: ParsedTrackFilters = {
    sort: pickSort(params.get("sort"), TRACK_SORTS, "title"),
    order: params.get("order") === "desc" ? "desc" : "asc",
    page: page ?? 1,
    per_page: perPage ?? DEFAULT_PER_PAGE,
  };

  for (const key of TEXT_KEYS) {
    const value = params.get(key);
    if (value) filters[key] = value;
  }
  for (const key of NUMERIC_KEYS) {
    const value = toNumber(params.get(key) ?? "");
    if (value != null) filters[key] = value;
  }

  const explicit = params.get("explicit");
  if (explicit === "true") filters.explicit = true;
  if (explicit === "false") filters.explicit = false;

  return filters;
}

/** Serialize TrackFilters back to a clean URL param map (defaults omitted). */
export function trackFiltersToParams(
  filters: TrackFilters
): Record<string, string> {
  return listParamsToParams(filters, SERIALIZE_OPTIONS);
}
