import type { TrackFilters, TrackSort } from "@/api/client";
import { DEFAULT_PER_PAGE } from "@/lib/config";

const NUMERIC_KEYS = [
  "year",
  "year_min",
  "year_max",
  "duration_min",
  "duration_max",
] as const;

export function parseTrackFilters(params: URLSearchParams): TrackFilters {
  const filters: TrackFilters = {
    sort: (params.get("sort") as TrackSort) || "title",
    order: params.get("order") === "desc" ? "desc" : "asc",
    page: params.get("page") ? Number(params.get("page")) : 1,
    per_page: params.get("per_page")
      ? Number(params.get("per_page"))
      : DEFAULT_PER_PAGE,
  };
  if (params.get("title")) filters.title = params.get("title")!;
  if (params.get("artist")) filters.artist = params.get("artist")!;
  if (params.get("album")) filters.album = params.get("album")!;
  if (params.get("genre")) filters.genre = params.get("genre")!;
  if (params.get("explicit") === "true") filters.explicit = true;
  if (params.get("explicit") === "false") filters.explicit = false;
  for (const key of NUMERIC_KEYS) {
    const value = params.get(key);
    if (value) filters[key] = Number(value);
  }
  return filters;
}

/** Serialize TrackFilters back to a clean URL param map (defaults omitted). */
export function trackFiltersToParams(filters: TrackFilters): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === "") continue;
    if (key === "sort" && value === "title") continue;
    if (key === "order" && value === "asc") continue;
    if (key === "page" && value === 1) continue;
    if (key === "per_page" && value === DEFAULT_PER_PAGE) continue;
    out[key] = String(value);
  }
  return out;
}
