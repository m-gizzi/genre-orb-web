import type {
  AlbumListParams,
  CatalogListParams,
  SearchListParams,
} from "@/api/client";
import { DEFAULT_CARD_PER_PAGE, DEFAULT_GENRE_PER_PAGE } from "@/lib/config";
import { toNumber } from "@/lib/parse";
import {
  ALBUM_SORTS,
  ARTIST_SORTS,
  GENRE_SORTS,
  PLAYLIST_SORTS,
  pickSort,
  type AlbumSort,
  type ArtistSort,
  type GenreSort,
  type PlaylistSort,
} from "@/lib/sorts";

interface ParseOptions<S extends string> {
  sorts: readonly S[];
  defaultSort: S;
  defaultPerPage?: number;
}

interface SerializeOptions {
  defaultSort: string;
  defaultPerPage?: number;
}

export type Parsed<T, S extends string> = T & {
  sort: S;
  order: "asc" | "desc";
  page: number;
  per_page: number;
};

export function parseListParams<S extends string>(
  params: URLSearchParams,
  { sorts, defaultSort, defaultPerPage = DEFAULT_CARD_PER_PAGE }: ParseOptions<S>,
): Parsed<SearchListParams, S> {
  const search = params.get("search");
  const page = toNumber(params.get("page") ?? "");
  const perPage = toNumber(params.get("per_page") ?? "");

  const filters: Parsed<SearchListParams, S> = {
    sort: pickSort(params.get("sort"), sorts, defaultSort),
    order: params.get("order") === "desc" ? "desc" : "asc",
    page: page ?? 1,
    per_page: perPage ?? defaultPerPage,
  };
  if (search) filters.search = search;
  return filters;
}

export function listParamsToParams<T extends object>(
  filters: T,
  { defaultSort, defaultPerPage = DEFAULT_CARD_PER_PAGE }: SerializeOptions,
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

function parseCatalogFilters<S extends string>(
  params: URLSearchParams,
  options: ParseOptions<S>,
): Parsed<CatalogListParams, S> {
  const filters: Parsed<CatalogListParams, S> = parseListParams(params, options);
  const genre = params.get("genre");
  if (genre) filters.genre = genre;
  return filters;
}

const ARTIST_OPTIONS = { sorts: ARTIST_SORTS, defaultSort: "name" } as const;
const ALBUM_OPTIONS = { sorts: ALBUM_SORTS, defaultSort: "title" } as const;
const PLAYLIST_OPTIONS = { sorts: PLAYLIST_SORTS, defaultSort: "name" } as const;
const GENRE_OPTIONS = {
  sorts: GENRE_SORTS,
  defaultSort: "name",
  defaultPerPage: DEFAULT_GENRE_PER_PAGE,
} as const;

export type ArtistFilters = Parsed<CatalogListParams, ArtistSort>;
export type AlbumFilters = Parsed<AlbumListParams, AlbumSort>;
export type PlaylistFilters = Parsed<SearchListParams, PlaylistSort>;
export type GenreFilters = Parsed<SearchListParams, GenreSort>;

export function parseArtistFilters(params: URLSearchParams): ArtistFilters {
  return parseCatalogFilters(params, ARTIST_OPTIONS);
}

export function artistFiltersToParams(filters: CatalogListParams) {
  return listParamsToParams(filters, ARTIST_OPTIONS);
}

export function parseAlbumFilters(params: URLSearchParams): AlbumFilters {
  const filters: AlbumFilters = parseCatalogFilters(params, ALBUM_OPTIONS);
  const artist = params.get("artist");
  if (artist) filters.artist = artist;
  const yearMin = toNumber(params.get("year_min") ?? "");
  if (yearMin != null) filters.year_min = yearMin;
  const yearMax = toNumber(params.get("year_max") ?? "");
  if (yearMax != null) filters.year_max = yearMax;
  return filters;
}

export function albumFiltersToParams(filters: AlbumListParams) {
  return listParamsToParams(filters, ALBUM_OPTIONS);
}

export function parsePlaylistFilters(params: URLSearchParams): PlaylistFilters {
  return parseListParams(params, PLAYLIST_OPTIONS);
}

export function playlistFiltersToParams(filters: SearchListParams) {
  return listParamsToParams(filters, PLAYLIST_OPTIONS);
}

export function parseGenreFilters(params: URLSearchParams): GenreFilters {
  return parseListParams(params, GENRE_OPTIONS);
}

export function genreFiltersToParams(filters: SearchListParams) {
  return listParamsToParams(filters, GENRE_OPTIONS);
}
