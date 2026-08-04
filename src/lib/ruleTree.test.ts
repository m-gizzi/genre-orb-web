import { describe, it, expect } from "vitest";
import type { RuleCondition, RuleGroup } from "@/api/client";
import { ruleSchema as schema } from "@/test/ruleSchema";
import {
  addNode,
  arityOf,
  canonicalRules,
  coerceValue,
  countNodes,
  countRules,
  depthOf,
  duplicateNode,
  fieldSpec,
  fitsField,
  groupAt,
  incompleteCount,
  isConditionComplete,
  isRuleGroup,
  isValueComplete,
  moveNode,
  newCondition,
  newGroup,
  nodeAt,
  pathLabel,
  removeNode,
  toDraft,
  toRules,
  unwrapGroup,
  updateNode,
  wrapInGroup,
  type DraftCondition,
  type DraftGroup,
} from "./ruleTree";

/** Draft nodes need a uid; these factories keep the tests readable. */
let testUid = 0;
const uid = () => `t${(testUid += 1)}`;

const cond = (over: Partial<RuleCondition> = {}): DraftCondition => ({
  uid: uid(),
  field: "genre",
  operator: "equals",
  value: "metal",
  ...over,
});

const grp = (
  rules: DraftGroup["rules"] = [],
  over: Partial<Omit<DraftGroup, "rules" | "uid">> = {},
): DraftGroup => ({ uid: uid(), match: "all", rules, ...over });

const shape = (group: DraftGroup): RuleGroup => toRules(group);

const field = (key: string) => fieldSpec(schema, key)!;

describe("countRules", () => {
  it("counts an empty rule set as nothing to evaluate", () => {
    expect(countRules(grp())).toBe(0);
  });

  it("counts flat conditions", () => {
    expect(countRules(grp([cond(), cond()]))).toBe(2);
  });

  it("counts a nested group and everything inside it", () => {
    const rules = grp([cond(), grp([cond(), cond()], { match: "any" })]);

    // The nested group is a node in its own right, plus its two conditions.
    expect(countRules(rules)).toBe(4);
  });

  it("descends through several levels", () => {
    const rules = grp([
      grp([grp([cond()])], { match: "any", not: true }),
    ]);

    expect(countRules(rules)).toBe(3);
  });

  it("counts an empty nested group as one node", () => {
    expect(countRules(grp([grp([], { match: "any" })]))).toBe(1);
  });
});

describe("countNodes", () => {
  it("counts the root against the cap, matching the validator", () => {
    expect(countNodes(grp())).toBe(1);
    expect(countNodes(grp([cond(), cond()]))).toBe(3);
  });
});

describe("depthOf / pathLabel", () => {
  it("puts the root group at depth 1", () => {
    expect(depthOf([])).toBe(1);
    expect(depthOf([0])).toBe(2);
    expect(depthOf([0, 3, 1])).toBe(4);
  });

  it("labels a path the way the server numbers it in errors", () => {
    expect(pathLabel([])).toBe("");
    expect(pathLabel([0])).toBe("1");
    expect(pathLabel([1, 0, 2])).toBe("2.1.3");
  });
});

describe("isRuleGroup", () => {
  it("distinguishes groups from conditions", () => {
    expect(isRuleGroup(grp())).toBe(true);
    expect(isRuleGroup(cond())).toBe(false);
  });
});

describe("nodeAt / groupAt", () => {
  const inner = cond({ value: "b" });
  const nested = grp([inner], { match: "any" });
  const root = grp([cond({ value: "a" }), nested]);

  it("returns the root for an empty path", () => {
    expect(nodeAt(root, [])).toBe(root);
  });

  it("walks into nested groups", () => {
    expect(nodeAt(root, [1, 0])).toBe(inner);
  });

  it("returns undefined for a path that leaves the tree", () => {
    expect(nodeAt(root, [5])).toBeUndefined();
    expect(nodeAt(root, [0, 0])).toBeUndefined();
  });

  it("groupAt refuses to return a condition", () => {
    expect(groupAt(root, [1])).toBe(nested);
    expect(groupAt(root, [0])).toBeUndefined();
  });
});

describe("addNode", () => {
  it("appends to the root", () => {
    const next = addNode(grp(), [], cond());

    expect(shape(next).rules).toEqual([
      { field: "genre", operator: "equals", value: "metal" },
    ]);
  });

  it("appends into a nested group without touching siblings", () => {
    const sibling = cond({ value: "keep" });
    const root = grp([sibling, grp([], { match: "any" })]);

    const next = addNode(root, [1], cond({ value: "new" }));

    expect(groupAt(next, [1])?.rules).toHaveLength(1);
    expect(next.rules[0]).toBe(sibling);
  });

  it("does not mutate the input tree", () => {
    const root = grp();

    addNode(root, [], cond());

    expect(root.rules).toEqual([]);
  });
});

describe("updateNode", () => {
  it("replaces a nested condition", () => {
    const root = grp([grp([cond({ value: "old" })], { match: "any" })]);

    const next = updateNode(root, [0, 0], cond({ value: "new" }));

    expect((nodeAt(next, [0, 0]) as DraftCondition).value).toBe("new");
  });

  it("replaces the root when given a group", () => {
    const replacement = grp([cond()], { match: "any" });

    expect(updateNode(grp(), [], replacement)).toBe(replacement);
  });

  it("refuses to replace the root with a condition", () => {
    const root = grp();

    expect(updateNode(root, [], cond())).toBe(root);
  });
});

describe("removeNode", () => {
  it("removes a node from its parent", () => {
    const keep = cond({ value: "b" });
    const root = grp([cond({ value: "a" }), keep]);

    expect(removeNode(root, [0]).rules).toEqual([keep]);
  });

  it("is a no-op on the root path", () => {
    const root = grp([cond()]);

    expect(removeNode(root, [])).toBe(root);
  });

  it("leaves the surviving nodes' uids untouched, so their rows keep their state", () => {
    const b = cond({ value: "b" });
    const c = cond({ value: "c" });
    const root = grp([cond({ value: "a" }), b, c]);

    const next = removeNode(root, [0]);

    expect(next.rules.map((node) => node.uid)).toEqual([b.uid, c.uid]);
  });
});

describe("duplicateNode", () => {
  it("inserts a copy directly after the original", () => {
    const root = grp([cond({ value: "a" }), cond({ value: "b" })]);

    const next = duplicateNode(root, [0]);

    expect(next.rules.map((n) => (n as DraftCondition).value)).toEqual([
      "a",
      "a",
      "b",
    ]);
  });

  it("gives the copy its own uid, so React treats it as a new row", () => {
    const original = cond({ value: "a" });
    const next = duplicateNode(grp([original]), [0]);

    expect(next.rules[1]!.uid).not.toBe(original.uid);
  });

  it("reidentifies a duplicated group's children too", () => {
    const child = cond({ value: "a" });
    const next = duplicateNode(grp([grp([child], { match: "any" })]), [0]);

    expect(groupAt(next, [1])!.rules[0]!.uid).not.toBe(child.uid);
  });

  it("deep-copies a group so the copy edits independently", () => {
    const root = grp([grp([cond({ value: "a" })], { match: "any" })]);

    const next = duplicateNode(root, [0]);
    const edited = updateNode(next, [1, 0], cond({ value: "changed" }));

    expect((nodeAt(edited, [0, 0]) as DraftCondition).value).toBe("a");
    expect((nodeAt(edited, [1, 0]) as DraftCondition).value).toBe("changed");
  });
});

describe("moveNode", () => {
  const build = () =>
    grp([cond({ value: "a" }), cond({ value: "b" }), cond({ value: "c" })]);
  const values = (group: DraftGroup) =>
    group.rules.map((n) => (n as DraftCondition).value);

  it("swaps with the next sibling", () => {
    expect(values(moveNode(build(), [0], 1))).toEqual(["b", "a", "c"]);
  });

  it("swaps with the previous sibling", () => {
    expect(values(moveNode(build(), [2], -1))).toEqual(["a", "c", "b"]);
  });

  it("is a no-op past the first slot", () => {
    expect(values(moveNode(build(), [0], -1))).toEqual(["a", "b", "c"]);
  });

  it("is a no-op past the last slot", () => {
    expect(values(moveNode(build(), [2], 1))).toEqual(["a", "b", "c"]);
  });

  it("carries each node's uid with it, so a moved row keeps its own state", () => {
    const root = build();
    const [a, b] = root.rules;

    const next = moveNode(root, [0], 1);

    expect(next.rules[0]!.uid).toBe(b!.uid);
    expect(next.rules[1]!.uid).toBe(a!.uid);
  });

  it("moves within a nested group only", () => {
    const nested = grp([
      cond({ value: "outer" }),
      grp([cond({ value: "x" }), cond({ value: "y" })], { match: "any" }),
    ]);

    const next = moveNode(nested, [1, 0], 1);

    expect(values(groupAt(next, [1])!)).toEqual(["y", "x"]);
    expect((next.rules[0] as DraftCondition).value).toBe("outer");
  });
});

describe("wrapInGroup", () => {
  it("replaces a condition with a group holding it", () => {
    const root = grp([cond({ value: "a" })]);

    const next = wrapInGroup(root, [0]);

    expect(shape(next).rules[0]).toEqual({
      match: "all",
      rules: [{ field: "genre", operator: "equals", value: "a" }],
    });
  });

  it("gives the new group a uid of its own", () => {
    const next = wrapInGroup(grp([cond()]), [0]);

    expect(groupAt(next, [0])!.uid).toBeTruthy();
  });

  it("refuses to wrap the root", () => {
    const root = grp([cond()]);

    expect(wrapInGroup(root, [])).toBe(root);
  });
});

describe("unwrapGroup", () => {
  it("splices a group's children into its parent in place", () => {
    const root = grp([
      cond({ value: "before" }),
      grp([cond({ value: "x" }), cond({ value: "y" })], { match: "any" }),
      cond({ value: "after" }),
    ]);

    const next = unwrapGroup(root, [1]);

    expect(next.rules.map((n) => (n as DraftCondition).value)).toEqual([
      "before",
      "x",
      "y",
      "after",
    ]);
  });

  it("drops an empty group entirely", () => {
    const keep = cond({ value: "a" });
    const root = grp([keep, grp([], { match: "any" })]);

    expect(unwrapGroup(root, [1]).rules).toEqual([keep]);
  });

  it("refuses to unwrap a condition or the root", () => {
    const root = grp([cond()]);

    expect(unwrapGroup(root, [0])).toBe(root);
    expect(unwrapGroup(root, [])).toBe(root);
  });
});

describe("newCondition / newGroup", () => {
  it("seeds a condition with the field's first operator and no value", () => {
    const created = newCondition(field("duration"));

    expect(created).toMatchObject({
      field: "duration",
      operator: "greater_than",
      value: null,
    });
    expect(created.uid).toBeTruthy();
  });

  it("seeds a group that matches all", () => {
    expect(newGroup()).toMatchObject({ match: "all", rules: [] });
  });

  it("gives every new node a distinct uid", () => {
    expect(newCondition(field("genre")).uid).not.toBe(newGroup().uid);
  });
});

describe("toDraft / toRules", () => {
  const saved: RuleGroup = {
    match: "all",
    rules: [
      { field: "genre", operator: "equals", value: "metal" },
      {
        match: "any",
        not: true,
        rules: [{ field: "year", operator: "greater_than", value: 2020 }],
      },
    ],
  };

  it("stamps every node with a uid on the way in", () => {
    const draft = toDraft(saved);
    const nested = groupAt(draft, [1])!;

    expect(draft.uid).toBeTruthy();
    expect(draft.rules[0]!.uid).toBeTruthy();
    expect(nested.rules[0]!.uid).toBeTruthy();
  });

  it("round-trips a saved rule set unchanged", () => {
    expect(toRules(toDraft(saved))).toEqual(saved);
  });

  it("strips uids from the payload", () => {
    expect(JSON.stringify(toRules(toDraft(saved)))).not.toContain("uid");
  });

  it("drops not: false rather than sending a key the record never had", () => {
    const draft = grp([], { not: false });

    expect(toRules(draft)).toEqual({ match: "all", rules: [] });
  });

  it("keeps not: true", () => {
    expect(toRules(grp([], { not: true }))).toEqual({
      match: "all",
      rules: [],
      not: true,
    });
  });

  it("trims text values", () => {
    const draft = grp([cond({ value: "  metal  " })]);

    expect((toRules(draft).rules[0] as RuleCondition).value).toBe("metal");
  });

  it("trims every entry in a list value", () => {
    const draft = grp([cond({ operator: "in", value: [" a ", "b "] })]);

    expect((toRules(draft).rules[0] as RuleCondition).value).toEqual(["a", "b"]);
  });

  it("leaves non-text values alone", () => {
    const draft = grp([cond({ field: "year", operator: "equals", value: 2020 })]);

    expect((toRules(draft).rules[0] as RuleCondition).value).toBe(2020);
  });
});

describe("canonicalRules", () => {
  it("ignores key order, which Postgres normalizes on the way back", () => {
    const builder: RuleGroup = {
      match: "all",
      rules: [{ field: "genre", operator: "equals", value: "metal" }],
    };
    const fromDatabase = {
      rules: [{ value: "metal", field: "genre", operator: "equals" }],
      match: "all",
    } as RuleGroup;

    expect(canonicalRules(builder)).toBe(canonicalRules(fromDatabase));
  });

  it("still notices a real difference", () => {
    const a: RuleGroup = {
      match: "all",
      rules: [{ field: "genre", operator: "equals", value: "metal" }],
    };
    const b: RuleGroup = {
      match: "any",
      rules: [{ field: "genre", operator: "equals", value: "metal" }],
    };

    expect(canonicalRules(a)).not.toBe(canonicalRules(b));
  });

  it("preserves rule order, which is not a key ordering", () => {
    const a: RuleGroup = { match: "all", rules: [cond0("a"), cond0("b")] };
    const b: RuleGroup = { match: "all", rules: [cond0("b"), cond0("a")] };

    expect(canonicalRules(a)).not.toBe(canonicalRules(b));
  });

  function cond0(value: string): RuleCondition {
    return { field: "genre", operator: "equals", value };
  }
});

describe("fieldSpec / arityOf", () => {
  it("finds a field by key", () => {
    expect(fieldSpec(schema, "year")?.label).toBe("Release year");
    expect(fieldSpec(schema, "bpm")).toBeUndefined();
  });

  it("falls back to a single value for an unknown operator", () => {
    expect(arityOf(schema, "in")).toBe("many");
    expect(arityOf(schema, "mystery")).toBe("one");
  });
});

describe("fitsField", () => {
  it("requires text for a text field, non-blank and within the cap", () => {
    expect(fitsField("metal", field("genre"))).toBe(true);
    expect(fitsField(42, field("genre"))).toBe(false);
    expect(fitsField("   ", field("genre"))).toBe(false);
    expect(fitsField("a".repeat(201), field("genre"))).toBe(false);
  });

  it("requires a whole number inside the field's bounds", () => {
    expect(fitsField(2020, field("year"))).toBe(true);
    expect(fitsField(1899, field("year"))).toBe(false);
    expect(fitsField(2101, field("year"))).toBe(false);
    expect(fitsField(2020.5, field("year"))).toBe(false);
    expect(fitsField("2020", field("year"))).toBe(false);
  });

  it("holds popularity to Spotify's range", () => {
    expect(fitsField(0, field("popularity"))).toBe(true);
    expect(fitsField(100, field("popularity"))).toBe(true);
    expect(fitsField(101, field("popularity"))).toBe(false);
  });

  it("rejects a negative duration", () => {
    expect(fitsField(210_000, field("duration"))).toBe(true);
    expect(fitsField(-1, field("duration"))).toBe(false);
  });

  it("requires a real boolean", () => {
    expect(fitsField(true, field("explicit"))).toBe(true);
    expect(fitsField("true", field("explicit"))).toBe(false);
  });

  it("requires an ISO date that actually exists", () => {
    expect(fitsField("2024-01-15", field("date_added"))).toBe(true);
    expect(fitsField("15/01/2024", field("date_added"))).toBe(false);
    expect(fitsField("2024-02-31", field("date_added"))).toBe(false);
  });
});

describe("isValueComplete", () => {
  const genre = field("genre");
  const year = field("year");
  const dateAdded = field("date_added");

  it("requires a well-typed scalar for one", () => {
    expect(isValueComplete("metal", "one", genre, schema)).toBe(true);
    expect(isValueComplete("", "one", genre, schema)).toBe(false);
    expect(isValueComplete("   ", "one", genre, schema)).toBe(false);
    expect(isValueComplete(null, "one", genre, schema)).toBe(false);
    expect(isValueComplete(42, "one", genre, schema)).toBe(false);
  });

  it("requires exactly two in-order bounds for two", () => {
    expect(isValueComplete([2020, 2024], "two", year, schema)).toBe(true);
    expect(isValueComplete([2020, 2020], "two", year, schema)).toBe(true);
    expect(isValueComplete([2024, 2020], "two", year, schema)).toBe(false);
    expect(isValueComplete([2020], "two", year, schema)).toBe(false);
    expect(isValueComplete([2020, ""], "two", year, schema)).toBe(false);
  });

  it("requires a non-empty list within the cap for many", () => {
    expect(isValueComplete(["a"], "many", genre, schema)).toBe(true);
    expect(isValueComplete([], "many", genre, schema)).toBe(false);
    expect(isValueComplete("a", "many", genre, schema)).toBe(false);

    const overCap = Array.from({ length: schema.max_list_size + 1 }, (_, i) => `a${i}`);
    expect(isValueComplete(overCap, "many", genre, schema)).toBe(false);
  });

  it("requires a positive whole count and a known unit for relative", () => {
    const ok = { count: 30, unit: "days" } as const;

    expect(isValueComplete(ok, "relative", dateAdded, schema)).toBe(true);
    expect(isValueComplete({ count: 0, unit: "days" }, "relative", dateAdded, schema)).toBe(false);
    expect(isValueComplete({ count: 1.5, unit: "days" }, "relative", dateAdded, schema)).toBe(false);
    expect(isValueComplete(null, "relative", dateAdded, schema)).toBe(false);
  });
});

describe("isConditionComplete", () => {
  it("accepts a fully specified condition", () => {
    expect(isConditionComplete(cond(), schema)).toBe(true);
  });

  it("rejects an unknown field", () => {
    expect(isConditionComplete(cond({ field: "bpm" }), schema)).toBe(false);
  });

  it("rejects an operator the field does not offer", () => {
    expect(isConditionComplete(cond({ operator: "between" }), schema)).toBe(false);
  });

  it("rejects a missing value", () => {
    expect(isConditionComplete(cond({ value: null }), schema)).toBe(false);
  });

  it("rejects a value of the wrong primitive type, as the server would", () => {
    expect(
      isConditionComplete(
        { field: "year", operator: "equals", value: "banana" },
        schema,
      ),
    ).toBe(false);
  });

  it("rejects a value outside the field's bounds, as the server would", () => {
    expect(
      isConditionComplete(
        { field: "popularity", operator: "equals", value: 500 },
        schema,
      ),
    ).toBe(false);
  });
});

describe("incompleteCount", () => {
  it("counts unfinished conditions at every depth", () => {
    const root = grp([
      cond(),
      cond({ value: null }),
      grp([cond({ value: "" }), cond({ field: "bpm" }), cond()], { match: "any" }),
    ]);

    expect(incompleteCount(root, schema)).toBe(3);
  });

  it("is zero for a finished tree", () => {
    expect(incompleteCount(grp([cond()]), schema)).toBe(0);
  });

  it("counts an empty nested group, which the server rejects", () => {
    expect(incompleteCount(grp([cond(), grp([], { match: "any" })]), schema)).toBe(1);
  });

  it("does not count an empty root, which is the draft state", () => {
    expect(incompleteCount(grp(), schema)).toBe(0);
  });

  it("counts an empty group and its unfinished siblings separately", () => {
    const root = grp([cond({ value: null }), grp()]);

    expect(incompleteCount(root, schema)).toBe(2);
  });
});

describe("coerceValue", () => {
  it("keeps the value when the arity is unchanged", () => {
    expect(coerceValue("metal", "one", "one")).toBe("metal");
  });

  it("lifts a scalar into a list", () => {
    expect(coerceValue("metal", "one", "many")).toEqual(["metal"]);
  });

  it("collapses a list to its first item", () => {
    expect(coerceValue(["a", "b"], "many", "one")).toBe("a");
    expect(coerceValue([], "many", "one")).toBeNull();
  });

  it("seeds both ends of a range from a scalar", () => {
    expect(coerceValue(2020, "one", "two")).toEqual([2020, 2020]);
  });

  it("trims a longer list down to a range", () => {
    expect(coerceValue(["a", "b", "c"], "many", "two")).toEqual(["a", "b"]);
  });

  it("clears anything that cannot become a relative date", () => {
    expect(coerceValue("metal", "one", "relative")).toBeNull();
  });

  it("clears a relative value that cannot become a scalar", () => {
    expect(coerceValue({ count: 30, unit: "days" }, "relative", "one")).toBeNull();
  });
});
