import ky from "ky";

export const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:3000";

export const api = ky.create({
  prefix: API_URL,
  credentials: "include",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

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

export interface SyncSessionPlaylist {
  playlist_id: number;
  playlist_name: string;
  status: "pending" | "fetching_pages" | "completed" | "failed";
  page_progress: { total: number; completed: number };
}

export interface SyncSession {
  id: number;
  status:
    | "pending"
    | "running"
    | "paused"
    | "completed"
    | "failed"
    | "cancelled";
  progress: { total: number; completed: number; percent: number };
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
}

export interface ArtistMetadataSession {
  id: number;
  status: "pending" | "running" | "completed" | "failed";
  progress: { total: number; completed: number; percent: number };
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

  connect: (callbackPath: string = "/spotify/callback") => {
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
  getStatus: () => api.get("api/v1/library/status").json<LibraryStatus>(),

  fetchPlaylists: () =>
    api.post("api/v1/library/fetch_playlists").json<{ status: string }>(),

  sync: () => api.post("api/v1/library/sync").json<{ status: string }>(),
};

export const playlistsApi = {
  list: () => api.get("api/v1/playlists").json<Playlist[]>(),

  update: (id: number, data: { sync_enabled: boolean }) =>
    api
      .patch(`api/v1/playlists/${id}`, { json: { playlist: data } })
      .json<Playlist>(),
};

export const artistsApi = {
  getSyncStatus: () =>
    api.get("api/v1/artists/sync_status").json<ArtistSyncStatus>(),

  sync: (options?: { syncAll?: boolean }) =>
    api
      .post("api/v1/artists/sync", {
        json: options?.syncAll ? { sync_all: true } : undefined,
      })
      .json<{ status: string }>(),
};
