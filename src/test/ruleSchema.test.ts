import { describe, expect, it } from "vitest";
import type {
  RuleArity,
  RuleFieldSpec,
  RuleScalar,
  RuleSuggestSource,
  RuleValue,
  RuleValueType,
} from "@/api/client";
import { arityOf, isConditionComplete } from "@/lib/ruleTree";
import { booleanLabels } from "@/components/rules/booleanLabels";
import { ruleSchema } from "./ruleSchema";

describe("rule schema fixture", () => {
  const RENDERABLE: RuleValueType[] = [
    "text",
    "number",
    "duration",
    "boolean",
    "date",
  ];

  const SUGGESTABLE: RuleSuggestSource[] = ["genres", "artists", "albums"];

  it("gives every field at least one operator", () => {
    for (const field of ruleSchema.fields) {
      expect(field.operators.length, `${field.key} has no operators`).toBeGreaterThan(0);
    }
  });

  it("only uses operators the schema declares an arity for", () => {
    for (const field of ruleSchema.fields) {
      for (const operator of field.operators) {
        expect(
          ruleSchema.operators[operator.key],
          `${field.key} lists "${operator.key}", which has no arity`,
        ).toBeDefined();
      }
    }
  });

  it("only uses value types the builder can render", () => {
    for (const field of ruleSchema.fields) {
      expect(RENDERABLE, `${field.key} has an unrenderable value_type`).toContain(
        field.value_type,
      );
    }
  });

  it("only suggests from sources the suggestion hook handles", () => {
    for (const field of ruleSchema.fields) {
      if (field.suggest === null) continue;

      expect(SUGGESTABLE, `${field.key} suggests from an unknown source`).toContain(
        field.suggest,
      );
    }
  });

  it("gives numeric and duration fields the bounds their inputs need", () => {
    const bounded = ruleSchema.fields.filter((field) =>
      ["number", "duration"].includes(field.value_type),
    );

    expect(bounded.length).toBeGreaterThan(0);
    for (const field of bounded) {
      expect(field.constraints.min, `${field.key} has no min`).toBeTypeOf("number");
      expect(field.constraints.max, `${field.key} has no max`).toBeTypeOf("number");
    }
  });

  it("caps the length of every text field", () => {
    for (const field of ruleSchema.fields) {
      if (field.value_type !== "text") continue;

      expect(field.constraints.max_length).toBe(ruleSchema.max_string_length);
    }
  });

  it("declares unique field keys", () => {
    const keys = ruleSchema.fields.map((field) => field.key);

    expect(new Set(keys).size).toBe(keys.length);
  });

  it("uses only relative operators with the relative units it declares", () => {
    const relative = Object.entries(ruleSchema.operators)
      .filter(([, spec]) => spec.arity === "relative")
      .map(([key]) => key);

    expect(relative.length).toBeGreaterThan(0);
    expect(ruleSchema.relative_units.length).toBeGreaterThan(0);
  });

  it("names both sides of every boolean field", () => {
    for (const field of ruleSchema.fields) {
      if (field.value_type !== "boolean") continue;

      const labels = booleanLabels(field.key);
      expect(labels.true, `${field.key} has no wording for true`).toBeTruthy();
      expect(labels.false, `${field.key} has no wording for false`).toBeTruthy();
    }
  });

  describe("every pairing the schema advertises", () => {
    const ARITIES: RuleArity[] = ["one", "two", "many", "relative"];

    function sampleScalar(field: RuleFieldSpec): RuleScalar {
      switch (field.value_type) {
        case "text":
          return "metal";
        case "number":
        case "duration":
          return field.constraints.min ?? 1;
        case "boolean":
          return true;
        case "date":
          return "2024-01-15";
      }
    }

    function sampleValue(field: RuleFieldSpec, arity: RuleArity): RuleValue {
      const scalar = sampleScalar(field);
      switch (arity) {
        case "one":
          return scalar;
        case "two":
          return [scalar, scalar];
        case "many":
          return [scalar];
        case "relative":
          return { count: 1, unit: ruleSchema.relative_units[0]! };
      }
    }

    for (const field of ruleSchema.fields) {
      for (const operator of field.operators) {
        it(`can complete ${field.key} ${operator.key}`, () => {
          const arity = arityOf(ruleSchema, operator.key);
          expect(ARITIES, `${operator.key} has an arity the builder cannot render`)
            .toContain(arity);

          expect(
            isConditionComplete(
              {
                field: field.key,
                operator: operator.key,
                value: sampleValue(field, arity),
              },
              ruleSchema,
            ),
          ).toBe(true);
        });
      }
    }
  });
});
