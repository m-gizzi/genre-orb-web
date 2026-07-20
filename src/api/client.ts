import ky, { HTTPError } from "ky";
import { API_URL, SPOTIFY_CALLBACK_PATH } from "@/lib/config";

export { API_URL };

export async function extractApiError(
  error: unknown,
  fallback = "Something went wrong"
): Promise<string> {
  if (error instanceof HTTPError) {
    const cache = error as { parsedApiMessage?: string };
    if (cache.parsedApiMessage) return cache.parsedApiMessage;
    try {
      const body = (await error.response.clone().json()) as {
        errors?: Array<{ message?: string }>;
        error?: string;
      };
      const message = body?.errors?.[0]?.message ?? body?.error;
      if (message) {
        cache.parsedApiMessage = message;
        return message;
      }
    } catch {
      // Response body wasn't JSON; fall back below.
    }
    return error.response.statusText || fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export const api = ky.create({
  prefix: API_URL,
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  hooks: {
    beforeError: [
      async ({ error }) => {
        error.message = await extractApiError(error, error.message);
        return error;
      },
    ],
  },
});

export interface PaginationMeta {
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface ApiCollection<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ApiResource<T> {
  data: T;
}

function cleanParams(
  params: object = {}
): Record<string, string | number | boolean> {
  const cleaned: Record<string, string | number | boolean> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      cleaned[key] = value as string | number | boolean;
    }
  }
  return cleaned;
}

export interface SpotifyProfile {
  display_name: string;
  email: string;
  images: Array<{ url: string }>;
  country: string;
  product: string;
}

export interface User {
  id: number;
  email: string;
  spotify_connected: boolean;
  spotify_profile?: SpotifyProfile;
}

export interface AuthResponse {
  message: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials extends LoginCredentials {
  password_confirmation: string;
}

export interface Playlist {
  id: number;
  name: string;
  spotify_id: string | null;
  is_liked_songs: boolean;
  is_public: boolean;
  track_count: number;
  sync_enabled: boolean;
  last_synced_at: string | null;
  available_on_spotify: boolean;
}

export interface ArtistSummary {
  id: number;
  name: string;
  spotify_id: string;
  image_url: string | null;
}

export interface AlbumSummary {
  id: number;
  title: string;
  spotify_id: string;
  release_year: number | null;
  artwork_url: string | null;
}

export type GenreSource = "spotify" | "user";

export interface TrackGenre {
  id: number;
  genre_id: number;
  name: string;
  source: GenreSource;
}

export interface Track {
  id: number;
  title: string;
  spotify_id: string;
  duration_ms: number | null;
  track_number: number | null;
  explicit: boolean;
  popularity: number | null;
  preview_url: string | null;
  album: AlbumSummary | null;
  artists: ArtistSummary[];
  genres: TrackGenre[];
}

export interface Artist {
  id: number;
  name: string;
  spotify_id: string;
  image_url: string | null;
  genres: Genre[];
  followers: number | null;
  popularity: number | null;
}

export interface ArtistDetail extends Artist {
  albums: Album[];
}

export interface Album {
  id: number;
  title: string;
  spotify_id: string;
  release_year: number | null;
  artwork_url: string | null;
  total_tracks: number | null;
  saved_tracks: number;
  artists: ArtistSummary[];
}

export interface AlbumDetail extends Album {
  tracks: Track[];
}

export interface Genre {
  id: number;
  name: string;
}

export interface PlaylistCurrentVersion {
  id: number;
  version_number: number;
  track_count: number;
  status: string;
}

export interface PlaylistDetail extends Playlist {
  current_version: PlaylistCurrentVersion | null;
}

export type TrackSort =
  | "title"
  | "artist"
  | "album"
  | "year"
  | "popularity"
  | "duration";

export interface TrackFilters {
  genre?: string;
  artist?: string;
  album?: string;
  year?: number;
  year_min?: number;
  year_max?: number;
  duration_min?: number;
  duration_max?: number;
  title?: string;
  explicit?: boolean;
  sort?: TrackSort;
  order?: "asc" | "desc";
  page?: number;
  per_page?: number;
}

export interface Pagination {
  page?: number;
  per_page?: number;
}

export interface Sortable {
  sort?: string;
  order?: "asc" | "desc";
}

export interface SearchListParams extends Pagination, Sortable {
  search?: string;
}

export interface CatalogListParams extends SearchListParams {
  genre?: string;
}

export interface AlbumListParams extends CatalogListParams {
  artist?: string;
  year_min?: number;
  year_max?: number;
}

export type SyncSessionStatus =
  | "pending"
  | "running"
  | "completed"
  | "completed_with_errors"
  | "failed";

export const TERMINAL_SYNC_STATUSES: SyncSessionStatus[] = [
  "completed",
  "completed_with_errors",
  "failed",
];

export type SyncPlaylistStatus =
  | "pending"
  | "fetching_pages"
  | "completed"
  | "failed"
  | "skipped";

export interface SyncProgress {
  total: number;
  completed: number;
  percent: number;
}

export interface LibrarySyncProgress extends SyncProgress {
  skipped: number;
  failed: number;
}

export interface SyncSessionPlaylist {
  playlist_id: number;
  playlist_name: string;
  status: SyncPlaylistStatus;
  page_progress: { total: number; completed: number };
  error_message: string | null;
}

export interface SyncSession {
  id: number;
  status: SyncSessionStatus;
  progress: LibrarySyncProgress;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  playlists: SyncSessionPlaylist[];
}

export interface LibraryStatus {
  has_active_sync: boolean;
  current_session: SyncSession | null;
  rate_limited: boolean;
  rate_limit_resume_at: string | null;
  playlists_metadata_fetched_at: string | null;
  playlists_metadata_error: string | null;
}

export interface ArtistMetadataSession {
  id: number;
  status: SyncSessionStatus;
  progress: SyncProgress;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface ArtistSyncStatus {
  has_active_sync: boolean;
  current_session: ArtistMetadataSession | null;
  rate_limited: boolean;
  rate_limit_resume_at: string | null;
  artists_total: number;
  artists_synced: number;
}

export const authApi = {
  login: (credentials: LoginCredentials) =>
    api.post("auth/login", { json: { user: credentials } }).json<AuthResponse>(),

  signup: (credentials: SignupCredentials) =>
    api.post("auth/signup", { json: { user: credentials } }).json<AuthResponse>(),

  logout: () => api.delete("auth/logout").json<{ message: string }>(),

  me: () => api.get("auth/me").json<{ user: User }>(),
};

export const spotifyApi = {
  disconnect: () => api.delete("auth/spotify").json<{ message: string }>(),

  connect: (callbackPath: string = SPOTIFY_CALLBACK_PATH) => {
    const callbackUrl = `${window.location.origin}${callbackPath}`;

    const form = document.createElement("form");
    form.method = "POST";
    form.action = `${API_URL}/auth/spotify`;

    const originInput = document.createElement("input");
    originInput.type = "hidden";
    originInput.name = "origin";
    originInput.value = callbackUrl;
    form.appendChild(originInput);

    document.body.appendChild(form);
    form.submit();
  },
};

export const libraryApi = {
  getStatus: () =>
    api
      .get("api/v1/library/status")
      .json<ApiResource<LibraryStatus>>()
      .then((r) => r.data),

  fetchPlaylists: () =>
    api
      .post("api/v1/library/fetch_playlists")
      .json<ApiResource<{ status: string }>>()
      .then((r) => r.data),

  sync: () =>
    api
      .post("api/v1/library/sync")
      .json<ApiResource<{ status: string; session: SyncSession }>>()
      .then((r) => r.data),
};

export const playlistsApi = {
  list: () =>
    api
      .get("api/v1/playlists", { searchParams: { per_page: 100 } })
      .json<ApiCollection<Playlist>>()
      .then((r) => r.data),

  paginated: (params: SearchListParams = {}) =>
    api
      .get("api/v1/playlists", { searchParams: cleanParams(params) })
      .json<ApiCollection<Playlist>>(),

  liked: () =>
    api
      .get("api/v1/playlists/liked")
      .json<ApiResource<Playlist | null>>()
      .then((r) => r.data),

  get: (id: number) =>
    api
      .get(`api/v1/playlists/${id}`)
      .json<ApiResource<PlaylistDetail>>()
      .then((r) => r.data),

  tracks: (id: number, params: Pagination = {}) =>
    api
      .get(`api/v1/playlists/${id}/tracks`, { searchParams: cleanParams(params) })
      .json<ApiCollection<Track>>(),

  update: (id: number, data: { sync_enabled: boolean }) =>
    api
      .patch(`api/v1/playlists/${id}`, { json: { playlist: data } })
      .json<ApiResource<Playlist>>()
      .then((r) => r.data),
};

export const artistsApi = {
  list: (params: CatalogListParams = {}) =>
    api
      .get("api/v1/artists", { searchParams: cleanParams(params) })
      .json<ApiCollection<Artist>>(),

  get: (id: number) =>
    api
      .get(`api/v1/artists/${id}`)
      .json<ApiResource<ArtistDetail>>()
      .then((r) => r.data),

  getSyncStatus: () =>
    api
      .get("api/v1/artists/sync_status")
      .json<ApiResource<ArtistSyncStatus>>()
      .then((r) => r.data),

  sync: (options?: { syncAll?: boolean }) =>
    api
      .post("api/v1/artists/sync", {
        json: options?.syncAll ? { sync_all: true } : undefined,
      })
      .json<ApiResource<{ status: string; session: ArtistMetadataSession }>>()
      .then((r) => r.data),
};

export const tracksApi = {
  list: (filters: TrackFilters = {}) =>
    api
      .get("api/v1/tracks", { searchParams: cleanParams(filters) })
      .json<ApiCollection<Track>>(),

  get: (id: number) =>
    api
      .get(`api/v1/tracks/${id}`)
      .json<ApiResource<Track>>()
      .then((r) => r.data),
};

export const albumsApi = {
  list: (params: AlbumListParams = {}) =>
    api
      .get("api/v1/albums", { searchParams: cleanParams(params) })
      .json<ApiCollection<Album>>(),

  get: (id: number) =>
    api
      .get(`api/v1/albums/${id}`)
      .json<ApiResource<AlbumDetail>>()
      .then((r) => r.data),
};

export const genresApi = {
  list: (params: SearchListParams = {}) =>
    api
      .get("api/v1/genres", { searchParams: cleanParams(params) })
      .json<ApiCollection<Genre>>(),

  get: (id: number) =>
    api
      .get(`api/v1/genres/${id}`)
      .json<ApiResource<Genre>>()
      .then((r) => r.data),
};
