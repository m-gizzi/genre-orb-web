import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import type { AlbumListParams } from "@/api/client";
import {
  parseAlbumFilters,
  albumFiltersToParams,
} from "@/lib/catalogFilterParams";
import { useAlbums } from "@/hooks/useAlbums";
import { useGenre } from "@/hooks/useGenres";
import { CARD_PER_PAGE_OPTIONS } from "@/lib/config";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  AlbumCard,
  CardGridSkeleton,
  DebouncedInput,
  DebouncedSearchInput,
  EmptyState,
  ErrorState,
  GenreAutocomplete,
  Pagination,
  SortControl,
} from "@/components/catalog";

const SORT_LABELS: Record<string, string> = {
  title: "Title",
  release_year: "Release year",
  popularity: "Popularity",
};

const toNumber = (value: string) => {
  const n = Number(value);
  return value === "" || Number.isNaN(n) ? undefined : n;
};

export function AlbumsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseAlbumFilters(searchParams);

  const genreId = filters.genre ? Number(filters.genre) : NaN;
  const genreQuery = useGenre(genreId);

  const query = useAlbums(filters);
  const albums = query.data?.data ?? [];

  const applyPatch = useCallback(
    (patch: Partial<AlbumListParams>) => {
      const next = { ...parseAlbumFilters(searchParams), ...patch };
      if (!("page" in patch)) next.page = 1;
      setSearchParams(albumFiltersToParams(next), { replace: true });
    },
    [searchParams, setSearchParams]
  );

  return (
    <div>
      <PageHeader
        title="Albums"
        description="Every album in your synced library."
        actions={
          <SortControl
            sort={filters.sort ?? "title"}
            order={filters.order ?? "asc"}
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

      {query.isLoading ? (
        <CardGridSkeleton />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : albums.length === 0 ? (
        <EmptyState title="No albums found" />
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
