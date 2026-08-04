import { useEffect, useMemo, useRef, useState } from "react";
import { useBlocker, useNavigate, useParams } from "react-router-dom";
import { SaveIcon } from "lucide-react";
import {
  apiErrorMessages,
  type RuleSchema,
  type SmartPlaylistDetail,
} from "@/api/client";
import { useSmartPlaylist, useUpdateSmartPlaylist } from "@/hooks/useSmartPlaylists";
import { useRuleSchema } from "@/hooks/useRuleSchema";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/catalog";
import { RuleGroupCard, type RuleTreeHandlers } from "@/components/rules";
import {
  addNode,
  canonicalRules,
  countRules,
  duplicateNode,
  incompleteCount,
  moveNode,
  removeNode,
  structuralErrors,
  toDraft,
  toRules,
  unwrapGroup,
  updateNode,
  wrapInGroup,
  type DraftGroup,
} from "@/lib/ruleTree";

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
  const [draft, setDraft] = useState<DraftGroup>(() => toDraft(smartPlaylist.rules));

  const saved = useMemo(
    () => canonicalRules(smartPlaylist.rules),
    [smartPlaylist.rules],
  );
  const payload = toRules(draft);
  const isDirty = canonicalRules(payload) !== saved;
  const unfinished = incompleteCount(draft, schema);
  const structural = structuralErrors(draft, schema);
  const ruleCount = countRules(draft);
  const detailPath = `/smart-playlists/${smartPlaylist.id}`;
  const blocked = unfinished > 0 || structural.length > 0;

  // Covers closing the tab; useBlocker below covers navigating within the app.
  useEffect(() => {
    if (!isDirty) return;

    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [isDirty]);

  const savedAndLeaving = useRef(false);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty &&
      !savedAndLeaving.current &&
      currentLocation.pathname !== nextLocation.pathname,
  );

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

  function save() {
    update.mutate(
      { rules: payload },
      {
        onSuccess: () => {
          savedAndLeaving.current = true;
          navigate(detailPath);
        },
      },
    );
  }

  return (
    <div className="pb-24">
      <PageHeader
        title={`Edit rules — ${smartPlaylist.name}`}
        description="Tracks from the source playlists that match these rules will fill the target playlist."
      />

      {update.isError && (
        <ul className="mb-4 space-y-1">
          {apiErrorMessages(update.error).map((message, index) => (
            <li key={`${index}:${message}`} className="text-sm text-destructive">
              {message}
            </li>
          ))}
        </ul>
      )}

      {structural.length > 0 && (
        <ul className="mb-4 space-y-1">
          {structural.map((message) => (
            <li key={message} className="text-sm text-destructive">
              {message}
            </li>
          ))}
        </ul>
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
              ` · ${unfinished} ${unfinished === 1 ? "rule needs" : "rules need"} finishing`}
          </p>
          <div className="ml-auto flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(detailPath)}
              disabled={update.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={save}
              disabled={!isDirty || blocked || update.isPending}
              title={
                blocked ? "Finish every rule before saving." : undefined
              }
            >
              <SaveIcon /> {update.isPending ? "Saving…" : "Save rules"}
            </Button>
          </div>
        </div>
      </div>

      <Dialog
        open={blocker.state === "blocked"}
        onOpenChange={(open) => {
          if (!open) blocker.reset?.();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Discard your unsaved rule changes?</DialogTitle>
            <DialogDescription>
              {ruleCount} {ruleCount === 1 ? "rule is" : "rules are"} in this draft and
              haven't been saved. Leaving now loses the changes.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => blocker.reset?.()}>
              Keep editing
            </Button>
            <Button variant="destructive" onClick={() => blocker.proceed?.()}>
              Discard changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
