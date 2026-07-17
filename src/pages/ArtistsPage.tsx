import { useState } from "react";
import { useArtists } from "@/hooks/useArtists";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePagination } from "@/hooks/usePagination";
import { CARD_PER_PAGE_OPTIONS, DEFAULT_CARD_PER_PAGE } from "@/lib/config";
import { PageHeader } from "@/components/layout/PageHeader";
import {
  ArtistCard,
  CardGridSkeleton,
  EmptyState,
  ErrorState,
  GenreAutocomplete,
  Pagination,
  SearchInput,
  SortControl,
} from "@/components/catalog";

const SORT_LABELS: Record<string, string> = {
  name: "Name",
  popularity: "Popularity",
  followers: "Followers",
};

export function ArtistsPage() {
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState<{ id: number; name: string } | null>(null);
  const [sort, setSort] = useState("name");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const { page, perPage, setPage, setPerPage } = usePagination(DEFAULT_CARD_PER_PAGE);
  const debouncedSearch = useDebouncedValue(search, 300);

  const resetToFirstPage = () => setPage(1);

  const query = useArtists({
    search: debouncedSearch || undefined,
    genre: genre?.id,
    sort,
    order,
    page,
    per_page: perPage,
  });
  const artists = query.data?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Artists"
        description="Every artist in your synced library."
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
          placeholder="Search artists…"
        />
        <GenreAutocomplete
          valueId={genre?.id}
          valueName={genre?.name}
          onSelect={(next) => {
            setGenre(next);
            resetToFirstPage();
          }}
        />
      </div>

      {query.isLoading ? (
        <CardGridSkeleton />
      ) : query.isError ? (
        <ErrorState error={query.error} />
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
