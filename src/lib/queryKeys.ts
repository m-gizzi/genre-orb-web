import type {
  TrackFilters,
  Pagination,
  SearchListParams,
  PlaylistListParams,
  CatalogListParams,
  AlbumListParams,
} from "@/api/client";

const roots = {
  libraryStatus: "libraryStatus",
  artistSyncStatus: "artistSyncStatus",
  playlists: "playlists",
  playlist: "playlist",
  smartPlaylists: "smartPlaylists",
  smartPlaylist: "smartPlaylist",
  tracks: "tracks",
  track: "track",
  artists: "artists",
  artist: "artist",
  albums: "albums",
  album: "album",
  genres: "genres",
  genre: "genre",
} as const;

export const CATALOG_QUERY_ROOTS: readonly string[] = [
  roots.playlists,
  roots.playlist,
  roots.smartPlaylists,
  roots.smartPlaylist,
  roots.tracks,
  roots.track,
  roots.artists,
  roots.artist,
  roots.albums,
  roots.album,
  roots.genres,
  roots.genre,
];

export const queryKeys = {
  libraryStatus: [roots.libraryStatus] as const,
  playlists: [roots.playlists] as const,
  playlistsPaged: (params: PlaylistListParams = {}) =>
    [roots.playlists, "paged", params] as const,
  playlistsInfinite: (search: string) =>
    [roots.playlists, "infinite", search] as const,
  likedPlaylist: [roots.playlists, "liked"] as const,
  artistSyncStatus: [roots.artistSyncStatus] as const,

  smartPlaylists: [roots.smartPlaylists] as const,
  smartPlaylistsPaged: (params: SearchListParams = {}) =>
    [roots.smartPlaylists, "paged", params] as const,
  smartPlaylist: (id: number) => [roots.smartPlaylist, id] as const,

  playlist: (id: number) => [roots.playlist, id] as const,
  playlistTracks: (id: number, params: Pagination = {}) =>
    [roots.playlist, id, "tracks", params] as const,

  tracks: (filters: TrackFilters = {}) => [roots.tracks, filters] as const,
  track: (id: number) => [roots.track, id] as const,

  artists: (params: CatalogListParams = {}) => [roots.artists, params] as const,
  artist: (id: number) => [roots.artist, id] as const,

  albums: (params: AlbumListParams = {}) => [roots.albums, params] as const,
  album: (id: number) => [roots.album, id] as const,

  genres: (params: SearchListParams = {}) => [roots.genres, params] as const,
  genre: (id: number) => [roots.genre, id] as const,
};
