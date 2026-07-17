import { Link } from "react-router-dom";
import { MusicIcon } from "lucide-react";
import type { Track } from "@/api/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatDuration, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ArtistLinks, AlbumLink, GenreChip } from "./links";

const MAX_GENRES = 3;

function AlbumThumb({ url, alt }: { url: string | null; alt: string }) {
  if (!url) {
    return (
      <div className="flex size-9 shrink-0 items-center justify-center rounded bg-muted">
        <MusicIcon className="size-4 text-muted-foreground" />
      </div>
    );
  }
  return (
    <img
      src={url}
      alt={alt}
      loading="lazy"
      className="size-9 shrink-0 rounded object-cover"
    />
  );
}

interface TrackTableProps {
  tracks: Track[];
  numbering?: "index" | "track";
  className?: string;
}

export function TrackTable({ tracks, numbering, className }: TrackTableProps) {
  return (
    <Table className={className}>
      <TableHeader>
        <TableRow>
          {numbering && <TableHead className="w-10 text-right">#</TableHead>}
          <TableHead>Title</TableHead>
          <TableHead className="hidden md:table-cell">Artists</TableHead>
          <TableHead className="hidden lg:table-cell">Album</TableHead>
          <TableHead className="hidden xl:table-cell">Genres</TableHead>
          <TableHead className="hidden sm:table-cell text-right">Pop.</TableHead>
          <TableHead className="text-right">Time</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {tracks.map((track, index) => (
          <TableRow key={track.id}>
            {numbering && (
              <TableCell className="text-right text-muted-foreground tabular-nums">
                {numbering === "track"
                  ? (track.track_number ?? index + 1)
                  : index + 1}
              </TableCell>
            )}
            <TableCell className="max-w-xs">
              <div className="flex items-center gap-2">
                <Link
                  to={`/tracks/${track.id}`}
                  className="truncate font-medium hover:text-primary hover:underline"
                >
                  {track.title}
                </Link>
                {track.explicit && (
                  <Badge variant="outline" className="shrink-0" title="Explicit">
                    E
                  </Badge>
                )}
              </div>
              <div className="truncate text-xs text-muted-foreground md:hidden">
                <ArtistLinks artists={track.artists} />
              </div>
            </TableCell>
            <TableCell className="hidden max-w-[16rem] truncate md:table-cell">
              <ArtistLinks artists={track.artists} />
            </TableCell>
            <TableCell className="hidden lg:table-cell">
              <div className="flex items-center gap-2">
                <AlbumThumb
                  url={track.album?.artwork_url ?? null}
                  alt={track.album?.title ?? ""}
                />
                <span className="max-w-[12rem] truncate">
                  <AlbumLink album={track.album} />
                </span>
              </div>
            </TableCell>
            <TableCell className="hidden xl:table-cell">
              <div className="flex flex-wrap gap-1">
                {track.genres.slice(0, MAX_GENRES).map((genre) => (
                  <GenreChip key={genre.id} genre={genre} />
                ))}
                {track.genres.length > MAX_GENRES && (
                  <span className="text-xs text-muted-foreground">
                    +{track.genres.length - MAX_GENRES}
                  </span>
                )}
              </div>
            </TableCell>
            <TableCell
              className={cn(
                "hidden text-right tabular-nums text-muted-foreground sm:table-cell"
              )}
            >
              {formatNumber(track.popularity)}
            </TableCell>
            <TableCell className="text-right tabular-nums text-muted-foreground">
              {formatDuration(track.duration_ms)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
