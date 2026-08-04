import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { SaveIcon } from "lucide-react";
import {
  apiErrorMessage,
  type RuleGroup,
  type RuleSchema,
  type SmartPlaylistDetail,
} from "@/api/client";
import { useSmartPlaylist, useUpdateSmartPlaylist } from "@/hooks/useSmartPlaylists";
import { useRuleSchema } from "@/hooks/useRuleSchema";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/catalog";
import { RuleGroupCard, type RuleTreeHandlers } from "@/components/rules";
import {
  addNode,
  countRules,
  duplicateNode,
  incompleteCount,
  moveNode,
  removeNode,
  unwrapGroup,
  updateNode,
  wrapInGroup,
} from "@/lib/ruleTree";

const LEAVE_PROMPT = "Discard your unsaved rule changes?";

export function SmartPlaylistEditPage() {
  const { id } = useParams();
  const smartPlaylistId = Number(id);
  const detail = useSmartPlaylist(smartPlaylistId);
  const schema = useRuleSchema();

  if (!Number.isFinite(smartPlaylistId)) {
    return (
      <ErrorState
        title="Smart playlist not found"
        description="This smart playlist doesn't exist."
      />
    );
  }
  if (detail.isError) {
    return <ErrorState error={detail.error} onRetry={() => detail.refetch()} />;
  }
  if (schema.isError) {
    return <ErrorState error={schema.error} onRetry={() => schema.refetch()} />;
  }
  if (detail.isLoading || schema.isLoading || !detail.data || !schema.data) {
    return <Skeleton className="h-12 w-64" />;
  }

  return <RuleEditor smartPlaylist={detail.data} schema={schema.data} />;
}

function RuleEditor({
  smartPlaylist,
  schema,
}: {
  smartPlaylist: SmartPlaylistDetail;
  schema: RuleSchema;
}) {
  const navigate = useNavigate();
  const update = useUpdateSmartPlaylist(smartPlaylist.id);
  const [draft, setDraft] = useState<RuleGroup>(smartPlaylist.rules);

  const saved = useMemo(
    () => JSON.stringify(smartPlaylist.rules),
    [smartPlaylist.rules],
  );
  const isDirty = JSON.stringify(draft) !== saved;
  const unfinished = incompleteCount(draft, schema);
  const ruleCount = countRules(draft);
  const detailPath = `/smart-playlists/${smartPlaylist.id}`;

  useEffect(() => {
    if (!isDirty) return;

    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const handlers: RuleTreeHandlers = useMemo(
    () => ({
      onChangeNode: (path, node) => setDraft((d) => updateNode(d, path, node)),
      onAddNode: (path, node) => setDraft((d) => addNode(d, path, node)),
      onRemoveNode: (path) => setDraft((d) => removeNode(d, path)),
      onMoveNode: (path, delta) => setDraft((d) => moveNode(d, path, delta)),
      onWrapNode: (path) => setDraft((d) => wrapInGroup(d, path)),
      onDuplicateNode: (path) => setDraft((d) => duplicateNode(d, path)),
      onUnwrapGroup: (path) => setDraft((d) => unwrapGroup(d, path)),
    }),
    [],
  );

  function cancel() {
    if (isDirty && !window.confirm(LEAVE_PROMPT)) return;
    navigate(detailPath);
  }

  function save() {
    update.mutate({ rules: draft }, { onSuccess: () => navigate(detailPath) });
  }

  return (
    <div className="pb-24">
      <PageHeader
        title={`Edit rules — ${smartPlaylist.name}`}
        description="Tracks from the source playlists that match these rules will fill the target playlist."
      />

      {update.isError && (
        <p className="mb-4 text-sm text-destructive">{apiErrorMessage(update.error)}</p>
      )}

      <RuleGroupCard
        group={draft}
        root={draft}
        schema={schema}
        path={[]}
        editable
        handlers={handlers}
      />

      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-6 py-3">
          <p className="text-sm text-muted-foreground">
            {ruleCount} {ruleCount === 1 ? "rule" : "rules"}
            {isDirty && " · unsaved changes"}
            {unfinished > 0 &&
              ` · ${unfinished} ${unfinished === 1 ? "rule needs" : "rules need"} a value`}
          </p>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={cancel} disabled={update.isPending}>
              Cancel
            </Button>
            <Button
              onClick={save}
              disabled={!isDirty || unfinished > 0 || update.isPending}
              title={
                unfinished > 0 ? "Finish every rule before saving." : undefined
              }
            >
              <SaveIcon /> {update.isPending ? "Saving…" : "Save rules"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
