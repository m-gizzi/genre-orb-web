import type { ReactNode } from "react";
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
  QueryState,
  TableSkeleton,
  TrackTable,
} from "@/components/catalog";
import { formatNumber } from "@/lib/format";

const FACET_LIMIT = 12;

interface FacetQuery {
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  isPlaceholderData?: boolean;
  refetch: () => unknown;
  data?: { data: unknown[]; meta: { total: number } };
}

export function GenreDetailPage() {
  const { id } = useParams();
  const genreId = Number(id);

  const enabled = Number.isFinite(genreId);
  const genre = useGenre(genreId);
  const tracks = useTracks(
    { genre: String(genreId), per_page: 10, sort: "popularity", order: "desc" },
    enabled
  );
  const artists = useArtists(
    {
      genre: String(genreId),
      per_page: FACET_LIMIT,
      sort: "popularity",
      order: "desc",
    },
    enabled
  );
  const albums = useAlbums(
    {
      genre: String(genreId),
      per_page: FACET_LIMIT,
      sort: "popularity",
      order: "desc",
    },
    enabled
  );

  const trackRows = tracks.data?.data ?? [];
  const artistRows = artists.data?.data ?? [];
  const albumRows = albums.data?.data ?? [];

  if (!enabled) {
    return (
      <ErrorState
        title="Genre not found"
        description="This genre doesn't exist or isn't in your library."
      />
    );
  }
  if (genre.isError) {
    return <ErrorState error={genre.error} onRetry={() => genre.refetch()} />;
  }

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

      <FacetSection
        title="Tracks"
        query={tracks}
        browseTo={`/tracks?genre=${genreId}`}
        skeleton={<TableSkeleton rows={5} />}
        isEmpty={trackRows.length === 0}
        empty={<EmptyState title="No tracks in this genre" showOrb={false} />}
      >
        <TrackTable tracks={trackRows} />
      </FacetSection>

      <FacetSection
        title="Artists"
        query={artists}
        browseTo={`/artists?genre=${genreId}`}
        isEmpty={artistRows.length === 0}
      >
        <CardGrid>
          {artistRows.map((artist) => (
            <ArtistCard key={artist.id} artist={artist} />
          ))}
        </CardGrid>
      </FacetSection>

      <FacetSection
        title="Albums"
        query={albums}
        browseTo={`/albums?genre=${genreId}`}
        isEmpty={albumRows.length === 0}
      >
        <CardGrid>
          {albumRows.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </CardGrid>
      </FacetSection>
    </div>
  );
}

function CardGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {children}
    </div>
  );
}

interface FacetSectionProps {
  title: string;
  query: FacetQuery;
  browseTo: string;
  isEmpty: boolean;
  skeleton?: ReactNode;
  empty?: ReactNode;
  children: ReactNode;
}

function FacetSection({
  title,
  query,
  browseTo,
  isEmpty,
  skeleton = <Skeleton className="h-40 w-full" />,
  empty = (
    <p className="text-sm text-muted-foreground">None in your library.</p>
  ),
  children,
}: FacetSectionProps) {
  const total = query.data?.meta.total;

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
      <QueryState
        query={query}
        skeleton={skeleton}
        isEmpty={isEmpty}
        empty={empty}
      >
        {children}
      </QueryState>
    </section>
  );
}
