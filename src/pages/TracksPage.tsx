import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import type { TrackFilters, TrackSort } from "@/api/client";
import {
  parseTrackFilters,
  trackFiltersToParams,
} from "@/lib/trackFilterParams";
import { useTracks } from "@/hooks/useTracks";
import { useGenre } from "@/hooks/useGenres";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  EmptyState,
  ErrorState,
  Pagination,
  SortControl,
  TableSkeleton,
  TrackFilterBar,
  TrackTable,
} from "@/components/catalog";

const SORT_LABELS: Record<TrackSort, string> = {
  title: "Title",
  artist: "Artist",
  album: "Album",
  year: "Year",
  popularity: "Popularity",
  duration: "Duration",
};

export function TracksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseTrackFilters(searchParams);

  const genreId = filters.genre ? Number(filters.genre) : NaN;
  const genreQuery = useGenre(genreId);

  const query = useTracks(filters);

  const applyPatch = useCallback(
    (patch: Partial<TrackFilters>) => {
      const next = { ...parseTrackFilters(searchParams), ...patch };
      if (!("page" in patch)) next.page = 1;
      setSearchParams(trackFiltersToParams(next), { replace: true });
    },
    [searchParams, setSearchParams]
  );

  const clear = useCallback(
    () => setSearchParams({}, { replace: true }),
    [setSearchParams]
  );

  const tracks = query.data?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Tracks"
        description="Filter and sort every track in your synced library."
        actions={
          <SortControl
            sort={filters.sort ?? "title"}
            order={filters.order ?? "asc"}
            options={SORT_LABELS}
            onSortChange={(sort) => applyPatch({ sort: sort as TrackSort })}
            onOrderChange={(order) => applyPatch({ order })}
          />
        }
      />

      <div className="mb-4">
        <TrackFilterBar
          filters={filters}
          genreName={genreQuery.data?.name}
          onChange={applyPatch}
          onClear={clear}
        />
      </div>

      {query.isLoading ? (
        <TableSkeleton />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : tracks.length === 0 ? (
        <EmptyState
          title="No tracks match"
          description="Try loosening your filters, or sync more playlists from the Library page."
        />
      ) : (
        <>
          <TrackTable tracks={tracks} />
          {query.data && (
            <Pagination
              meta={query.data.meta}
              label="tracks"
              onPageChange={(page) => applyPatch({ page })}
              onPerPageChange={(per_page) => applyPatch({ per_page })}
            />
          )}
        </>
      )}
    </div>
  );
}
