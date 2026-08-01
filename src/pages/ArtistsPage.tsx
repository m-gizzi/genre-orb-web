import {
  parseArtistFilters,
  artistFiltersToParams,
} from "@/lib/catalogFilterParams";
import { useUrlListParams } from "@/hooks/useUrlListParams";
import { useArtists } from "@/hooks/useArtists";
import { useGenre } from "@/hooks/useGenres";
import { CARD_PER_PAGE_OPTIONS } from "@/lib/config";
import type { ArtistSort } from "@/lib/sorts";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  ArtistCard,
  CardGridSkeleton,
  DebouncedSearchInput,
  EmptyState,
  GenreAutocomplete,
  Pagination,
  QueryState,
  SortControl,
} from "@/components/catalog";

const SORT_LABELS: Record<ArtistSort, string> = {
  name: "Name",
  popularity: "Popularity",
  followers: "Followers",
};

export function ArtistsPage() {
  const { filters, applyPatch } = useUrlListParams(
    parseArtistFilters,
    artistFiltersToParams
  );

  const genreId = filters.genre ? Number(filters.genre) : NaN;
  const genreQuery = useGenre(genreId);

  const query = useArtists(filters);
  const artists = query.data?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Artists"
        description="Every artist in your synced library."
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

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <DebouncedSearchInput
          value={filters.search ?? ""}
          onCommit={(value) => applyPatch({ search: value || undefined })}
          placeholder="Search artists…"
        />
        <GenreAutocomplete
          valueId={filters.genre ? Number(filters.genre) : undefined}
          valueName={genreQuery.data?.name}
          onSelect={(next) =>
            applyPatch({ genre: next ? String(next.id) : undefined })
          }
        />
      </div>

      <QueryState
        query={query}
        skeleton={<CardGridSkeleton />}
        isEmpty={artists.length === 0}
        empty={<EmptyState title="No artists found" />}
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {artists.map((artist) => (
            <ArtistCard key={artist.id} artist={artist} />
          ))}
        </div>
        {query.data && (
          <Pagination
            meta={query.data.meta}
            label="artists"
            onPageChange={(page) => applyPatch({ page })}
            onPerPageChange={(per_page) => applyPatch({ per_page })}
            perPageOptions={CARD_PER_PAGE_OPTIONS}
          />
        )}
      </QueryState>
    </div>
  );
}
