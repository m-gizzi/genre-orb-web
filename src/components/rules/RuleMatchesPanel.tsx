import { apiErrorMessage } from "@/api/client";
import type { RuleMatchesResult } from "@/hooks/useRuleMatches";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, Pagination, TableSkeleton, TrackTable } from "@/components/catalog";
import { formatNumber } from "@/lib/format";
import { pageStartIndex } from "@/lib/pagination";

interface RuleMatchesPanelProps {
  matches: RuleMatchesResult;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
  unavailable?: string;
}

export function RuleMatchesPanel({
  matches,
  onPageChange,
  onPerPageChange,
  unavailable,
}: RuleMatchesPanelProps) {
  return (
    <Card className="mt-6">
      <CardHeader className="flex-row flex-wrap items-center gap-2">
        <CardTitle>Matching tracks</CardTitle>
        <p className="ml-auto text-sm text-muted-foreground">
          <MatchSummary matches={matches} unavailable={unavailable} />
        </p>
      </CardHeader>

      <CardContent>
        <PanelBody
          matches={matches}
          onPageChange={onPageChange}
          onPerPageChange={onPerPageChange}
          unavailable={unavailable}
        />
      </CardContent>
    </Card>
  );
}

function MatchSummary({
  matches,
  unavailable,
}: Pick<RuleMatchesPanelProps, "matches" | "unavailable">) {
  if (unavailable) return <>—</>;
  if (matches.isError) return <>Couldn't count matches</>;
  if (matches.meta === undefined) return <>Evaluating…</>;

  const { total, source_track_count: pool } = matches.meta;
  return (
    <>
      {formatNumber(total)} of {formatNumber(pool)} source {pool === 1 ? "track" : "tracks"}
      {matches.isPending && " · updating…"}
    </>
  );
}

function PanelBody({
  matches,
  onPageChange,
  onPerPageChange,
  unavailable,
}: RuleMatchesPanelProps) {
  if (unavailable) {
    return <EmptyState title="Nothing to match yet" description={unavailable} />;
  }
  if (matches.isError) {
    return (
      <EmptyState
        title="Couldn't evaluate these rules"
        description={apiErrorMessage(matches.error)}
      />
    );
  }
  if (matches.meta === undefined) {
    return <TableSkeleton />;
  }
  if (matches.meta.source_track_count === 0) {
    return (
      <EmptyState
        title="No source tracks yet"
        description="None of the source playlists have been synced, so there is nothing to filter."
      />
    );
  }
  if (matches.meta.total === 0) {
    return (
      <EmptyState
        title="No matches"
        description="No tracks in the source playlists match these rules. Try loosening them."
      />
    );
  }

  return (
    <div className="space-y-4">
      <TrackTable
        tracks={matches.tracks}
        numbering="index"
        startIndex={pageStartIndex(matches.meta)}
      />
      <Pagination
        meta={matches.meta}
        onPageChange={onPageChange}
        onPerPageChange={onPerPageChange}
        label="matching tracks"
      />
    </div>
  );
}
