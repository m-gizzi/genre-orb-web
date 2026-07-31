export const ARTIST_SORTS = ["name", "popularity", "followers"] as const;
export const ALBUM_SORTS = ["title", "release_year", "popularity"] as const;
export const GENRE_SORTS = ["name", "track_count"] as const;
export const PLAYLIST_SORTS = ["name", "last_synced_at", "track_count"] as const;

export type ArtistSort = (typeof ARTIST_SORTS)[number];
export type AlbumSort = (typeof ALBUM_SORTS)[number];
export type GenreSort = (typeof GENRE_SORTS)[number];
export type PlaylistSort = (typeof PLAYLIST_SORTS)[number];

export function pickSort<S extends string>(
  raw: string | null,
  sorts: readonly S[],
  fallback: S
): S {
  return raw != null && (sorts as readonly string[]).includes(raw)
    ? (raw as S)
    : fallback;
}
