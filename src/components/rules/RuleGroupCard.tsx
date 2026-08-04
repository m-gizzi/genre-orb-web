import { PlusIcon, UngroupIcon } from "lucide-react";
import type { RuleMatch, RuleSchema } from "@/api/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  canDuplicateNode,
  canMove,
  canWrapNode,
  countNodes,
  depthOf,
  isRuleGroup,
  newCondition,
  newGroup,
  pathLabel,
  type DraftGroup,
  type DraftNode,
  type RulePath,
} from "@/lib/ruleTree";
import { cn } from "@/lib/utils";
import { RuleConditionRow, RowMenu, type RowActions } from "./RuleConditionRow";

const MATCH_LABELS: Record<RuleMatch, string> = {
  all: "all",
  any: "any",
};

const NOT_HINT =
  "Inverted — excludes tracks that match this group instead of including them.";

export interface RuleTreeHandlers {
  onChangeNode: (path: RulePath, node: DraftNode) => void;
  onAddNode: (path: RulePath, node: DraftNode) => void;
  onRemoveNode: (path: RulePath) => void;
  onMoveNode: (path: RulePath, delta: number) => void;
  onWrapNode: (path: RulePath) => void;
  onDuplicateNode: (path: RulePath) => void;
  onUnwrapGroup: (path: RulePath) => void;
}

interface GroupShape {
  group: DraftGroup;
  root: DraftGroup;
  schema: RuleSchema;
  path: RulePath;
}

export type RuleGroupCardProps = GroupShape &
  ({ editable: true; handlers: RuleTreeHandlers } | { editable: false });

export function RuleGroupCard(props: RuleGroupCardProps) {
  if (!props.editable) return <ReadOnlyGroup {...props} />;

  return <EditableGroup {...props} />;
}

function EditableGroup({
  group,
  root,
  schema,
  path,
  handlers,
}: GroupShape & { handlers: RuleTreeHandlers }) {
  const isRoot = path.length === 0;
  const depth = depthOf(path);
  const atMaxDepth = depth >= schema.max_depth;
  const atMaxNodes = countNodes(root) >= schema.max_nodes;
  const isEmpty = group.rules.length === 0;
  const flagEmpty = isEmpty && !isRoot;

  const groupActions: RowActions = {
    onMove: (delta) => handlers.onMoveNode(path, delta),
    onWrap: () => handlers.onWrapNode(path),
    onDuplicate: () => handlers.onDuplicateNode(path),
    onRemove: () => handlers.onRemoveNode(path),
    canMoveUp: canMove(root, path, -1),
    canMoveDown: canMove(root, path, 1),
    canWrap: canWrapNode(root, path, schema),
    canDuplicate: canDuplicateNode(root, path, schema),
  };

  return (
    <section
      className={cn(
        "rounded-xl border p-3",
        isRoot ? "bg-card" : "mt-1 bg-muted/40",
        flagEmpty && "border-destructive/40 bg-destructive/5",
      )}
      aria-label={isRoot ? "Rules" : `Nested group ${pathLabel(path)}`}
    >
      <header className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Match</span>
        <Select
          items={MATCH_LABELS}
          value={group.match}
          onValueChange={(match) =>
            handlers.onChangeNode(path, { ...group, match: match as RuleMatch })
          }
        >
          <SelectTrigger
            size="sm"
            className="w-[5.5rem]"
            aria-label={isRoot ? "Match type" : `Match type for group ${pathLabel(path)}`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {schema.match_types.map((match) => (
              <SelectItem key={match} value={match}>
                {MATCH_LABELS[match]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">of the following</span>

        {!isRoot && (
          <>
            <Button
              size="sm"
              variant={group.not ? "default" : "outline"}
              aria-pressed={Boolean(group.not)}
              aria-label={`Invert group ${pathLabel(path)}`}
              onClick={() =>
                handlers.onChangeNode(path, { ...group, not: !group.not })
              }
            >
              NOT
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handlers.onUnwrapGroup(path)}
            >
              <UngroupIcon /> Ungroup
            </Button>
            <RowMenu label={`group ${pathLabel(path)}`} actions={groupActions} />
          </>
        )}
      </header>

      {/* The height is reserved either way, so toggling NOT doesn't shift the
          rules below it. */}
      {!isRoot && (
        <p className="mt-1.5 min-h-4 text-xs text-muted-foreground">
          {group.not ? NOT_HINT : ""}
        </p>
      )}

      {isEmpty ? (
        <EmptyGroup isRoot={isRoot} />
      ) : (
        <ul className="mt-2 space-y-1">
          {group.rules.map((node, index) => (
            <ChildNode
              key={node.uid}
              node={node}
              root={root}
              schema={schema}
              path={[...path, index]}
              handlers={handlers}
            />
          ))}
        </ul>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <AddButton
          label="Condition"
          disabled={atMaxNodes}
          disabledHint={`A rule set can hold at most ${schema.max_nodes} rules.`}
          onClick={() => {
            const first = schema.fields[0];
            if (first) handlers.onAddNode(path, newCondition(first));
          }}
        />
        <AddButton
          label="Group"
          disabled={atMaxNodes || atMaxDepth}
          disabledHint={
            atMaxDepth
              ? `Groups can nest ${schema.max_depth} levels deep.`
              : `A rule set can hold at most ${schema.max_nodes} rules.`
          }
          onClick={() => handlers.onAddNode(path, newGroup())}
        />
      </div>
    </section>
  );
}

interface ChildNodeProps {
  node: DraftNode;
  root: DraftGroup;
  schema: RuleSchema;
  path: RulePath;
  handlers: RuleTreeHandlers;
}

function ChildNode({ node, root, schema, path, handlers }: ChildNodeProps) {
  if (isRuleGroup(node)) {
    return (
      <li>
        <RuleGroupCard
          group={node}
          root={root}
          schema={schema}
          path={path}
          editable
          handlers={handlers}
        />
      </li>
    );
  }

  return (
    <RuleConditionRow
      condition={node}
      schema={schema}
      path={path}
      editable
      onChange={(next) => handlers.onChangeNode(path, { ...next, uid: node.uid })}
      actions={{
        onMove: (delta) => handlers.onMoveNode(path, delta),
        onWrap: () => handlers.onWrapNode(path),
        onDuplicate: () => handlers.onDuplicateNode(path),
        onRemove: () => handlers.onRemoveNode(path),
        canMoveUp: canMove(root, path, -1),
        canMoveDown: canMove(root, path, 1),
        canWrap: canWrapNode(root, path, schema),
        canDuplicate: canDuplicateNode(root, path, schema),
      }}
    />
  );
}

function ReadOnlyGroup({ group, root, schema, path }: GroupShape) {
  const isRoot = path.length === 0;
  const heading = `${group.not ? "Exclude tracks matching" : "Match"} ${group.match.toUpperCase()} of`;

  return (
    <section
      className={cn("rounded-xl border p-3", isRoot ? "bg-card" : "mt-1 bg-muted/40")}
    >
      <p className="text-sm font-medium">{heading}</p>
      {group.rules.length === 0 ? (
        <p className="mt-1.5 text-sm text-muted-foreground">Nothing in this group.</p>
      ) : (
        <ul className="mt-1.5 space-y-1">
          {group.rules.map((node, index) =>
            isRuleGroup(node) ? (
              <li key={node.uid}>
                <RuleGroupCard
                  group={node}
                  root={root}
                  schema={schema}
                  path={[...path, index]}
                  editable={false}
                />
              </li>
            ) : (
              <RuleConditionRow
                key={node.uid}
                condition={node}
                schema={schema}
                path={[...path, index]}
                editable={false}
              />
            ),
          )}
        </ul>
      )}
    </section>
  );
}

function EmptyGroup({ isRoot }: { isRoot: boolean }) {
  if (isRoot) {
    return (
      <p className="mt-2 text-sm text-muted-foreground">
        No rules yet. Add a condition to describe which tracks belong here.
      </p>
    );
  }

  return (
    <p className="mt-2 text-sm text-destructive">
      This group is empty — add a condition or ungroup it before saving.
    </p>
  );
}

interface AddButtonProps {
  label: string;
  disabled: boolean;
  disabledHint: string;
  onClick: () => void;
}

function AddButton({ label, disabled, disabledHint, onClick }: AddButtonProps) {
  const button = (
    <Button size="sm" variant="outline" disabled={disabled} onClick={onClick}>
      <PlusIcon /> {label}
    </Button>
  );

  if (!disabled) return button;

  return (
    <Tooltip>
      <TooltipTrigger render={<span tabIndex={0}>{button}</span>} />
      <TooltipContent>{disabledHint}</TooltipContent>
    </Tooltip>
  );
}
