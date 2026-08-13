import { Link } from "react-router-dom";
import type { ArtistSummary, AlbumSummary } from "@/api/client";
import { Badge } from "@/components/ui/badge";
import { describeSources, type GroupedGenre } from "@/lib/genres";
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

export function GenreChip({ genre }: { genre: GroupedGenre }) {
  const { sources } = genre;
  const fromUserOnly = sources.length === 1 && sources[0] === "user";
  const corroborated = sources.length > 1;

  return (
    <Badge
      variant={fromUserOnly ? "outline" : "secondary"}
      title={describeSources(sources)}
      className={cn(corroborated && "ring-1 ring-inset ring-primary/30")}
      render={<Link to={`/genres/${genre.genre_id}`} />}
    >
      {genre.name}
      {corroborated && (
        <span aria-hidden="true" className="ml-1 text-[0.65rem] tabular-nums opacity-60">
          {sources.length}
        </span>
      )}
    </Badge>
  );
}
