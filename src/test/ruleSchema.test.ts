import { describe, expect, it } from "vitest";
import type { RuleSuggestSource, RuleValueType } from "@/api/client";
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
});
