import { useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import type { SearchListParams } from "@/api/client";
import { useGenres } from "@/hooks/useGenres";
import {
  parseListParams,
  listParamsToParams,
} from "@/lib/catalogFilterParams";
import { DEFAULT_GENRE_PER_PAGE, GENRE_PER_PAGE_OPTIONS } from "@/lib/config";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DebouncedSearchInput,
  EmptyState,
  ErrorState,
  Pagination,
  SortControl,
} from "@/components/catalog";

const SORT_LABELS: Record<string, string> = {
  name: "Name",
  track_count: "Track count",
};
const LIST_OPTIONS = { defaultSort: "name", defaultPerPage: DEFAULT_GENRE_PER_PAGE };

export function GenresPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseListParams(searchParams, LIST_OPTIONS);

  const query = useGenres(filters);
  const genres = query.data?.data ?? [];

  const applyPatch = useCallback(
    (patch: Partial<SearchListParams>) => {
      const next = { ...parseListParams(searchParams, LIST_OPTIONS), ...patch };
      if (!("page" in patch)) next.page = 1;
      setSearchParams(listParamsToParams(next, LIST_OPTIONS), { replace: true });
    },
    [searchParams, setSearchParams]
  );

  return (
    <div>
      <PageHeader
        title="Genres"
        description="Explore the genres across your library."
        actions={
          <div className="flex items-center gap-2">
            <DebouncedSearchInput
              value={filters.search ?? ""}
              onCommit={(value) => applyPatch({ search: value || undefined })}
              placeholder="Search genres…"
            />
            <SortControl
              sort={filters.sort ?? "name"}
              order={filters.order ?? "asc"}
              options={SORT_LABELS}
              onSortChange={(sort) => applyPatch({ sort })}
              onOrderChange={(order) => applyPatch({ order })}
            />
          </div>
        }
      />

      {query.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => query.refetch()} />
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
              onPageChange={(page) => applyPatch({ page })}
              onPerPageChange={(per_page) => applyPatch({ per_page })}
              perPageOptions={GENRE_PER_PAGE_OPTIONS}
            />
          )}
        </>
      )}
    </div>
  );
}
