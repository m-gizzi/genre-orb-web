import { useParams } from "react-router-dom";
import { UserIcon } from "lucide-react";
import { useArtist } from "@/hooks/useArtists";
import { useTracks } from "@/hooks/useTracks";
import { usePagination } from "@/hooks/usePagination";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlbumCard,
  EmptyState,
  ErrorState,
  GenreChip,
  Pagination,
  QueryState,
  TableSkeleton,
  TrackTable,
} from "@/components/catalog";
import { formatNumber } from "@/lib/format";

export function ArtistDetailPage() {
  const { id } = useParams();
  const artistId = Number(id);
  const { page, perPage, setPage, setPerPage } = usePagination(25);

  const artist = useArtist(artistId);
  const tracks = useTracks(
    {
      artist: String(artistId),
      sort: "album",
      page,
      per_page: perPage,
    },
    Number.isFinite(artistId)
  );
  const trackRows = tracks.data?.data ?? [];

  if (!Number.isFinite(artistId)) {
    return (
      <ErrorState
        title="Artist not found"
        description="This artist doesn't exist or isn't in your library."
      />
    );
  }
  if (artist.isError) {
    return <ErrorState error={artist.error} onRetry={() => artist.refetch()} />;
  }
  if (artist.isLoading || !artist.data) {
    return <Skeleton className="h-64 w-full" />;
  }

  const data = artist.data;
  const meta = [
    data.followers != null && `${formatNumber(data.followers)} followers`,
    data.popularity != null && `Popularity ${data.popularity}`,
  ].filter(Boolean).join(" · ");

  return (
    <div>
      <div className="mb-6 flex items-center gap-4">
        {data.image_url ? (
          <img
            src={data.image_url}
            alt={data.name}
            className="size-20 rounded-full object-cover"
          />
        ) : (
          <div className="flex size-20 items-center justify-center rounded-full bg-muted">
            <UserIcon className="size-8 text-muted-foreground" />
          </div>
        )}
        <div>
          <h1 className="font-heading text-2xl font-semibold">{data.name}</h1>
          {meta && <p className="text-sm text-muted-foreground">{meta}</p>}
          {data.genres.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {data.genres.map((genre) => (
                <GenreChip
                  key={genre.id}
                  genre={{ genre_id: genre.id, name: genre.name }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {data.albums.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 font-heading text-lg font-medium">
            Albums in your library
          </h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {data.albums.map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 font-heading text-lg font-medium">Tracks</h2>
        <QueryState
          query={tracks}
          skeleton={<TableSkeleton />}
          isEmpty={trackRows.length === 0}
          empty={
            <EmptyState
              title="No tracks in your library for this artist"
              showOrb={false}
            />
          }
        >
          <TrackTable tracks={trackRows} />
          {tracks.data && (
            <Pagination
              meta={tracks.data.meta}
              label="tracks"
              onPageChange={setPage}
              onPerPageChange={setPerPage}
            />
          )}
        </QueryState>
      </section>
    </div>
  );
}
