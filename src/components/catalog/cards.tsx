import { Link } from "react-router-dom";
import { UserIcon, Disc3Icon } from "lucide-react";
import type { Artist, Album } from "@/api/client";
import { Card } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";

export function ArtistCard({ artist }: { artist: Artist }) {
  const genreText = artist.genres.map((genre) => genre.name).join(", ");
  return (
    <Link to={`/artists/${artist.id}`} className="block">
      <Card className="gap-3 p-4 text-center transition-colors hover:ring-primary/40">
        <div className="w-full">
          {artist.image_url ? (
            <img
              src={artist.image_url}
              alt={artist.name}
              loading="lazy"
              className="aspect-square w-full bg-muted object-contain"
            />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center bg-muted">
              <UserIcon className="size-10 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p
            className="line-clamp-2 min-h-[2lh] font-medium"
            title={artist.name}
          >
            {artist.name}
          </p>
          <p
            className="line-clamp-2 min-h-[2lh] text-xs text-muted-foreground"
            title={genreText || undefined}
          >
            {genreText}
          </p>
        </div>
      </Card>
    </Link>
  );
}

function trackSummary(album: Album): string {
  if (album.saved_tracks === 0 && album.total_tracks == null) return "";
  const saved = `${formatNumber(album.saved_tracks)} saved`;
  if (album.total_tracks == null) return saved;
  return `${saved}, ${formatNumber(album.total_tracks)} total`;
}

export function AlbumCard({ album }: { album: Album }) {
  const artistText = album.artists.map((a) => a.name).join(", ") || "—";
  const metaText = album.release_year
    ? `${artistText} · ${album.release_year}`
    : artistText;
  return (
    <Link to={`/albums/${album.id}`} className="block">
      <Card className="gap-3 p-4 text-center transition-colors hover:ring-primary/40">
        <div className="w-full">
          {album.artwork_url ? (
            <img
              src={album.artwork_url}
              alt={album.title}
              loading="lazy"
              className="aspect-square w-full bg-muted object-contain"
            />
          ) : (
            <div className="flex aspect-square w-full items-center justify-center bg-muted">
              <Disc3Icon className="size-10 text-muted-foreground" />
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className="line-clamp-2 min-h-[2lh] font-medium" title={album.title}>
            {album.title}
          </p>
          <p
            className="line-clamp-2 min-h-[2lh] text-xs text-muted-foreground"
            title={metaText}
          >
            {metaText}
          </p>
          <p className="min-h-[1lh] text-xs text-muted-foreground">
            {trackSummary(album)}
          </p>
        </div>
      </Card>
    </Link>
  );
}
