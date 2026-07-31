import {
  parseAlbumFilters,
  albumFiltersToParams,
} from "@/lib/catalogFilterParams";
import { useUrlListParams } from "@/hooks/useUrlListParams";
import { useAlbums } from "@/hooks/useAlbums";
import { useGenre } from "@/hooks/useGenres";
import { CARD_PER_PAGE_OPTIONS } from "@/lib/config";
import { toNumber } from "@/lib/parse";
import type { AlbumSort } from "@/lib/sorts";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  AlbumCard,
  CardGridSkeleton,
  DebouncedInput,
  DebouncedSearchInput,
  EmptyState,
  GenreAutocomplete,
  Pagination,
  QueryState,
  SortControl,
} from "@/components/catalog";

const SORT_LABELS: Record<AlbumSort, string> = {
  title: "Title",
  release_year: "Release year",
  popularity: "Popularity",
};

export function AlbumsPage() {
  const { filters, applyPatch } = useUrlListParams(
    parseAlbumFilters,
    albumFiltersToParams
  );

  const genreId = filters.genre ? Number(filters.genre) : NaN;
  const genreQuery = useGenre(genreId);

  const query = useAlbums(filters);
  const albums = query.data?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Albums"
        description="Every album in your synced library."
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
          placeholder="Search albums…"
        />
        <DebouncedSearchInput
          value={filters.artist ?? ""}
          onCommit={(value) => applyPatch({ artist: value || undefined })}
          placeholder="Artist…"
        />
        <GenreAutocomplete
          valueId={filters.genre ? Number(filters.genre) : undefined}
          valueName={genreQuery.data?.name}
          onSelect={(next) =>
            applyPatch({ genre: next ? String(next.id) : undefined })
          }
        />
        <div className="flex items-center gap-1">
          <DebouncedInput
            type="number"
            inputMode="numeric"
            placeholder="Year ≥"
            className="w-24"
            value={filters.year_min != null ? String(filters.year_min) : ""}
            onCommit={(value) => applyPatch({ year_min: toNumber(value) })}
          />
          <DebouncedInput
            type="number"
            inputMode="numeric"
            placeholder="Year ≤"
            className="w-24"
            value={filters.year_max != null ? String(filters.year_max) : ""}
            onCommit={(value) => applyPatch({ year_max: toNumber(value) })}
          />
        </div>
      </div>

      <QueryState
        query={query}
        skeleton={<CardGridSkeleton />}
        isEmpty={albums.length === 0}
        empty={<EmptyState title="No albums found" />}
      >
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {albums.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
        </div>
        {query.data && (
          <Pagination
            meta={query.data.meta}
            label="albums"
            onPageChange={(page) => applyPatch({ page })}
            onPerPageChange={(per_page) => applyPatch({ per_page })}
            perPageOptions={CARD_PER_PAGE_OPTIONS}
          />
        )}
      </QueryState>
    </div>
  );
}
