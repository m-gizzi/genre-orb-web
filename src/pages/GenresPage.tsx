import { Link } from "react-router-dom";
import { useGenres } from "@/hooks/useGenres";
import { useUrlListParams } from "@/hooks/useUrlListParams";
import {
  parseGenreFilters,
  genreFiltersToParams,
} from "@/lib/catalogFilterParams";
import { GENRE_PER_PAGE_OPTIONS } from "@/lib/config";
import type { GenreSort } from "@/lib/sorts";
import { useToggleBlockedGenre } from "@/hooks/useGenreCuration";
import { PageHeader } from "@/components/layout/PageHeader";
import { GenrePreferencesPanel } from "@/components/genres/GenrePreferencesPanel";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  DebouncedSearchInput,
  EmptyState,
  Pagination,
  QueryState,
  SortControl,
} from "@/components/catalog";

const SORT_LABELS: Record<GenreSort, string> = {
  name: "Name",
  track_count: "Track count",
};

export function GenresPage() {
  const { filters, applyPatch } = useUrlListParams(
    parseGenreFilters,
    genreFiltersToParams
  );

  const query = useGenres(filters);
  const blocked = useToggleBlockedGenre();
  const genres = query.data?.data ?? [];

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
              sort={filters.sort}
              order={filters.order}
              options={SORT_LABELS}
              onSortChange={(sort) => applyPatch({ sort })}
              onOrderChange={(order) => applyPatch({ order })}
            />
          </div>
        }
      />

      <GenrePreferencesPanel />

      <label className="my-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Switch
          checked={filters.include_blocked ?? false}
          onCheckedChange={(checked: boolean) =>
            applyPatch({ include_blocked: checked || undefined, page: 1 })
          }
        />
        Show blocked genres
      </label>

      <QueryState
        query={query}
        skeleton={<Skeleton className="h-40 w-full" />}
        isEmpty={genres.length === 0}
        empty={<EmptyState title="No genres found" />}
      >
        <div className="flex flex-wrap gap-2">
          {genres.map((genre) => (
            <Badge
              key={genre.id}
              variant="outline"
              className={cn(
                "h-7 gap-1.5 px-3 text-sm",
                genre.blocked && "opacity-50",
              )}
            >
              <Link to={`/genres/${genre.id}`} className="hover:underline">
                {genre.name}
              </Link>
              <button
                type="button"
                aria-label={`${genre.blocked ? "Unblock" : "Block"} ${genre.name}`}
                onClick={() => blocked.toggle(genre.id, !genre.blocked)}
                className="text-xs opacity-70 hover:opacity-100"
              >
                {genre.blocked ? "Unblock" : "Block"}
              </button>
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
      </QueryState>
    </div>
  );
}
