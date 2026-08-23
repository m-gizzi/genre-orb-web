import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRightIcon, ChevronRightIcon } from "lucide-react";
import type { GenreListParams, PlaylistGenre } from "@/api/client";
import { usePlaylistGenres } from "@/hooks/usePlaylistDetail";
import { useListFilters } from "@/hooks/useListFilters";
import { DEFAULT_PER_PAGE } from "@/lib/config";
import { formatNumber } from "@/lib/format";
import type { GenreSort } from "@/lib/sorts";
import { cn } from "@/lib/utils";
import { RuleUsageFilter } from "@/components/genres/RuleUsageFilter";
import { ProgressBar } from "@/components/library/ProgressBar";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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

type BreakdownFilters = GenreListParams & {
  sort: GenreSort;
  order: "asc" | "desc";
  page: number;
  per_page: number;
};

const DEFAULTS: BreakdownFilters = {
  sort: "track_count",
  order: "desc",
  page: 1,
  per_page: DEFAULT_PER_PAGE,
};

const SUMMARY_NAMES = 3;

function summarize(total: number, genres: PlaylistGenre[]): string {
  if (total === 0) return "No genres yet";

  const names = genres.slice(0, SUMMARY_NAMES).map((genre) => genre.name);
  const label = `${formatNumber(total)} ${total === 1 ? "genre" : "genres"}`;
  return names.length > 0 ? `${label} · ${names.join(", ")}` : label;
}

function share(genre: PlaylistGenre, trackCount: number): number {
  return trackCount > 0 ? (genre.track_count * 100) / trackCount : 0;
}

function GenreRow({
  genre,
  trackCount,
  active,
  onSelect,
}: {
  genre: PlaylistGenre;
  trackCount: number;
  active: boolean;
  onSelect: () => void;
}) {
  const percent = share(genre, trackCount);

  return (
    <li className={cn("flex items-center gap-1 rounded-md pr-1", active && "bg-accent")}>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={active}
        aria-label={
          active
            ? `Stop filtering by ${genre.name}`
            : `Filter the tracks by ${genre.name}`
        }
        className={cn(
          "flex min-w-0 flex-1 items-center gap-3 rounded-md px-2 py-1.5 text-left hover:bg-accent/60",
          genre.blocked && "opacity-50"
        )}
      >
        <span className="w-32 shrink-0 truncate text-sm sm:w-40">{genre.name}</span>
        <ProgressBar
          percent={percent}
          className="flex-1"
          label={`${genre.name} share of tracks`}
        />
        <span className="w-10 shrink-0 text-right text-sm tabular-nums">
          {formatNumber(genre.track_count)}
        </span>
        <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
          {Math.round(percent)}%
        </span>
      </button>
      <Link
        to={`/genres/${genre.id}`}
        aria-label={`Open ${genre.name}`}
        className="rounded-full p-1 opacity-60 hover:opacity-100"
      >
        <ArrowUpRightIcon className="size-3.5" />
      </Link>
    </li>
  );
}

interface PlaylistGenreBreakdownProps {
  playlistId: number;
  trackCount: number;
  activeGenreId?: number;
  onSelectGenre: (genre: PlaylistGenre | null) => void;
}

export function PlaylistGenreBreakdown({
  playlistId,
  trackCount,
  activeGenreId,
  onSelectGenre,
}: PlaylistGenreBreakdownProps) {
  const { filters, applyPatch } = useListFilters(DEFAULTS);
  const [open, setOpen] = useState(false);
  const query = usePlaylistGenres(playlistId, filters);
  const genres = query.data?.data ?? [];
  const total = query.data?.meta.total ?? 0;

  return (
    <section className="mb-6 rounded-lg border bg-card">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 p-4 text-left"
      >
        <ChevronRightIcon
          aria-hidden="true"
          className={cn("size-4 shrink-0 transition-transform", open && "rotate-90")}
        />
        <span className="font-heading text-lg font-medium">Genre breakdown</span>
        <span className="ml-auto text-sm text-muted-foreground">
          {query.isLoading ? "…" : summarize(total, genres)}
        </span>
      </button>

      {open && (
        <div className="space-y-3 border-t p-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
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
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <Switch
                checked={filters.include_blocked ?? false}
                onCheckedChange={(checked: boolean) =>
                  applyPatch({ include_blocked: checked || undefined })
                }
              />
              Show blocked genres
            </label>
            <RuleUsageFilter
              value={filters.rule_usage}
              onChange={(rule_usage) => applyPatch({ rule_usage })}
            />
          </div>

          <QueryState
            query={query}
            skeleton={<Skeleton className="h-40 w-full" />}
            isEmpty={genres.length === 0}
            empty={<EmptyState title="No genres found" showOrb={false} />}
          >
            <ul className="space-y-0.5">
              {genres.map((genre) => (
                <GenreRow
                  key={genre.id}
                  genre={genre}
                  trackCount={trackCount}
                  active={genre.id === activeGenreId}
                  onSelect={() =>
                    onSelectGenre(genre.id === activeGenreId ? null : genre)
                  }
                />
              ))}
            </ul>
            <p className="pt-2 text-xs text-muted-foreground">
              A track can carry more than one genre, so these add up to more than the
              playlist's {formatNumber(trackCount)} tracks. Pick a genre to filter the
              tracks below.
            </p>
            {query.data && (
              <Pagination
                meta={query.data.meta}
                label="genres"
                onPageChange={(page) => applyPatch({ page })}
                onPerPageChange={(per_page) => applyPatch({ per_page })}
              />
            )}
          </QueryState>
        </div>
      )}
    </section>
  );
}
