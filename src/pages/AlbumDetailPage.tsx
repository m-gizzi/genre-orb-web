import { useParams } from "react-router-dom";
import { Disc3Icon } from "lucide-react";
import { useAlbum } from "@/hooks/useAlbums";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArtistLinks,
  EmptyState,
  ErrorState,
  TrackTable,
} from "@/components/catalog";
import { formatNumber } from "@/lib/format";

export function AlbumDetailPage() {
  const { id } = useParams();
  const albumId = Number(id);
  const query = useAlbum(albumId);

  if (!Number.isFinite(albumId)) {
    return (
      <ErrorState
        title="Album not found"
        description="This album doesn't exist or isn't in your library."
      />
    );
  }
  if (query.isError) {
    return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  }
  if (query.isLoading || !query.data) {
    return <Skeleton className="h-64 w-full" />;
  }

  const album = query.data;
  const trackText =
    album.total_tracks != null
      ? `${formatNumber(album.saved_tracks)} of ${formatNumber(album.total_tracks)} tracks saved`
      : `${formatNumber(album.saved_tracks)} tracks saved`;
  const meta = [album.release_year, trackText].filter(Boolean).join(" · ");

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end">
        {album.artwork_url ? (
          <img
            src={album.artwork_url}
            alt={album.title}
            className="size-40 rounded-lg object-cover"
          />
        ) : (
          <div className="flex size-40 items-center justify-center rounded-lg bg-muted">
            <Disc3Icon className="size-10 text-muted-foreground" />
          </div>
        )}
        <div>
          <h1 className="font-heading text-2xl font-semibold">{album.title}</h1>
          <p className="mt-1 text-sm">
            <ArtistLinks artists={album.artists} />
          </p>
          {meta && <p className="mt-1 text-sm text-muted-foreground">{meta}</p>}
        </div>
      </div>

      <h2 className="mb-3 font-heading text-lg font-medium">
        Tracks in your library
      </h2>
      {album.tracks.length === 0 ? (
        <EmptyState
          title="No tracks from this album in your library"
          showOrb={false}
        />
      ) : (
        <TrackTable tracks={album.tracks} numbering="track" />
      )}
    </div>
  );
}
