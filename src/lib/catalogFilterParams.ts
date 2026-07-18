import type { AlbumListParams, CatalogListParams } from "@/api/client";
import { DEFAULT_CARD_PER_PAGE } from "@/lib/config";

function parseCatalogFilters(
  params: URLSearchParams,
  defaultSort: string,
): CatalogListParams {
  const filters: CatalogListParams = {
    sort: params.get("sort") || defaultSort,
    order: params.get("order") === "desc" ? "desc" : "asc",
    page: params.get("page") ? Number(params.get("page")) : 1,
    per_page: params.get("per_page")
      ? Number(params.get("per_page"))
      : DEFAULT_CARD_PER_PAGE,
  };
  if (params.get("search")) filters.search = params.get("search")!;
  if (params.get("genre")) filters.genre = Number(params.get("genre"));
  return filters;
}

function catalogFiltersToParams(
  filters: CatalogListParams,
  defaultSort: string,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === "") continue;
    if (key === "sort" && value === defaultSort) continue;
    if (key === "order" && value === "asc") continue;
    if (key === "page" && value === 1) continue;
    if (key === "per_page" && value === DEFAULT_CARD_PER_PAGE) continue;
    out[key] = String(value);
  }
  return out;
}

export function parseArtistFilters(params: URLSearchParams): CatalogListParams {
  return parseCatalogFilters(params, "name");
}

export function artistFiltersToParams(filters: CatalogListParams) {
  return catalogFiltersToParams(filters, "name");
}

export function parseAlbumFilters(params: URLSearchParams): AlbumListParams {
  const filters: AlbumListParams = parseCatalogFilters(params, "title");
  if (params.get("artist")) filters.artist = params.get("artist")!;
  if (params.get("year_min")) filters.year_min = Number(params.get("year_min"));
  if (params.get("year_max")) filters.year_max = Number(params.get("year_max"));
  return filters;
}

export function albumFiltersToParams(filters: AlbumListParams) {
  return catalogFiltersToParams(filters, "title");
}
