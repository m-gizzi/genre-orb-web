import { describe, it, expect } from "vitest";
import type { RuleGroup } from "@/api/client";
import { countRules } from "./rules";

const condition = { field: "genre", operator: "equals", value: "metal" };

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
