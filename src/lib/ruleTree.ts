import type {
  RelativeValue,
  RuleArity,
  RuleCondition,
  RuleFieldSpec,
  RuleGroup,
  RuleSchema,
  RuleScalar,
  RuleValue,
} from "@/api/client";

export type RuleNode = RuleCondition | RuleGroup;

/** Index path from the root group down to a node. The root itself is []. */
export type RulePath = number[];

export function isRuleGroup(node: RuleNode): node is RuleGroup {
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

/** Depth of the group at `path`, where the root group sits at depth 1. */
export function depthOf(path: RulePath): number {
  return path.length + 1;
}

export function nodeAt(root: RuleGroup, path: RulePath): RuleNode | undefined {
  return path.reduce<RuleNode | undefined>(
    (node, index) =>
      node && isRuleGroup(node) ? node.rules[index] : undefined,
    root,
  );
}

export function groupAt(root: RuleGroup, path: RulePath): RuleGroup | undefined {
  const node = nodeAt(root, path);
  return node && isRuleGroup(node) ? node : undefined;
}

/** The group a node hangs off. Undefined for the root, which has no parent. */
export function parentOf(
  root: RuleGroup,
  path: RulePath,
): RuleGroup | undefined {
  return path.length === 0 ? undefined : groupAt(root, path.slice(0, -1));
}

/** Whether a node can shift by `delta` among its siblings. */
export function canMove(
  root: RuleGroup,
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
  root: RuleGroup,
  path: RulePath,
  transform: (group: RuleGroup) => RuleGroup,
): RuleGroup {
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
  root: RuleGroup,
  path: RulePath,
  transform: (rules: RuleNode[], index: number) => RuleNode[],
): RuleGroup {
  const split = splitPath(path);
  if (!split) return root;

  return mapGroup(root, split.parent, (group) => ({
    ...group,
    rules: transform(group.rules, split.index),
  }));
}

export function newCondition(field: RuleFieldSpec): RuleCondition {
  return { field: field.key, operator: field.operators[0]?.key ?? "equals", value: null };
}

export function newGroup(): RuleGroup {
  return { match: "all", rules: [] };
}

export function addNode(
  root: RuleGroup,
  groupPath: RulePath,
  node: RuleNode,
): RuleGroup {
  return mapGroup(root, groupPath, (group) => ({
    ...group,
    rules: [...group.rules, node],
  }));
}

export function updateNode(
  root: RuleGroup,
  path: RulePath,
  next: RuleNode,
): RuleGroup {
  if (path.length === 0) {
    return isRuleGroup(next) ? next : root;
  }
  return mapChildren(root, path, (rules, index) =>
    rules.map((node, i) => (i === index ? next : node)),
  );
}

export function removeNode(root: RuleGroup, path: RulePath): RuleGroup {
  return mapChildren(root, path, (rules, index) =>
    rules.filter((_, i) => i !== index),
  );
}

export function duplicateNode(root: RuleGroup, path: RulePath): RuleGroup {
  const node = nodeAt(root, path);
  if (!node) return root;

  const copy = structuredClone(node);
  return mapChildren(root, path, (rules, index) => [
    ...rules.slice(0, index + 1),
    copy,
    ...rules.slice(index + 1),
  ]);
}

/** Move a node one slot among its siblings. Out-of-range moves are no-ops. */
export function moveNode(
  root: RuleGroup,
  path: RulePath,
  delta: number,
): RuleGroup {
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
export function wrapInGroup(root: RuleGroup, path: RulePath): RuleGroup {
  const node = nodeAt(root, path);
  if (!node || path.length === 0) return root;

  return updateNode(root, path, { match: "all", rules: [node] });
}

/** Splice a group's children into its parent, dropping the group itself. */
export function unwrapGroup(root: RuleGroup, path: RulePath): RuleGroup {
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

function isScalar(value: unknown): value is RuleScalar {
  return (
    (typeof value === "string" && value !== "") ||
    typeof value === "number" ||
    typeof value === "boolean"
  );
}

function isRelative(value: unknown): value is RelativeValue {
  if (typeof value !== "object" || value === null) return false;
  const { count, unit } = value as Partial<RelativeValue>;
  return Number.isInteger(count) && (count ?? 0) > 0 && typeof unit === "string";
}

/** Mirrors RuleSetValidator's shape checks so Save can be gated client-side. */
export function isValueComplete(value: RuleValue, arity: RuleArity): boolean {
  switch (arity) {
    case "one":
      return isScalar(value);
    case "two":
      return Array.isArray(value) && value.length === 2 && value.every(isScalar);
    case "many":
      return Array.isArray(value) && value.length > 0 && value.every(isScalar);
    case "relative":
      return isRelative(value);
  }
}

export function isConditionComplete(
  condition: RuleCondition,
  schema: RuleSchema,
): boolean {
  const field = fieldSpec(schema, condition.field);
  if (!field) return false;
  if (!field.operators.some((op) => op.key === condition.operator)) return false;

  return isValueComplete(condition.value, arityOf(schema, condition.operator));
}

/** Conditions that would be rejected on save, anywhere in the tree. */
export function incompleteCount(group: RuleGroup, schema: RuleSchema): number {
  return group.rules.reduce((total, node) => {
    if (isRuleGroup(node)) return total + incompleteCount(node, schema);
    return total + (isConditionComplete(node, schema) ? 0 : 1);
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
