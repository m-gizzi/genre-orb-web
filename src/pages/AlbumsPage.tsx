import { useState } from "react";
import { useAlbums } from "@/hooks/useAlbums";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePagination } from "@/hooks/usePagination";
import { CARD_PER_PAGE_OPTIONS, DEFAULT_CARD_PER_PAGE } from "@/lib/config";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  AlbumCard,
  CardGridSkeleton,
  DebouncedInput,
  EmptyState,
  ErrorState,
  GenreAutocomplete,
  Pagination,
  SearchInput,
  SortControl,
} from "@/components/catalog";

const SORT_LABELS: Record<string, string> = {
  title: "Title",
  release_year: "Release year",
};

const toNumber = (value: string) => {
  const n = Number(value);
  return value === "" || Number.isNaN(n) ? undefined : n;
};

export function AlbumsPage() {
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState<{ id: number; name: string } | null>(null);
  const [yearMin, setYearMin] = useState<number | undefined>();
  const [yearMax, setYearMax] = useState<number | undefined>();
  const [sort, setSort] = useState("title");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const { page, perPage, setPage, setPerPage } = usePagination(DEFAULT_CARD_PER_PAGE);
  const debouncedSearch = useDebouncedValue(search, 300);

  const resetToFirstPage = () => setPage(1);

  const query = useAlbums({
    search: debouncedSearch || undefined,
    genre: genre?.id,
    year_min: yearMin,
    year_max: yearMax,
    sort,
    order,
    page,
    per_page: perPage,
  });
  const albums = query.data?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Albums"
        description="Every album in your synced library."
        actions={
          <SortControl
            sort={sort}
            order={order}
            options={SORT_LABELS}
            onSortChange={(value) => {
              setSort(value);
              resetToFirstPage();
            }}
            onOrderChange={(value) => {
              setOrder(value);
              resetToFirstPage();
            }}
          />
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            resetToFirstPage();
          }}
          placeholder="Search albums…"
        />
        <GenreAutocomplete
          valueId={genre?.id}
          valueName={genre?.name}
          onSelect={(next) => {
            setGenre(next);
            resetToFirstPage();
          }}
        />
        <div className="flex items-center gap-1">
          <DebouncedInput
            type="number"
            inputMode="numeric"
            placeholder="Year ≥"
            className="w-24"
            value={yearMin != null ? String(yearMin) : ""}
            onCommit={(value) => {
              setYearMin(toNumber(value));
              resetToFirstPage();
            }}
          />
          <DebouncedInput
            type="number"
            inputMode="numeric"
            placeholder="Year ≤"
            className="w-24"
            value={yearMax != null ? String(yearMax) : ""}
            onCommit={(value) => {
              setYearMax(toNumber(value));
              resetToFirstPage();
            }}
          />
        </div>
      </div>

      {query.isLoading ? (
        <CardGridSkeleton />
      ) : query.isError ? (
        <ErrorState error={query.error} />
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
              onPageChange={setPage}
              onPerPageChange={setPerPage}
              perPageOptions={CARD_PER_PAGE_OPTIONS}
            />
          )}
        </>
      )}
    </div>
  );
}
