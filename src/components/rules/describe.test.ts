import { describe, it, expect } from "vitest";
import type { RuleFieldSpec, RuleSchema } from "@/api/client";
import { ruleSchema } from "@/test/ruleSchema";
import { describeCondition } from "./describe";

const localFile: RuleFieldSpec = {
  key: "is_local",
  label: "Local file",
  value_type: "boolean",
  suggest: null,
  constraints: {},
  operators: [{ key: "equals", label: "is" }],
};

const withLocalFile: RuleSchema = {
  ...ruleSchema,
  fields: [...ruleSchema.fields, localFile],
};

describe("describeCondition", () => {
  it("reads a scalar rule as a sentence", () => {
    expect(
      describeCondition(
        { field: "genre", operator: "contains", value: "metal" },
        ruleSchema,
      ),
    ).toBe("Genre contains “metal”");
  });

  it("lists every value of a list rule", () => {
    expect(
      describeCondition(
        { field: "artist", operator: "in", value: ["Gojira", "Opeth"] },
        ruleSchema,
      ),
    ).toBe("Artist is any of “Gojira”, “Opeth”");
  });

  it("reads a range with both bounds", () => {
    expect(
      describeCondition(
        { field: "year", operator: "between", value: [2020, 2024] },
        ruleSchema,
      ),
    ).toBe("Release year is between 2020 and 2024");
  });

  it("reads a relative date as a count and unit", () => {
    expect(
      describeCondition(
        {
          field: "date_added",
          operator: "in_the_last",
          value: { count: 30, unit: "days" },
        },
        ruleSchema,
      ),
    ).toBe("Date added in the last 30 days");
  });

  it("spells duration in minutes rather than milliseconds", () => {
    expect(
      describeCondition(
        { field: "duration", operator: "greater_than", value: 210_000 },
        ruleSchema,
      ),
    ).toBe("Duration is longer than 3.5 min");
  });

  it("uses the field's own words for a boolean", () => {
    expect(
      describeCondition(
        { field: "explicit", operator: "equals", value: true },
        ruleSchema,
      ),
    ).toBe("Explicit is Explicit");
    expect(
      describeCondition(
        { field: "explicit", operator: "equals", value: false },
        ruleSchema,
      ),
    ).toBe("Explicit is Clean");
  });

  it("falls back to yes/no for a boolean field it has no wording for", () => {
    expect(
      describeCondition(
        { field: "is_local", operator: "equals", value: true },
        withLocalFile,
      ),
    ).toBe("Local file is Yes");
    expect(
      describeCondition(
        { field: "is_local", operator: "equals", value: false },
        withLocalFile,
      ),
    ).toBe("Local file is No");
  });

  it("marks a value that is not there yet", () => {
    expect(
      describeCondition(
        { field: "genre", operator: "equals", value: null },
        ruleSchema,
      ),
    ).toBe("Genre is —");
    expect(
      describeCondition(
        { field: "year", operator: "between", value: [2020] },
        ruleSchema,
      ),
    ).toBe("Release year is between —");
  });

  it("says which field it cannot describe", () => {
    expect(
      describeCondition(
        { field: "play_count", operator: "equals", value: 5 },
        ruleSchema,
      ),
    ).toBe("Unknown field “play_count”");
  });

  it("falls back to the raw operator when the field no longer lists it", () => {
    expect(
      describeCondition(
        { field: "genre", operator: "matches_sql", value: "x" },
        ruleSchema,
      ),
    ).toBe("Genre matches_sql “x”");
  });
});
