import { useParams } from "react-router-dom";
import { MusicIcon } from "lucide-react";
import { useTrack } from "@/hooks/useTracks";
import { PageHeader } from "@/components/layout/PageHeader";
import { ArtistLinks, AlbumLink, GenreChip, ErrorState } from "@/components/catalog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDuration, formatNumber } from "@/lib/format";

export function TrackDetailPage() {
  const { id } = useParams();
  const trackId = Number(id);
  const query = useTrack(trackId);

  if (!Number.isFinite(trackId)) {
    return (
      <ErrorState
        title="Track not found"
        description="This track doesn't exist or isn't in your library."
      />
    );
  }
  if (query.isLoading) return <Skeleton className="h-64 w-full" />;
  if (query.isError) {
    return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  }
  if (!query.data) return null;

  const track = query.data;

  return (
    <div>
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            {track.title}
            {track.explicit && <Badge variant="outline">Explicit</Badge>}
          </span>
        }
        description={<ArtistLinks artists={track.artists} />}
      />

      <div className="flex flex-col gap-6 sm:flex-row">
        {track.album?.artwork_url ? (
          <img
            src={track.album.artwork_url}
            alt={track.album.title}
            className="size-40 rounded-lg object-cover"
          />
        ) : (
          <div className="flex size-40 items-center justify-center rounded-lg bg-muted">
            <MusicIcon className="size-10 text-muted-foreground" />
          </div>
        )}

        <dl className="grid flex-1 grid-cols-2 gap-x-8 gap-y-3 text-sm sm:max-w-md">
          <div>
            <dt className="text-muted-foreground">Album</dt>
            <dd>
              <AlbumLink album={track.album} />
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Duration</dt>
            <dd className="tabular-nums">{formatDuration(track.duration_ms)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Popularity</dt>
            <dd className="tabular-nums">{formatNumber(track.popularity)}</dd>
          </div>
          {track.track_number != null && (
            <div>
              <dt className="text-muted-foreground">Track #</dt>
              <dd className="tabular-nums">{track.track_number}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="mt-8">
        <h2 className="mb-2 font-heading text-lg font-medium">Genres</h2>
        {track.genres.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {track.genres.map((genre) => (
              <GenreChip key={genre.id} genre={genre} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No genres yet — sync artist metadata from the Library page.
          </p>
        )}
      </div>

      {track.preview_url && (
        <div className="mt-8">
          <h2 className="mb-2 font-heading text-lg font-medium">Preview</h2>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <audio controls src={track.preview_url} className="w-full max-w-md" />
        </div>
      )}
    </div>
  );
}
