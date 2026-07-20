import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import type { CatalogListParams } from "@/api/client";
import {
  parseArtistFilters,
  artistFiltersToParams,
} from "@/lib/catalogFilterParams";
import { useArtists } from "@/hooks/useArtists";
import { useGenre } from "@/hooks/useGenres";
import { CARD_PER_PAGE_OPTIONS } from "@/lib/config";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  ArtistCard,
  CardGridSkeleton,
  DebouncedSearchInput,
  EmptyState,
  ErrorState,
  GenreAutocomplete,
  Pagination,
  SortControl,
} from "@/components/catalog";

const SORT_LABELS: Record<string, string> = {
  name: "Name",
  popularity: "Popularity",
  followers: "Followers",
};

export function ArtistsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseArtistFilters(searchParams);

  const genreId = filters.genre ? Number(filters.genre) : NaN;
  const genreQuery = useGenre(genreId);

  const query = useArtists(filters);
  const artists = query.data?.data ?? [];

  const applyPatch = useCallback(
    (patch: Partial<CatalogListParams>) => {
      const next = { ...parseArtistFilters(searchParams), ...patch };
      if (!("page" in patch)) next.page = 1;
      setSearchParams(artistFiltersToParams(next), { replace: true });
    },
    [searchParams, setSearchParams]
  );

  return (
    <div>
      <PageHeader
        title="Artists"
        description="Every artist in your synced library."
        actions={
          <SortControl
            sort={filters.sort ?? "name"}
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

      {query.isLoading ? (
        <CardGridSkeleton />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
      ) : artists.length === 0 ? (
        <EmptyState title="No artists found" />
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}
