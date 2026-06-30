import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function SpotifyCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const success = searchParams.get("success") === "true";
    const error = searchParams.get("error");

    if (success) {
      refreshUser().then(() => {
        navigate("/", { replace: true, state: { spotifyConnected: true } });
      });
    } else {
      navigate("/", {
        replace: true,
        state: { spotifyError: error || "Failed to connect Spotify" },
      });
    }
  }, [searchParams, navigate, refreshUser]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p>Completing Spotify connection...</p>
      </div>
    </div>
  );
}
