import type {
  AlbumListParams,
  CatalogListParams,
  SearchListParams,
} from "@/api/client";
import { DEFAULT_CARD_PER_PAGE } from "@/lib/config";

interface ListParamOptions {
  defaultSort: string;
  defaultPerPage?: number;
}

export function parseListParams(
  params: URLSearchParams,
  { defaultSort, defaultPerPage = DEFAULT_CARD_PER_PAGE }: ListParamOptions,
): SearchListParams {
  const filters: SearchListParams = {
    sort: params.get("sort") || defaultSort,
    order: params.get("order") === "desc" ? "desc" : "asc",
    page: params.get("page") ? Number(params.get("page")) : 1,
    per_page: params.get("per_page")
      ? Number(params.get("per_page"))
      : defaultPerPage,
  };
  if (params.get("search")) filters.search = params.get("search")!;
  return filters;
}

export function listParamsToParams(
  filters: SearchListParams,
  { defaultSort, defaultPerPage = DEFAULT_CARD_PER_PAGE }: ListParamOptions,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null || value === "") continue;
    if (key === "sort" && value === defaultSort) continue;
    if (key === "order" && value === "asc") continue;
    if (key === "page" && value === 1) continue;
    if (key === "per_page" && value === defaultPerPage) continue;
    out[key] = String(value);
  }
  return out;
}

function parseCatalogFilters(
  params: URLSearchParams,
  defaultSort: string,
): CatalogListParams {
  const filters: CatalogListParams = parseListParams(params, { defaultSort });
  if (params.get("genre")) filters.genre = params.get("genre")!;
  return filters;
}

export function parseArtistFilters(params: URLSearchParams): CatalogListParams {
  return parseCatalogFilters(params, "name");
}

export function artistFiltersToParams(filters: CatalogListParams) {
  return listParamsToParams(filters, { defaultSort: "name" });
}

export function parseAlbumFilters(params: URLSearchParams): AlbumListParams {
  const filters: AlbumListParams = parseCatalogFilters(params, "title");
  if (params.get("artist")) filters.artist = params.get("artist")!;
  if (params.get("year_min")) filters.year_min = Number(params.get("year_min"));
  if (params.get("year_max")) filters.year_max = Number(params.get("year_max"));
  return filters;
}

export function albumFiltersToParams(filters: AlbumListParams) {
  return listParamsToParams(filters, { defaultSort: "title" });
}
