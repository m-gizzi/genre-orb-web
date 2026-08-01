import { Link } from "react-router-dom";
import type { ArtistSummary, AlbumSummary, TrackGenre } from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const linkClass = "hover:text-primary hover:underline underline-offset-2";

export function ArtistLink({
  artist,
  className,
}: {
  artist: Pick<ArtistSummary, "id" | "name">;
  className?: string;
}) {
  return (
    <Link to={`/artists/${artist.id}`} className={cn(linkClass, className)}>
      {artist.name}
    </Link>
  );
}

export function ArtistLinks({
  artists,
  className,
}: {
  artists: Pick<ArtistSummary, "id" | "name">[];
  className?: string;
}) {
  if (artists.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <span className={className}>
      {artists.map((artist, index) => (
        <span key={artist.id}>
          {index > 0 && ", "}
          <ArtistLink artist={artist} />
        </span>
      ))}
    </span>
  );
}

export function AlbumLink({
  album,
  className,
}: {
  album: Pick<AlbumSummary, "id" | "title"> | null;
  className?: string;
}) {
  if (!album) return <span className="text-muted-foreground">—</span>;
  return (
    <Link to={`/albums/${album.id}`} className={cn(linkClass, className)}>
      {album.title}
    </Link>
  );
}

export function GenreChip({
  genre,
}: {
  genre: Pick<TrackGenre, "genre_id" | "name"> & { source?: TrackGenre["source"] };
}) {
  const fromUser = genre.source === "user";
  return (
    <Badge
      variant={fromUser ? "outline" : "secondary"}
      title={fromUser ? "Added by you" : "From Spotify"}
      render={<Link to={`/genres/${genre.genre_id}`} />}
    >
      {genre.name}
    </Badge>
  );
}
