import { Link } from "react-router-dom";
import { Undo2Icon, XIcon } from "lucide-react";
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
import { RuleUsageFilter } from "@/components/genres/RuleUsageFilter";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  ChipAction,
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

      <div className="my-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Switch
            checked={filters.include_blocked ?? false}
            onCheckedChange={(checked: boolean) =>
              applyPatch({ include_blocked: checked || undefined, page: 1 })
            }
          />
          Show blocked genres
        </label>

        <RuleUsageFilter
          value={filters.rule_usage}
          onChange={(rule_usage) => applyPatch({ rule_usage, page: 1 })}
        />
      </div>

      <QueryState
        query={query}
        skeleton={<Skeleton className="h-40 w-full" />}
        isEmpty={genres.length === 0}
        empty={<EmptyState title="No genres found" />}
      >
        {/* An icon rather than a "Block" label: the cloud is dozens of chips wide, and a
            word on each one buries the genre names it exists to show. */}
        <div className="flex flex-wrap gap-2">
          {genres.map((genre) => (
            <Badge
              key={genre.id}
              variant="outline"
              className={cn("h-7 gap-0 px-3 text-sm", genre.blocked && "opacity-50")}
            >
              <Link to={`/genres/${genre.id}`} className="hover:underline">
                {genre.name}
              </Link>
              <ChipAction
                label={`${genre.blocked ? "Unblock" : "Block"} ${genre.name}`}
                icon={genre.blocked ? Undo2Icon : XIcon}
                onClick={() => blocked.toggle(genre.id, !genre.blocked)}
              />
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
