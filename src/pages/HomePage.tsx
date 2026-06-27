import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

export function HomePage() {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="mb-8 text-4xl font-bold">Genre Orb</h1>

      {isAuthenticated ? (
        <div className="text-center">
          <p className="mb-4 text-lg">Welcome, {user?.email}!</p>
          <Button onClick={logout} variant="outline">
            Logout
          </Button>
        </div>
      ) : (
        <div className="text-center">
          <p className="mb-4 text-muted-foreground">
            Manage your music library with smart playlists
          </p>
          <Button render={<Link to="/login" />}>Get Started</Button>
        </div>
      )}
    </div>
  );
}
