import type {
  RelativeValue,
  RuleArity,
  RuleCondition,
  RuleConstraints,
  RuleFieldSpec,
  RuleGroup,
  RuleSchema,
  RuleScalar,
  RuleValue,
} from "@/api/client";

export type DraftCondition = RuleCondition & { uid: string };
export type DraftGroup = Omit<RuleGroup, "rules"> & {
  uid: string;
  rules: DraftNode[];
};
export type DraftNode = DraftCondition | DraftGroup;

/** Index path from the root group down to a node. The root itself is []. */
export type RulePath = number[];

let uidCounter = 0;
function nextUid(): string {
  uidCounter += 1;
  return `n${uidCounter}`;
}

export function isRuleGroup<C extends RuleCondition, G extends RuleGroup>(
  node: C | G,
): node is G {
  return "match" in node && "rules" in node;
}

export function countRules(group: RuleGroup): number {
  return group.rules.reduce(
    (total, node) => total + 1 + (isRuleGroup(node) ? countRules(node) : 0),
    0,
  );
}

/** Nodes counted against the schema's max_nodes cap — the root counts too. */
export function countNodes(group: RuleGroup): number {
  return countRules(group) + 1;
}

/** Nodes a subtree contributes to that cap, the node itself included. */
export function subtreeSize(node: RuleCondition | RuleGroup): number {
  return isRuleGroup(node) ? countNodes(node) : 1;
}

/**
 * How many group levels a subtree occupies. A condition occupies none, so
 * wrapping one only adds the wrapper; a group three deep adds three.
 */
export function groupHeight(node: RuleCondition | RuleGroup): number {
  if (!isRuleGroup(node)) return 0;

  return 1 + Math.max(0, ...node.rules.map(groupHeight));
}

/** Depth of the group at `path`, where the root group sits at depth 1. */
export function depthOf(path: RulePath): number {
  return path.length + 1;
}

export function pathLabel(path: RulePath): string {
  return path.map((index) => index + 1).join(".");
}

export function nodeAt(root: DraftGroup, path: RulePath): DraftNode | undefined {
  return path.reduce<DraftNode | undefined>(
    (node, index) =>
      node && isRuleGroup(node) ? node.rules[index] : undefined,
    root,
  );
}

export function groupAt(
  root: DraftGroup,
  path: RulePath,
): DraftGroup | undefined {
  const node = nodeAt(root, path);
  return node && isRuleGroup(node) ? node : undefined;
}

/** The group a node hangs off. Undefined for the root, which has no parent. */
export function parentOf(
  root: DraftGroup,
  path: RulePath,
): DraftGroup | undefined {
  return path.length === 0 ? undefined : groupAt(root, path.slice(0, -1));
}

/** Whether a node can shift by `delta` among its siblings. */
export function canMove(
  root: DraftGroup,
  path: RulePath,
  delta: number,
): boolean {
  const index = path[path.length - 1];
  const siblings = parentOf(root, path)?.rules;
  if (index === undefined || !siblings) return false;

  const target = index + delta;
  return target >= 0 && target < siblings.length;
}

/**
 * Rebuild the tree with `transform` applied to the group at `path`. Every node
 * on the way down is copied, so React sees new references exactly where the
 * tree changed and nowhere else.
 */
function mapGroup(
  root: DraftGroup,
  path: RulePath,
  transform: (group: DraftGroup) => DraftGroup,
): DraftGroup {
  const [index, ...rest] = path;
  if (index === undefined) return transform(root);

  const child = root.rules[index];
  if (!child || !isRuleGroup(child)) return root;

  const rules = [...root.rules];
  rules[index] = mapGroup(child, rest, transform);
  return { ...root, rules };
}

/** Split a node path into its parent group path and the child's index. */
function splitPath(path: RulePath): { parent: RulePath; index: number } | null {
  const index = path[path.length - 1];
  if (index === undefined) return null;

  return { parent: path.slice(0, -1), index };
}

function mapChildren(
  root: DraftGroup,
  path: RulePath,
  transform: (rules: DraftNode[], index: number) => DraftNode[],
): DraftGroup {
  const split = splitPath(path);
  if (!split) return root;

  return mapGroup(root, split.parent, (group) => ({
    ...group,
    rules: transform(group.rules, split.index),
  }));
}

export function blankCondition(field: RuleFieldSpec): RuleCondition {
  return {
    field: field.key,
    operator: field.operators[0]?.key ?? "equals",
    value: null,
  };
}

export function newCondition(field: RuleFieldSpec): DraftCondition {
  return { ...blankCondition(field), uid: nextUid() };
}

export function newGroup(): DraftGroup {
  return { uid: nextUid(), match: "all", rules: [] };
}

export function toDraft(group: RuleGroup): DraftGroup {
  return {
    ...group,
    uid: nextUid(),
    rules: group.rules.map((node) =>
      isRuleGroup(node) ? toDraft(node) : { ...node, uid: nextUid() },
    ),
  };
}

export function toRules(group: DraftGroup): RuleGroup {
  const rules = group.rules.map<RuleCondition | RuleGroup>((node) =>
    isRuleGroup(node)
      ? toRules(node)
      : { field: node.field, operator: node.operator, value: trimValue(node.value) },
  );

  return group.not
    ? { match: group.match, rules, not: true }
    : { match: group.match, rules };
}

function trimValue(value: RuleValue): RuleValue {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) {
    return value.map((item) => (typeof item === "string" ? item.trim() : item));
  }
  return value;
}

export function canonicalRules(rules: RuleGroup): string {
  return JSON.stringify(rules, (_key, value: unknown) =>
    value && typeof value === "object" && !Array.isArray(value)
      ? Object.fromEntries(
          Object.entries(value).sort(([a], [b]) => a.localeCompare(b)),
        )
      : value,
  );
}

export function addNode(
  root: DraftGroup,
  groupPath: RulePath,
  node: DraftNode,
): DraftGroup {
  return mapGroup(root, groupPath, (group) => ({
    ...group,
    rules: [...group.rules, node],
  }));
}

export function updateNode(
  root: DraftGroup,
  path: RulePath,
  next: DraftNode,
): DraftGroup {
  if (path.length === 0) {
    return isRuleGroup(next) ? next : root;
  }
  return mapChildren(root, path, (rules, index) =>
    rules.map((node, i) => (i === index ? next : node)),
  );
}

export function removeNode(root: DraftGroup, path: RulePath): DraftGroup {
  return mapChildren(root, path, (rules, index) =>
    rules.filter((_, i) => i !== index),
  );
}

/** Fresh uids throughout, so the copy is a distinct node to React. */
function reidentify(node: DraftNode): DraftNode {
  if (!isRuleGroup(node)) return { ...node, uid: nextUid() };

  return { ...node, uid: nextUid(), rules: node.rules.map(reidentify) };
}

export function duplicateNode(root: DraftGroup, path: RulePath): DraftGroup {
  const node = nodeAt(root, path);
  if (!node) return root;

  const copy = reidentify(structuredClone(node));
  return mapChildren(root, path, (rules, index) => [
    ...rules.slice(0, index + 1),
    copy,
    ...rules.slice(index + 1),
  ]);
}

/** Move a node one slot among its siblings. Out-of-range moves are no-ops. */
export function moveNode(
  root: DraftGroup,
  path: RulePath,
  delta: number,
): DraftGroup {
  return mapChildren(root, path, (rules, index) => {
    const target = index + delta;
    const moving = rules[index];
    const displaced = rules[target];
    if (!moving || !displaced) return rules;

    const reordered = [...rules];
    reordered[index] = displaced;
    reordered[target] = moving;
    return reordered;
  });
}

/** Replace a node with a new group containing it. */
export function wrapInGroup(root: DraftGroup, path: RulePath): DraftGroup {
  const node = nodeAt(root, path);
  if (!node || path.length === 0) return root;

  return updateNode(root, path, { ...newGroup(), rules: [node] });
}

/** Splice a group's children into its parent, dropping the group itself. */
export function unwrapGroup(root: DraftGroup, path: RulePath): DraftGroup {
  const group = groupAt(root, path);
  if (!group || path.length === 0) return root;

  return mapChildren(root, path, (rules, index) => [
    ...rules.slice(0, index),
    ...group.rules,
    ...rules.slice(index + 1),
  ]);
}

export function fieldSpec(
  schema: RuleSchema,
  key: string,
): RuleFieldSpec | undefined {
  return schema.fields.find((field) => field.key === key);
}

export function arityOf(schema: RuleSchema, operator: string): RuleArity {
  return schema.operators[operator]?.arity ?? "one";
}

export function isScalar(value: unknown): value is RuleScalar {
  return (
    (typeof value === "string" && value.trim() !== "") ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

export function isRelative(value: unknown): value is RelativeValue {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }
  const { count, unit } = value as Partial<RelativeValue>;
  return Number.isInteger(count) && (count ?? 0) > 0 && typeof unit === "string";
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isRealDate(value: string): boolean {
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function withinBounds(value: number, constraints: RuleConstraints): boolean {
  return (
    value >= (constraints.min ?? -Infinity) &&
    value <= (constraints.max ?? Infinity)
  );
}

export function fitsField(value: RuleScalar, field: RuleFieldSpec): boolean {
  const { constraints } = field;

  switch (field.value_type) {
    case "text":
      return (
        typeof value === "string" &&
        value.trim() !== "" &&
        value.length <= (constraints.max_length ?? Infinity)
      );
    case "number":
    case "duration":
      return Number.isInteger(value) && withinBounds(value as number, constraints);
    case "boolean":
      return typeof value === "boolean";
    case "date":
      return typeof value === "string" && ISO_DATE.test(value) && isRealDate(value);
    default:
      return false;
  }
}

export function isValueComplete(
  value: RuleValue,
  arity: RuleArity,
  field: RuleFieldSpec,
  schema: RuleSchema,
): boolean {
  switch (arity) {
    case "one":
      return isScalar(value) && fitsField(value, field);
    case "two":
      if (!Array.isArray(value) || value.length !== 2) return false;
      if (!value.every((item) => isScalar(item) && fitsField(item, field))) {
        return false;
      }
      return value[0]! <= value[1]!;
    case "many":
      return (
        Array.isArray(value) &&
        value.length > 0 &&
        value.length <= schema.max_list_size &&
        value.every((item) => isScalar(item) && fitsField(item, field))
      );
    case "relative":
      return isRelative(value) && schema.relative_units.includes(value.unit);
  }
}

export function isConditionComplete(
  condition: RuleCondition,
  schema: RuleSchema,
): boolean {
  const field = fieldSpec(schema, condition.field);
  if (!field) return false;
  if (!field.operators.some((op) => op.key === condition.operator)) return false;

  return isValueComplete(
    condition.value,
    arityOf(schema, condition.operator),
    field,
    schema,
  );
}

/**
 * Wrapping adds a group above the node, so the node's own levels move down and
 * the wrapper itself counts against the node cap.
 */
export function canWrapNode(
  root: DraftGroup,
  path: RulePath,
  schema: RuleSchema,
): boolean {
  const node = nodeAt(root, path);
  if (!node || path.length === 0) return false;
  if (countNodes(root) + 1 > schema.max_nodes) return false;

  return depthOf(path) + groupHeight(node) <= schema.max_depth;
}

/** Duplicating copies the whole subtree, so all of it counts against the cap. */
export function canDuplicateNode(
  root: DraftGroup,
  path: RulePath,
  schema: RuleSchema,
): boolean {
  const node = nodeAt(root, path);
  if (!node || path.length === 0) return false;

  return countNodes(root) + subtreeSize(node) <= schema.max_nodes;
}

/**
 * Limits the server enforces on the shape of the tree. The buttons above stop
 * you reaching these, so anything here came from a rule set built elsewhere.
 */
export function structuralErrors(
  root: DraftGroup,
  schema: RuleSchema,
): string[] {
  const errors: string[] = [];
  const nodes = countNodes(root);
  const height = groupHeight(root);

  if (nodes > schema.max_nodes) {
    errors.push(
      `A rule set can hold at most ${schema.max_nodes} rules — this one has ${nodes}.`,
    );
  }
  if (height > schema.max_depth) {
    errors.push(
      `Groups can nest ${schema.max_depth} levels deep — this one reaches ${height}.`,
    );
  }

  return errors;
}

export function incompleteCount(group: DraftGroup, schema: RuleSchema): number {
  return group.rules.reduce((total, node) => {
    if (!isRuleGroup(node)) {
      return total + (isConditionComplete(node, schema) ? 0 : 1);
    }
    const empty = node.rules.length === 0 ? 1 : 0;
    return total + empty + incompleteCount(node, schema);
  }, 0);
}

/**
 * Carry a value across an operator change where possible: a scalar becomes a
 * one-item list, a list collapses to its first item. Anything that can't be
 * carried is cleared rather than silently kept in the wrong shape.
 */
export function coerceValue(
  value: RuleValue,
  from: RuleArity,
  to: RuleArity,
): RuleValue {
  if (from === to) return value;

  if (to === "many") {
    if (isScalar(value)) return [value];
    return Array.isArray(value) ? value : null;
  }

  if (to === "one" && Array.isArray(value)) {
    return isScalar(value[0]) ? value[0] : null;
  }

  if (to === "two") {
    if (Array.isArray(value)) return value.slice(0, 2) as RuleScalar[];
    return isScalar(value) ? [value, value] : null;
  }

  if (to === "relative") return null;

  return isScalar(value) ? value : null;
}

const labelCache = new WeakMap<RuleSchema, Record<string, string>>();

export function fieldLabels(schema: RuleSchema): Record<string, string> {
  const cached = labelCache.get(schema);
  if (cached) return cached;

  const labels = Object.fromEntries(
    schema.fields.map((field) => [field.key, field.label]),
  );
  labelCache.set(schema, labels);
  return labels;
}

const operatorLabelCache = new WeakMap<
  RuleFieldSpec,
  Record<string, string>
>();

export function operatorLabels(field: RuleFieldSpec): Record<string, string> {
  const cached = operatorLabelCache.get(field);
  if (cached) return cached;

  const labels = Object.fromEntries(
    field.operators.map((op) => [op.key, op.label]),
  );
  operatorLabelCache.set(field, labels);
  return labels;
}
