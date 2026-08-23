import ky, { HTTPError } from "ky";
import { API_URL, SPOTIFY_CALLBACK_PATH } from "@/lib/config";

export { API_URL };

const ALL_MESSAGES = Symbol("apiErrorMessages");

type WithMessages = { [ALL_MESSAGES]?: string[] };

export function withApiErrorMessages<E>(error: E, messages: string[]): E {
  if (error && typeof error === "object") {
    (error as WithMessages)[ALL_MESSAGES] = messages;
  }
  return error;
}

export async function extractApiError(
  error: unknown,
  fallback = "Something went wrong"
): Promise<string> {
  if (error instanceof HTTPError) {
    try {
      const body = (await error.response.clone().json()) as {
        errors?: Array<{ message?: string }>;
        error?: string;
      };
      const messages = (body?.errors ?? [])
        .map((entry) => entry?.message)
        .filter((message): message is string => Boolean(message));
      if (messages.length === 0 && body?.error) messages.push(body.error);

      if (messages.length > 0) {
        withApiErrorMessages(error, messages);
        return messages[0]!;
      }
    } catch {
      // Response body wasn't JSON; fall back below.
    }
    return error.response.statusText || fallback;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

export function apiErrorMessage(
  error: unknown,
  fallback = "Something went wrong"
): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export function apiErrorMessages(
  error: unknown,
  fallback = "Something went wrong"
): string[] {
  const stashed =
    error && typeof error === "object"
      ? (error as WithMessages)[ALL_MESSAGES]
      : undefined;

  return stashed?.length ? stashed : [apiErrorMessage(error, fallback)];
}

export const api = ky.create({
  prefix: API_URL,
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    // A free ngrok tunnel answers browser-looking requests with its interstitial
    // warning page instead of forwarding them, which reaches us as HTML where
    // JSON should be. Ignored by every other host.
    "ngrok-skip-browser-warning": "true",
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
  spotify_needs_reauth: boolean;
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
  description: string | null;
  spotify_id: string | null;
  is_liked_songs: boolean;
  track_count: number;
  sync_enabled: boolean;
  last_synced_at: string | null;
  available_on_spotify: boolean;
  is_smart: boolean;
  smart_playlist_id: number | null;
}

export interface PlaylistSummary {
  id: number;
  name: string;
  spotify_id: string | null;
  sync_enabled: boolean;
  track_count: number;
  is_liked_songs: boolean;
}

export type RuleMatch = "all" | "any";
export type RelativeUnit = "days" | "weeks" | "months" | "years";
export type RuleScalar = string | number | boolean;

export interface RelativeValue {
  count: number;
  unit: RelativeUnit;
}

export type RuleValue = RuleScalar | RuleScalar[] | RelativeValue | null;

export interface RuleCondition {
  field: string;
  operator: string;
  value: RuleValue;
}

export interface RuleGroup {
  match: RuleMatch;
  rules: Array<RuleCondition | RuleGroup>;
  not?: boolean;
}

export type RuleArity = "one" | "two" | "many" | "relative" | "none";
export type RuleValueType =
  | "text"
  | "number"
  | "duration"
  | "boolean"
  | "date"
  | "playlist";

export interface RuleOperatorSpec {
  key: string;
  label: string;
}

export interface RuleConstraints {
  min?: number;
  max?: number;
  max_length?: number;
}

export interface RuleFieldSpec {
  key: string;
  label: string;
  value_type: RuleValueType;
  suggest: RuleSuggestSource | null;
  constraints: RuleConstraints;
  operators: RuleOperatorSpec[];
}

export type RuleSuggestSource = "genres" | "artists" | "albums" | "playlists";

export interface RuleSchema {
  max_depth: number;
  max_nodes: number;
  max_string_length: number;
  max_list_size: number;
  match_types: RuleMatch[];
  relative_units: RelativeUnit[];
  operators: Record<string, { arity: RuleArity }>;
  fields: RuleFieldSpec[];
}

export interface SmartPlaylist {
  id: number;
  name: string;
  is_enabled: boolean;
  is_ready: boolean;
  rules: RuleGroup;
  match_count: number;
  source_count: number;
  target_playlist: Playlist;
  last_evaluated_at: string | null;
  last_pushed_at: string | null;
}

export interface SmartPlaylistDetail extends SmartPlaylist {
  source_playlists: PlaylistSummary[];
  rule_playlists: PlaylistSummary[];
}

export interface NewPlaylistAttributes {
  name: string;
  description?: string;
}

export interface PlaylistUpdate {
  name?: string;
  description?: string | null;
  sync_enabled?: boolean;
}

export interface CreateSmartPlaylistInput {
  target_playlist_id?: number;
  target_playlist_attributes?: NewPlaylistAttributes;
  source_playlist_ids: number[];
}

export interface UpdateSmartPlaylistInput {
  is_enabled?: boolean;
  rules?: RuleGroup;
  source_playlist_ids?: number[];
}

export interface RuleMatchesMeta extends PaginationMeta {
  source_track_count: number;
  /** Set only when the run was recorded, which happens exactly when the rules
   *  evaluated were the playlist's own saved, non-empty set. */
  evaluated_at: string | null;
}

export interface RuleMatches {
  data: Track[];
  meta: RuleMatchesMeta;
}

export interface EvaluateRulesParams extends Pagination {
  /** Omit to evaluate the saved rules; pass a draft to try unsaved edits. */
  rules?: RuleGroup;
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

export type GenreSource = "spotify" | "musicbrainz" | "lastfm" | "user";

export interface SourcedGenre {
  genre_id: number;
  name: string;
  source: GenreSource;
  confidence: number;
}

export type ConfigurableGenreSource = "spotify" | "musicbrainz" | "lastfm";

export const CONFIGURABLE_GENRE_SOURCES: ConfigurableGenreSource[] = [
  "spotify",
  "musicbrainz",
  "lastfm",
];

export interface GenreSourceSetting {
  enabled: boolean;
  min_confidence: number;
}

export interface GenrePreferences {
  sources: Record<ConfigurableGenreSource, GenreSourceSetting>;
  blocked_genres: { id: number; name: string }[];
}

export interface GenrePreferencesUpdate {
  sources?: Partial<Record<ConfigurableGenreSource, Partial<GenreSourceSetting>>>;
  blocked_genre_ids?: number[];
}

export type GenreOverrideAction = "hidden" | "added";

/** Name a genre that may not exist yet, or point at one that does. */
export interface GenreOverrideInput {
  genre_id?: number;
  name?: string;
  action: GenreOverrideAction;
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
  genres: SourcedGenre[];
}

export interface Artist {
  id: number;
  name: string;
  spotify_id: string;
  image_url: string | null;
  genres: SourcedGenre[];
  followers: number | null;
  popularity: number | null;
}

export type MetadataSourceState = "pending" | "matched" | "unmatched" | "errored";

export interface ArtistMetadataSource {
  source: EnrichmentSource;
  state: MetadataSourceState;
  external_id: string | null;
  external_url: string | null;
  fetched_at: string | null;
}

export interface ArtistDetail extends Artist {
  albums: Album[];
  metadata_sources: ArtistMetadataSource[];
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
  blocked: boolean;
}

/** Whether any of your smart playlists' rules names the genre. */
export type RuleUsage = "used" | "unused";

export interface GenreListParams extends SearchListParams {
  include_blocked?: boolean;
  rule_usage?: RuleUsage;
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

export interface PlaylistGenre extends Genre {
  track_count: number;
}

export interface PlaylistTrackParams extends Pagination {
  genre?: number;
}

export const TRACK_SORTS = [
  "title",
  "artist",
  "album",
  "year",
  "popularity",
  "duration",
] as const;

export type TrackSort = (typeof TRACK_SORTS)[number];

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

export interface PlaylistListParams extends SearchListParams {
  sync_enabled?: boolean;
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

export type SessionTrigger = "scheduled" | "manual";

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
  trigger: SessionTrigger;
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
  needs_reauth: boolean;
  next_scheduled_run_at: string;
}

export interface ArtistMetadataSession {
  id: number;
  status: SyncSessionStatus;
  trigger: SessionTrigger;
  progress: SyncProgress;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
}

export interface EnrichmentCoverage {
  total: number;
  fetched: number;
  matched: number;
  unmatched: number;
  errored: number;
  pending: number;
}

export type EnrichmentSource = "musicbrainz" | "lastfm";

export const ENRICHMENT_SOURCES: EnrichmentSource[] = ["musicbrainz", "lastfm"];

export const EMPTY_ENRICHMENT_COVERAGE: Record<EnrichmentSource, EnrichmentCoverage> = {
  musicbrainz: { total: 0, fetched: 0, matched: 0, unmatched: 0, errored: 0, pending: 0 },
  lastfm: { total: 0, fetched: 0, matched: 0, unmatched: 0, errored: 0, pending: 0 },
};

export interface ArtistSyncStatus {
  has_active_sync: boolean;
  current_session: ArtistMetadataSession | null;
  rate_limited: boolean;
  rate_limit_resume_at: string | null;
  artists_total: number;
  artists_synced: number;
  needs_reauth: boolean;
  enrichment: Record<EnrichmentSource, EnrichmentCoverage>;
}

export type PushSessionStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "skipped";

export type SessionStatus = SyncSessionStatus | PushSessionStatus;

export type PushStrategy = "diff" | "replace";

export interface PushSession {
  id: number;
  status: PushSessionStatus;
  trigger: SessionTrigger;
  progress: SyncProgress;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  smart_playlist_id: number;
  smart_playlist_name: string;
  strategy: PushStrategy;
  tracks_added: number;
  tracks_removed: number;
  match_count: number;
  sampled: boolean;
}

export interface PushStatus {
  active_pushes: PushSession[];
  recent_pushes: PushSession[];
  rate_limited: boolean;
  rate_limit_resume_at: string | null;
  needs_reauth: boolean;
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
      .json<ApiResource<{ session: SyncSession }>>()
      .then((r) => r.data),
};

export const playlistsApi = {
  paginated: (params: PlaylistListParams = {}) =>
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

  tracks: (id: number, params: PlaylistTrackParams = {}) =>
    api
      .get(`api/v1/playlists/${id}/tracks`, { searchParams: cleanParams(params) })
      .json<ApiCollection<Track>>(),

  genres: (id: number, params: GenreListParams = {}) =>
    api
      .get(`api/v1/playlists/${id}/genres`, { searchParams: cleanParams(params) })
      .json<ApiCollection<PlaylistGenre>>(),

  create: (data: NewPlaylistAttributes) =>
    api
      .post("api/v1/playlists", { json: { playlist: data } })
      .json<ApiResource<Playlist>>()
      .then((r) => r.data),

  update: (id: number, data: PlaylistUpdate) =>
    api
      .patch(`api/v1/playlists/${id}`, { json: { playlist: data } })
      .json<ApiResource<Playlist>>()
      .then((r) => r.data),
};

export const smartPlaylistsApi = {
  paginated: (params: SearchListParams = {}) =>
    api
      .get("api/v1/smart_playlists", { searchParams: cleanParams(params) })
      .json<ApiCollection<SmartPlaylist>>(),

  get: (id: number) =>
    api
      .get(`api/v1/smart_playlists/${id}`)
      .json<ApiResource<SmartPlaylistDetail>>()
      .then((r) => r.data),

  create: (data: CreateSmartPlaylistInput) =>
    api
      .post("api/v1/smart_playlists", { json: { smart_playlist: data } })
      .json<ApiResource<SmartPlaylistDetail>>()
      .then((r) => r.data),

  update: (id: number, data: UpdateSmartPlaylistInput) =>
    api
      .patch(`api/v1/smart_playlists/${id}`, { json: { smart_playlist: data } })
      .json<ApiResource<SmartPlaylistDetail>>()
      .then((r) => r.data),

  remove: (id: number) => api.delete(`api/v1/smart_playlists/${id}`).then(() => undefined),

  evaluate: (id: number, { rules, ...page }: EvaluateRulesParams = {}) =>
    api
      .post(`api/v1/smart_playlists/${id}/evaluate`, {
        searchParams: cleanParams(page),
        json: { smart_playlist: rules ? { rules } : {} },
      })
      .json<RuleMatches>(),

  schema: () =>
    api
      .get("api/v1/smart_playlists/schema")
      .json<ApiResource<RuleSchema>>()
      .then((r) => r.data),

  push: (id: number) =>
    api
      .post(`api/v1/smart_playlists/${id}/push`)
      .json<ApiResource<{ session: PushSession }>>()
      .then((r) => r.data),

  pushStatus: () =>
    api
      .get("api/v1/smart_playlists/push_status")
      .json<ApiResource<PushStatus>>()
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
      .json<ApiResource<{ session: ArtistMetadataSession }>>()
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
  list: (params: GenreListParams = {}) =>
    api
      .get("api/v1/genres", { searchParams: cleanParams(params) })
      .json<ApiCollection<Genre>>(),

  get: (id: number) =>
    api
      .get(`api/v1/genres/${id}`)
      .json<ApiResource<Genre>>()
      .then((r) => r.data),
};

export const genrePreferencesApi = {
  get: () =>
    api
      .get("api/v1/genre_preferences")
      .json<ApiResource<GenrePreferences>>()
      .then((r) => r.data),

  update: (genre_preferences: GenrePreferencesUpdate) =>
    api
      .patch("api/v1/genre_preferences", { json: { genre_preferences } })
      .json<ApiResource<GenrePreferences>>()
      .then((r) => r.data),
};

function genreOverrides(resource: "tracks" | "artists") {
  return {
    set: (id: number, genre: GenreOverrideInput) =>
      api
        .post(`api/v1/${resource}/${id}/genres`, { json: { genre } })
        .json<ApiResource<SourcedGenre[]>>()
        .then((r) => r.data),

    clear: (id: number, genreId: number) =>
      api
        .delete(`api/v1/${resource}/${id}/genres/${genreId}`)
        .json<ApiResource<SourcedGenre[]>>()
        .then((r) => r.data),
  };
}

export const trackGenresApi = genreOverrides("tracks");
export const artistGenresApi = genreOverrides("artists");
