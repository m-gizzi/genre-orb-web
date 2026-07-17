import type {
  TrackFilters,
  Pagination,
  SearchListParams,
  CatalogListParams,
  AlbumListParams,
} from "@/api/client";

export const queryKeys = {
  libraryStatus: ["libraryStatus"] as const,
  playlists: ["playlists"] as const,
  playlistsPaged: (params: SearchListParams = {}) =>
    ["playlists", "paged", params] as const,
  likedPlaylist: ["playlists", "liked"] as const,
  artistSyncStatus: ["artistSyncStatus"] as const,

  playlist: (id: number) => ["playlist", id] as const,
  playlistTracks: (id: number, params: Pagination = {}) =>
    ["playlist", id, "tracks", params] as const,

  tracks: (filters: TrackFilters = {}) => ["tracks", filters] as const,
  track: (id: number) => ["track", id] as const,

  artists: (params: CatalogListParams = {}) => ["artists", params] as const,
  artist: (id: number) => ["artist", id] as const,

  albums: (params: AlbumListParams = {}) => ["albums", params] as const,
  album: (id: number) => ["album", id] as const,

  genres: (params: SearchListParams = {}) => ["genres", params] as const,
  genre: (id: number) => ["genre", id] as const,
};
