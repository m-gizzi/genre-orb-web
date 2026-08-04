import { describe, it, expect } from "vitest";
import type { RuleCondition, RuleGroup, RuleSchema } from "@/api/client";
import {
  addNode,
  arityOf,
  coerceValue,
  countNodes,
  countRules,
  depthOf,
  duplicateNode,
  fieldSpec,
  groupAt,
  incompleteCount,
  isConditionComplete,
  isRuleGroup,
  isValueComplete,
  moveNode,
  newCondition,
  newGroup,
  nodeAt,
  removeNode,
  unwrapGroup,
  updateNode,
  wrapInGroup,
} from "./ruleTree";

const condition = { field: "genre", operator: "equals", value: "metal" };

const schema: RuleSchema = {
  max_depth: 5,
  max_nodes: 100,
  match_types: ["all", "any"],
  relative_units: ["days", "weeks", "months", "years"],
  operators: {
    equals: { arity: "one" },
    contains: { arity: "one" },
    greater_than: { arity: "one" },
    between: { arity: "two" },
    in: { arity: "many" },
    in_the_last: { arity: "relative" },
  },
  fields: [
    {
      key: "genre",
      label: "Genre",
      value_type: "text",
      suggest: "genres",
      operators: [
        { key: "equals", label: "is" },
        { key: "contains", label: "contains" },
        { key: "in", label: "is any of" },
      ],
    },
    {
      key: "year",
      label: "Release year",
      value_type: "number",
      suggest: null,
      operators: [
        { key: "greater_than", label: "is after" },
        { key: "between", label: "is between" },
      ],
    },
    {
      key: "date_added",
      label: "Date added",
      value_type: "date",
      suggest: null,
      operators: [{ key: "in_the_last", label: "in the last" }],
    },
  ],
};

const cond = (over: Partial<RuleCondition> = {}): RuleCondition => ({
  field: "genre",
  operator: "equals",
  value: "metal",
  ...over,
});

describe("countRules", () => {
  it("counts an empty rule set as nothing to evaluate", () => {
    expect(countRules({ match: "all", rules: [] })).toBe(0);
  });

  it("counts flat conditions", () => {
    const rules: RuleGroup = { match: "all", rules: [condition, condition] };

    expect(countRules(rules)).toBe(2);
  });

  it("counts a nested group and everything inside it", () => {
    const rules: RuleGroup = {
      match: "all",
      rules: [
        condition,
        { match: "any", rules: [condition, condition] },
      ],
    };

    // The nested group is a node in its own right, plus its two conditions.
    expect(countRules(rules)).toBe(4);
  });

  it("descends through several levels", () => {
    const rules: RuleGroup = {
      match: "all",
      rules: [
        {
          match: "any",
          not: true,
          rules: [{ match: "all", rules: [condition] }],
        },
      ],
    };

    expect(countRules(rules)).toBe(3);
  });

  it("counts an empty nested group as one node", () => {
    const rules: RuleGroup = {
      match: "all",
      rules: [{ match: "any", rules: [] }],
    };

    expect(countRules(rules)).toBe(1);
  });
});

describe("countNodes", () => {
  it("counts the root against the cap, matching the validator", () => {
    expect(countNodes({ match: "all", rules: [] })).toBe(1);
    expect(countNodes({ match: "all", rules: [condition, condition] })).toBe(3);
  });
});

describe("depthOf", () => {
  it("puts the root group at depth 1", () => {
    expect(depthOf([])).toBe(1);
    expect(depthOf([0])).toBe(2);
    expect(depthOf([0, 3, 1])).toBe(4);
  });
});

describe("isRuleGroup", () => {
  it("distinguishes groups from conditions", () => {
    expect(isRuleGroup({ match: "all", rules: [] })).toBe(true);
    expect(isRuleGroup(cond())).toBe(false);
  });
});

describe("nodeAt / groupAt", () => {
  const root: RuleGroup = {
    match: "all",
    rules: [cond({ value: "a" }), { match: "any", rules: [cond({ value: "b" })] }],
  };

  it("returns the root for an empty path", () => {
    expect(nodeAt(root, [])).toBe(root);
  });

  it("walks into nested groups", () => {
    expect(nodeAt(root, [1, 0])).toEqual(cond({ value: "b" }));
  });

  it("returns undefined for a path that leaves the tree", () => {
    expect(nodeAt(root, [5])).toBeUndefined();
    expect(nodeAt(root, [0, 0])).toBeUndefined();
  });

  it("groupAt refuses to return a condition", () => {
    expect(groupAt(root, [1])).toEqual({ match: "any", rules: [cond({ value: "b" })] });
    expect(groupAt(root, [0])).toBeUndefined();
  });
});

describe("addNode", () => {
  it("appends to the root", () => {
    const next = addNode({ match: "all", rules: [] }, [], cond());

    expect(next.rules).toEqual([cond()]);
  });

  it("appends into a nested group without touching siblings", () => {
    const sibling = cond({ value: "keep" });
    const root: RuleGroup = {
      match: "all",
      rules: [sibling, { match: "any", rules: [] }],
    };

    const next = addNode(root, [1], cond({ value: "new" }));

    expect(groupAt(next, [1])?.rules).toEqual([cond({ value: "new" })]);
    expect(next.rules[0]).toBe(sibling);
  });

  it("does not mutate the input tree", () => {
    const root: RuleGroup = { match: "all", rules: [] };

    addNode(root, [], cond());

    expect(root.rules).toEqual([]);
  });
});

describe("updateNode", () => {
  it("replaces a nested condition", () => {
    const root: RuleGroup = {
      match: "all",
      rules: [{ match: "any", rules: [cond({ value: "old" })] }],
    };

    const next = updateNode(root, [0, 0], cond({ value: "new" }));

    expect(nodeAt(next, [0, 0])).toEqual(cond({ value: "new" }));
  });

  it("replaces the root when given a group", () => {
    const replacement: RuleGroup = { match: "any", rules: [cond()] };

    expect(updateNode({ match: "all", rules: [] }, [], replacement)).toBe(replacement);
  });

  it("refuses to replace the root with a condition", () => {
    const root: RuleGroup = { match: "all", rules: [] };

    expect(updateNode(root, [], cond())).toBe(root);
  });
});

describe("removeNode", () => {
  it("removes a node from its parent", () => {
    const root: RuleGroup = {
      match: "all",
      rules: [cond({ value: "a" }), cond({ value: "b" })],
    };

    expect(removeNode(root, [0]).rules).toEqual([cond({ value: "b" })]);
  });

  it("is a no-op on the root path", () => {
    const root: RuleGroup = { match: "all", rules: [cond()] };

    expect(removeNode(root, [])).toBe(root);
  });
});

describe("duplicateNode", () => {
  it("inserts a copy directly after the original", () => {
    const root: RuleGroup = {
      match: "all",
      rules: [cond({ value: "a" }), cond({ value: "b" })],
    };

    const next = duplicateNode(root, [0]);

    expect(next.rules.map((n) => (n as RuleCondition).value)).toEqual(["a", "a", "b"]);
  });

  it("deep-copies a group so the copy edits independently", () => {
    const root: RuleGroup = {
      match: "all",
      rules: [{ match: "any", rules: [cond({ value: "a" })] }],
    };

    const next = duplicateNode(root, [0]);
    const edited = updateNode(next, [1, 0], cond({ value: "changed" }));

    expect(nodeAt(edited, [0, 0])).toEqual(cond({ value: "a" }));
    expect(nodeAt(edited, [1, 0])).toEqual(cond({ value: "changed" }));
  });
});

describe("moveNode", () => {
  const root: RuleGroup = {
    match: "all",
    rules: [cond({ value: "a" }), cond({ value: "b" }), cond({ value: "c" })],
  };
  const values = (group: RuleGroup) =>
    group.rules.map((n) => (n as RuleCondition).value);

  it("swaps with the next sibling", () => {
    expect(values(moveNode(root, [0], 1))).toEqual(["b", "a", "c"]);
  });

  it("swaps with the previous sibling", () => {
    expect(values(moveNode(root, [2], -1))).toEqual(["a", "c", "b"]);
  });

  it("is a no-op past the first slot", () => {
    expect(values(moveNode(root, [0], -1))).toEqual(["a", "b", "c"]);
  });

  it("is a no-op past the last slot", () => {
    expect(values(moveNode(root, [2], 1))).toEqual(["a", "b", "c"]);
  });

  it("moves within a nested group only", () => {
    const nested: RuleGroup = {
      match: "all",
      rules: [
        cond({ value: "outer" }),
        { match: "any", rules: [cond({ value: "x" }), cond({ value: "y" })] },
      ],
    };

    const next = moveNode(nested, [1, 0], 1);

    expect(values(groupAt(next, [1])!)).toEqual(["y", "x"]);
    expect((next.rules[0] as RuleCondition).value).toBe("outer");
  });
});

describe("wrapInGroup", () => {
  it("replaces a condition with a group holding it", () => {
    const root: RuleGroup = { match: "all", rules: [cond({ value: "a" })] };

    const next = wrapInGroup(root, [0]);

    expect(groupAt(next, [0])).toEqual({ match: "all", rules: [cond({ value: "a" })] });
  });

  it("refuses to wrap the root", () => {
    const root: RuleGroup = { match: "all", rules: [cond()] };

    expect(wrapInGroup(root, [])).toBe(root);
  });
});

describe("unwrapGroup", () => {
  it("splices a group's children into its parent in place", () => {
    const root: RuleGroup = {
      match: "all",
      rules: [
        cond({ value: "before" }),
        { match: "any", rules: [cond({ value: "x" }), cond({ value: "y" })] },
        cond({ value: "after" }),
      ],
    };

    const next = unwrapGroup(root, [1]);

    expect(next.rules.map((n) => (n as RuleCondition).value)).toEqual([
      "before",
      "x",
      "y",
      "after",
    ]);
  });

  it("drops an empty group entirely", () => {
    const root: RuleGroup = {
      match: "all",
      rules: [cond({ value: "a" }), { match: "any", rules: [] }],
    };

    expect(unwrapGroup(root, [1]).rules).toEqual([cond({ value: "a" })]);
  });

  it("refuses to unwrap a condition or the root", () => {
    const root: RuleGroup = { match: "all", rules: [cond()] };

    expect(unwrapGroup(root, [0])).toBe(root);
    expect(unwrapGroup(root, [])).toBe(root);
  });
});

describe("newCondition / newGroup", () => {
  it("seeds a condition with the field's first operator and no value", () => {
    expect(newCondition(fieldSpec(schema, "year")!)).toEqual({
      field: "year",
      operator: "greater_than",
      value: null,
    });
  });

  it("seeds a group that matches all", () => {
    expect(newGroup()).toEqual({ match: "all", rules: [] });
  });
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

describe("isValueComplete", () => {
  it("requires a non-empty scalar for one", () => {
    expect(isValueComplete("metal", "one")).toBe(true);
    expect(isValueComplete(0, "one")).toBe(true);
    expect(isValueComplete(false, "one")).toBe(true);
    expect(isValueComplete("", "one")).toBe(false);
    expect(isValueComplete(null, "one")).toBe(false);
  });

  it("requires exactly two scalars for two", () => {
    expect(isValueComplete([2020, 2024], "two")).toBe(true);
    expect(isValueComplete([2020], "two")).toBe(false);
    expect(isValueComplete([2020, ""], "two")).toBe(false);
  });

  it("requires at least one scalar for many", () => {
    expect(isValueComplete(["a"], "many")).toBe(true);
    expect(isValueComplete([], "many")).toBe(false);
    expect(isValueComplete("a", "many")).toBe(false);
  });

  it("requires a positive whole count and a unit for relative", () => {
    expect(isValueComplete({ count: 30, unit: "days" }, "relative")).toBe(true);
    expect(isValueComplete({ count: 0, unit: "days" }, "relative")).toBe(false);
    expect(isValueComplete({ count: 1.5, unit: "days" }, "relative")).toBe(false);
    expect(isValueComplete(null, "relative")).toBe(false);
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
});

describe("incompleteCount", () => {
  it("counts unfinished conditions at every depth", () => {
    const root: RuleGroup = {
      match: "all",
      rules: [
        cond(),
        cond({ value: null }),
        {
          match: "any",
          rules: [cond({ value: "" }), cond({ field: "bpm" }), cond()],
        },
      ],
    };

    expect(incompleteCount(root, schema)).toBe(3);
  });

  it("is zero for a finished tree", () => {
    expect(incompleteCount({ match: "all", rules: [cond()] }, schema)).toBe(0);
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
