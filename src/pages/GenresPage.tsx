import { useState } from "react";
import { Link } from "react-router-dom";
import { useGenres } from "@/hooks/useGenres";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { usePagination } from "@/hooks/usePagination";
import { DEFAULT_GENRE_PER_PAGE, GENRE_PER_PAGE_OPTIONS } from "@/lib/config";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  EmptyState,
  ErrorState,
  Pagination,
  SearchInput,
  SortControl,
} from "@/components/catalog";

const SORT_LABELS: Record<string, string> = { name: "Name" };

export function GenresPage() {
  const [search, setSearch] = useState("");
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const { page, perPage, setPage, setPerPage } = usePagination(DEFAULT_GENRE_PER_PAGE);
  const debouncedSearch = useDebouncedValue(search, 300);

  const query = useGenres({
    search: debouncedSearch || undefined,
    order,
    page,
    per_page: perPage,
  });
  const genres = query.data?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Genres"
        description="Explore the genres across your library."
        actions={
          <div className="flex items-center gap-2">
            <SearchInput
              value={search}
              onChange={(value) => {
                setSearch(value);
                setPage(1);
              }}
              placeholder="Search genres…"
            />
            <SortControl
              sort="name"
              order={order}
              options={SORT_LABELS}
              onSortChange={() => {}}
              onOrderChange={(value) => {
                setOrder(value);
                setPage(1);
              }}
            />
          </div>
        }
      />

      {query.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : query.isError ? (
        <ErrorState error={query.error} />
      ) : genres.length === 0 ? (
        <EmptyState title="No genres found" />
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {genres.map((genre) => (
              <Badge
                key={genre.id}
                variant="outline"
                className="h-7 px-3 text-sm"
                render={<Link to={`/genres/${genre.id}`} />}
              >
                {genre.name}
              </Badge>
            ))}
          </div>
          {query.data && (
            <Pagination
              meta={query.data.meta}
              label="genres"
              onPageChange={setPage}
              onPerPageChange={setPerPage}
              perPageOptions={GENRE_PER_PAGE_OPTIONS}
            />
          )}
        </>
      )}
    </div>
  );
}
