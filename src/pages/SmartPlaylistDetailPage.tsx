import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  HeartIcon,
  ListMusicIcon,
  PencilIcon,
  RefreshCwIcon,
  Trash2Icon,
  WandSparklesIcon,
} from "lucide-react";
import {
  apiErrorMessage,
  type RuleGroup,
  type SmartPlaylistDetail,
} from "@/api/client";
import { useSmartPlaylist, useUpdateSmartPlaylist } from "@/hooks/useSmartPlaylists";
import { useRuleSchema } from "@/hooks/useRuleSchema";
import {
  MATCHES_PER_PAGE,
  useRuleMatches,
  type RuleMatchesResult,
} from "@/hooks/useRuleMatches";
import { usePagination } from "@/hooks/usePagination";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { HintedSwitch } from "@/components/ui/hinted-switch";
import { ErrorState } from "@/components/catalog";
import { DeleteSmartPlaylistDialog } from "@/components/smartPlaylists/DeleteSmartPlaylistDialog";
import { SourcePlaylistPicker } from "@/components/smartPlaylists/SourcePlaylistPicker";
import { RuleGroupCard, RuleMatchesPanel } from "@/components/rules";
import { countRules, toDraft } from "@/lib/ruleTree";
import { formatDate, formatNumber } from "@/lib/format";

const NOT_READY_HINT = "Add at least one rule before turning this on.";

export function SmartPlaylistDetailPage() {
  const { id } = useParams();
  const smartPlaylistId = Number(id);
  const query = useSmartPlaylist(smartPlaylistId);

  if (!Number.isFinite(smartPlaylistId)) {
    return (
      <ErrorState
        title="Smart playlist not found"
        description="This smart playlist doesn't exist."
      />
    );
  }
  if (query.isError) {
    return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  }
  if (query.isLoading || !query.data) {
    return <Skeleton className="h-12 w-64" />;
  }

  return <SmartPlaylistDetailView smartPlaylist={query.data} />;
}

function SmartPlaylistDetailView({
  smartPlaylist,
}: {
  smartPlaylist: SmartPlaylistDetail;
}) {
  const [deleting, setDeleting] = useState(false);
  const [editingSources, setEditingSources] = useState(false);
  const [sourceIds, setSourceIds] = useState<number[]>([]);
  const update = useUpdateSmartPlaylist(smartPlaylist.id);
  const { page, perPage, setPage, setPerPage } = usePagination(MATCHES_PER_PAGE);
  const matches = useRuleMatches(smartPlaylist.id, {
    page,
    perPage,
    enabled: smartPlaylist.is_ready,
  });

  const target = smartPlaylist.target_playlist;

  const enabled = update.isPending
    ? (update.variables?.is_enabled ?? smartPlaylist.is_enabled)
    : smartPlaylist.is_enabled;

  function startEditingSources() {
    setSourceIds(smartPlaylist.source_playlists.map((playlist) => playlist.id));
    setEditingSources(true);
  }

  function saveSources() {
    update.mutate(
      { source_playlist_ids: sourceIds },
      { onSuccess: () => setEditingSources(false) }
    );
  }

  return (
    <div>
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            {smartPlaylist.name}
            {smartPlaylist.is_ready ? (
              <Badge variant={smartPlaylist.is_enabled ? "default" : "outline"}>
                {smartPlaylist.is_enabled ? "Enabled" : "Paused"}
              </Badge>
            ) : (
              <Badge variant="destructive">Not ready</Badge>
            )}
          </span>
        }
        description={
          <>
            Fills{" "}
            <Link to={`/playlists/${target.id}`} className="underline hover:text-primary">
              {target.name}
            </Link>{" "}
            · last evaluated {formatDate(smartPlaylist.last_evaluated_at, "never")}
          </>
        }
        actions={
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <span aria-hidden="true">Enabled</span>
              <HintedSwitch
                checked={enabled}
                disabled={update.isPending}
                hint={smartPlaylist.is_ready ? undefined : NOT_READY_HINT}
                onCheckedChange={(next) => update.mutate({ is_enabled: next })}
                aria-label={`Enable ${smartPlaylist.name}`}
              />
            </span>
            <Button variant="outline" onClick={() => setDeleting(true)}>
              <Trash2Icon /> Delete
            </Button>
          </div>
        }
      />

      {update.isError && (
        <p className="mb-4 text-sm text-destructive">{apiErrorMessage(update.error)}</p>
      )}

      {!smartPlaylist.is_ready && (
        <Card className="mb-6 gap-2 border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-center gap-2 font-medium">
            <WandSparklesIcon className="size-4 text-destructive" />
            Not ready — add rules before enabling
          </div>
          <p className="text-sm text-muted-foreground">
            An empty rule set has nothing to evaluate, so this smart playlist can't be
            turned on yet.
          </p>
          <div>
            <Button
              size="sm"
              render={<Link to={`/smart-playlists/${smartPlaylist.id}/edit`} />}
            >
              <WandSparklesIcon /> Build the rules
            </Button>
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="gap-3 p-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-heading font-medium">Sources</h2>
            {editingSources ? (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingSources(false)}
                  disabled={update.isPending}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={saveSources}
                  disabled={update.isPending || sourceIds.length === 0}
                >
                  Save
                </Button>
              </div>
            ) : (
              <Button size="sm" variant="outline" onClick={startEditingSources}>
                Edit
              </Button>
            )}
          </div>

          {editingSources ? (
            <SourcePlaylistPicker
              selectedIds={sourceIds}
              onChange={setSourceIds}
              excludePlaylistId={target.id}
              initialSelected={smartPlaylist.source_playlists}
            />
          ) : (
            <ul className="space-y-1 text-sm">
              {smartPlaylist.source_playlists.map((playlist) => (
                <li key={playlist.id}>
                  <Link
                    to={`/playlists/${playlist.id}`}
                    className="flex items-center gap-2 hover:text-primary"
                  >
                    {playlist.is_liked_songs ? (
                      <HeartIcon className="size-4 shrink-0 text-primary" />
                    ) : (
                      <ListMusicIcon className="size-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="truncate">{playlist.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="gap-3 p-4 lg:col-span-2">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-heading font-medium">Rules</h2>
            <Button
              size="sm"
              variant="outline"
              render={<Link to={`/smart-playlists/${smartPlaylist.id}/edit`} />}
            >
              <PencilIcon /> Edit rules
            </Button>
          </div>

          <RuleSummary rules={smartPlaylist.rules} />

          <EvaluationRow smartPlaylist={smartPlaylist} matches={matches} />
        </Card>
      </div>

      <RuleMatchesPanel
        matches={matches}
        onPageChange={setPage}
        onPerPageChange={setPerPage}
        unavailable={
          smartPlaylist.is_ready
            ? undefined
            : "This smart playlist has no rules yet, so there is nothing to match."
        }
      />

      <DeleteSmartPlaylistDialog
        smartPlaylist={smartPlaylist}
        open={deleting}
        onOpenChange={setDeleting}
      />
    </div>
  );
}

function RuleSummary({ rules }: { rules: RuleGroup }) {
  const schema = useRuleSchema();
  const tree = useMemo(() => toDraft(rules), [rules]);

  if (rules.rules.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No rules yet — this smart playlist stays a draft until you add one.
      </p>
    );
  }
  if (schema.isLoading) return <Skeleton className="h-20 w-full" />;
  if (!schema.data) {
    return (
      <p className="text-sm text-muted-foreground">
        {countRules(tree)} rules — open the editor to see them.
      </p>
    );
  }

  return (
    <RuleGroupCard
      group={tree}
      root={tree}
      schema={schema.data}
      path={[]}
      editable={false}
    />
  );
}

function EvaluationRow({
  smartPlaylist,
  matches,
}: {
  smartPlaylist: SmartPlaylistDetail;
  matches: RuleMatchesResult;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-muted-foreground">
        <EvaluationSummary smartPlaylist={smartPlaylist} matches={matches} />
      </p>

      <Button
        size="sm"
        variant="outline"
        onClick={matches.refetch}
        disabled={!smartPlaylist.is_ready || matches.isPending}
        title={smartPlaylist.is_ready ? undefined : NOT_READY_HINT}
      >
        <RefreshCwIcon /> {matches.isPending ? "Evaluating…" : "Re-evaluate"}
      </Button>
    </div>
  );
}

function EvaluationSummary({
  smartPlaylist,
  matches,
}: {
  smartPlaylist: SmartPlaylistDetail;
  matches: RuleMatchesResult;
}) {
  if (!smartPlaylist.is_ready) return <>Not evaluated — no rules yet</>;
  if (matches.isError) return <>Couldn't evaluate these rules</>;
  if (matches.meta === undefined) return <>Evaluating…</>;

  const { total } = matches.meta;
  return (
    <>
      {formatNumber(total)} matching {total === 1 ? "track" : "tracks"}
    </>
  );
}
