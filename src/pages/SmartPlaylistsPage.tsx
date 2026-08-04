import { useState } from "react";
import { Link } from "react-router-dom";
import { PlusIcon, SparklesIcon } from "lucide-react";
import type { RuleGroup } from "@/api/client";
import { useSmartPlaylistsPage } from "@/hooks/useSmartPlaylists";
import { useUrlListParams } from "@/hooks/useUrlListParams";
import {
  parseSmartPlaylistFilters,
  smartPlaylistFiltersToParams,
} from "@/lib/catalogFilterParams";
import { CARD_PER_PAGE_OPTIONS } from "@/lib/config";
import { countRules } from "@/lib/ruleTree";
import type { SmartPlaylistSort } from "@/lib/sorts";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CardGridSkeleton,
  DebouncedSearchInput,
  EmptyState,
  Pagination,
  QueryState,
  SortControl,
} from "@/components/catalog";
import { NewSmartPlaylistDialog } from "@/components/smartPlaylists/NewSmartPlaylistDialog";
import { formatNumber } from "@/lib/format";

const SORT_LABELS: Record<SmartPlaylistSort, string> = {
  name: "Name",
  created_at: "Created",
  last_evaluated_at: "Last evaluated",
};

function ruleSummary(rules: RuleGroup) {
  const count = countRules(rules);
  if (count === 0) return "no rules yet";

  return `${formatNumber(count)} ${count === 1 ? "rule" : "rules"}`;
}

export function SmartPlaylistsPage() {
  const { filters, applyPatch } = useUrlListParams(
    parseSmartPlaylistFilters,
    smartPlaylistFiltersToParams
  );
  const [creating, setCreating] = useState(false);

  const query = useSmartPlaylistsPage(filters);
  const smartPlaylists = query.data?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Smart Playlists"
        description="Rule-driven playlists that filter tracks from your other playlists."
        actions={
          <div className="flex items-center gap-2">
            <DebouncedSearchInput
              value={filters.search ?? ""}
              onCommit={(value) => applyPatch({ search: value || undefined })}
              placeholder="Search smart playlists…"
            />
            <SortControl
              sort={filters.sort}
              order={filters.order}
              options={SORT_LABELS}
              onSortChange={(sort) => applyPatch({ sort })}
              onOrderChange={(order) => applyPatch({ order })}
            />
            <Button onClick={() => setCreating(true)}>
              <PlusIcon /> New
            </Button>
          </div>
        }
      />

      <QueryState
        query={query}
        skeleton={<CardGridSkeleton />}
        isEmpty={smartPlaylists.length === 0}
        empty={
          filters.search ? (
            <EmptyState title="No smart playlists match your search" showOrb={false} />
          ) : (
            <EmptyState
              title="No smart playlists yet"
              description="Create one from scratch, or turn an existing playlist into a smart playlist."
              action={
                <div className="flex gap-2">
                  <Button onClick={() => setCreating(true)}>New smart playlist</Button>
                  <Button variant="outline" render={<Link to="/playlists" />}>
                    Browse playlists
                  </Button>
                </div>
              }
            />
          )
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {smartPlaylists.map((smartPlaylist) => (
            <Card key={smartPlaylist.id} className="gap-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <Link
                  to={`/smart-playlists/${smartPlaylist.id}`}
                  className="flex min-w-0 items-center gap-2 hover:text-primary"
                >
                  <SparklesIcon className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate font-medium">{smartPlaylist.name}</span>
                </Link>
                {smartPlaylist.is_ready ? (
                  <Badge variant={smartPlaylist.is_enabled ? "default" : "outline"}>
                    {smartPlaylist.is_enabled ? "Enabled" : "Paused"}
                  </Badge>
                ) : (
                  <Badge variant="destructive">Not ready</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {formatNumber(smartPlaylist.source_count)}{" "}
                {smartPlaylist.source_count === 1 ? "source" : "sources"} ·{" "}
                {ruleSummary(smartPlaylist.rules)}
              </p>
            </Card>
          ))}
        </div>
        {query.data && (
          <Pagination
            meta={query.data.meta}
            label="smart playlists"
            onPageChange={(page) => applyPatch({ page })}
            onPerPageChange={(per_page) => applyPatch({ per_page })}
            perPageOptions={CARD_PER_PAGE_OPTIONS}
          />
        )}
      </QueryState>

      <NewSmartPlaylistDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}
