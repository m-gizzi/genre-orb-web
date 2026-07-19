import { Link, useParams } from "react-router-dom";
import { useGenre } from "@/hooks/useGenres";
import { useTracks } from "@/hooks/useTracks";
import { useArtists } from "@/hooks/useArtists";
import { useAlbums } from "@/hooks/useAlbums";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlbumCard,
  ArtistCard,
  EmptyState,
  ErrorState,
  TableSkeleton,
  TrackTable,
} from "@/components/catalog";
import { formatNumber } from "@/lib/format";

const FACET_LIMIT = 12;

export function GenreDetailPage() {
  const { id } = useParams();
  const genreId = Number(id);

  const genre = useGenre(genreId);
  const tracks = useTracks({
    genre: String(genreId),
    per_page: 10,
    sort: "popularity",
    order: "desc",
  });
  const artists = useArtists({
    genre: genreId,
    per_page: FACET_LIMIT,
    sort: "popularity",
    order: "desc",
  });
  const albums = useAlbums({
    genre: genreId,
    per_page: FACET_LIMIT,
    sort: "popularity",
    order: "desc",
  });

  if (!Number.isFinite(genreId)) {
    return (
      <ErrorState
        title="Genre not found"
        description="This genre doesn't exist or isn't in your library."
      />
    );
  }
  if (genre.isError) return <ErrorState error={genre.error} />;

  return (
    <div>
      {genre.isLoading || !genre.data ? (
        <Skeleton className="mb-6 h-12 w-48" />
      ) : (
        <PageHeader
          title={genre.data.name}
          description="Artists, albums, and tracks tagged with this genre."
        />
      )}

      <section className="mb-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-heading text-lg font-medium">
            Tracks
            {tracks.data && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {formatNumber(tracks.data.meta.total)}
              </span>
            )}
          </h2>
          <Button
            variant="outline"
            size="sm"
            render={<Link to={`/tracks?genre=${genreId}`} />}
          >
            Browse all
          </Button>
        </div>
        {tracks.isLoading ? (
          <TableSkeleton rows={5} />
        ) : tracks.isError ? (
          <ErrorState error={tracks.error} />
        ) : (tracks.data?.data.length ?? 0) === 0 ? (
          <EmptyState title="No tracks in this genre" showOrb={false} />
        ) : (
          <TrackTable tracks={tracks.data!.data} />
        )}
      </section>

      <FacetSection
        title="Artists"
        total={artists.data?.meta.total}
        browseTo={`/artists?genre=${genreId}`}
        isLoading={artists.isLoading}
        isError={artists.isError}
        error={artists.error}
        isEmpty={(artists.data?.data.length ?? 0) === 0}
      >
        {artists.data?.data.map((artist) => (
          <ArtistCard key={artist.id} artist={artist} />
        ))}
      </FacetSection>

      <FacetSection
        title="Albums"
        total={albums.data?.meta.total}
        browseTo={`/albums?genre=${genreId}`}
        isLoading={albums.isLoading}
        isError={albums.isError}
        error={albums.error}
        isEmpty={(albums.data?.data.length ?? 0) === 0}
      >
        {albums.data?.data.map((album) => (
          <AlbumCard key={album.id} album={album} />
        ))}
      </FacetSection>
    </div>
  );
}

interface FacetSectionProps {
  title: string;
  total?: number;
  browseTo: string;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  isEmpty: boolean;
  children: React.ReactNode;
}

function FacetSection({
  title,
  total,
  browseTo,
  isLoading,
  isError,
  error,
  isEmpty,
  children,
}: FacetSectionProps) {
  return (
    <section className="mb-8">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-heading text-lg font-medium">
          {title}
          {total != null && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {formatNumber(total)}
            </span>
          )}
        </h2>
        <Button variant="outline" size="sm" render={<Link to={browseTo} />}>
          Browse all
        </Button>
      </div>
      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : isError ? (
        <ErrorState error={error} />
      ) : isEmpty ? (
        <p className="text-sm text-muted-foreground">None in your library.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {children}
        </div>
      )}
    </section>
  );
}
