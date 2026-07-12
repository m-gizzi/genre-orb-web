import type { TrackFilters, PageParams } from "@/api/client";

export const queryKeys = {
  libraryStatus: ["libraryStatus"] as const,
  playlists: ["playlists"] as const,
  artistSyncStatus: ["artistSyncStatus"] as const,

  playlist: (id: number) => ["playlist", id] as const,
  playlistTracks: (id: number, params: PageParams = {}) =>
    ["playlist", id, "tracks", params] as const,

  tracks: (filters: TrackFilters = {}) => ["tracks", filters] as const,
  track: (id: number) => ["track", id] as const,

  artists: (params: PageParams = {}) => ["artists", params] as const,
  artist: (id: number) => ["artist", id] as const,

  albums: (params: PageParams = {}) => ["albums", params] as const,
  album: (id: number) => ["album", id] as const,

  genres: (params: PageParams = {}) => ["genres", params] as const,
};
