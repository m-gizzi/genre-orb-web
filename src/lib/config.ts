export const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:3000";

export const SPOTIFY_CALLBACK_PATH = "/spotify/callback";

export const QUERY_STALE_TIME_MS = 1000 * 60 * 5;
export const QUERY_RETRY = 1;

export const POLL_INTERVAL_MS = 2000;
export const SYNC_START_TIMEOUT_MS = 15_000;
export const METADATA_FETCH_TIMEOUT_MS = 30_000;

export const MESSAGE_TIMEOUT_MS = 5_000;
