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
