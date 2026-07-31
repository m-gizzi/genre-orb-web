import type { TrackSort } from "@/api/client";
import {
  parseTrackFilters,
  trackFiltersToParams,
} from "@/lib/trackFilterParams";
import { useUrlListParams } from "@/hooks/useUrlListParams";
import { useTracks } from "@/hooks/useTracks";
import { useGenre } from "@/hooks/useGenres";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  EmptyState,
  Pagination,
  QueryState,
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
  const { filters, applyPatch, clear } = useUrlListParams(
    parseTrackFilters,
    trackFiltersToParams
  );

  const genreId = filters.genre ? Number(filters.genre) : NaN;
  const genreQuery = useGenre(genreId);

  const query = useTracks(filters);
  const tracks = query.data?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Tracks"
        description="Filter and sort every track in your synced library."
        actions={
          <SortControl
            sort={filters.sort}
            order={filters.order}
            options={SORT_LABELS}
            onSortChange={(sort) => applyPatch({ sort })}
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

      <QueryState
        query={query}
        skeleton={<TableSkeleton />}
        isEmpty={tracks.length === 0}
        empty={
          <EmptyState
            title="No tracks match"
            description="Try loosening your filters, or sync more playlists from the Library page."
          />
        }
      >
        <TrackTable tracks={tracks} />
        {query.data && (
          <Pagination
            meta={query.data.meta}
            label="tracks"
            onPageChange={(page) => applyPatch({ page })}
            onPerPageChange={(per_page) => applyPatch({ per_page })}
          />
        )}
      </QueryState>
    </div>
  );
}
