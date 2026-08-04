import type { RuleSchema } from "@/api/client";

/** Mirrors Rules::FieldCatalog, so component tests render the real vocabulary. */
export const ruleSchema: RuleSchema = {
  max_depth: 5,
  max_nodes: 100,
  match_types: ["all", "any"],
  relative_units: ["days", "weeks", "months", "years"],
  operators: {
    equals: { arity: "one" },
    not_equals: { arity: "one" },
    contains: { arity: "one" },
    starts_with: { arity: "one" },
    ends_with: { arity: "one" },
    greater_than: { arity: "one" },
    less_than: { arity: "one" },
    between: { arity: "two" },
    in: { arity: "many" },
    not_in: { arity: "many" },
    in_the_last: { arity: "relative" },
    not_in_the_last: { arity: "relative" },
  },
  fields: [
    {
      key: "genre",
      label: "Genre",
      value_type: "text",
      suggest: "genres",
      operators: [
        { key: "equals", label: "is" },
        { key: "not_equals", label: "is not" },
        { key: "contains", label: "contains" },
        { key: "in", label: "is any of" },
        { key: "not_in", label: "is none of" },
      ],
    },
    {
      key: "artist",
      label: "Artist",
      value_type: "text",
      suggest: "artists",
      operators: [
        { key: "equals", label: "is" },
        { key: "not_equals", label: "is not" },
        { key: "contains", label: "contains" },
        { key: "in", label: "is any of" },
        { key: "not_in", label: "is none of" },
      ],
    },
    {
      key: "title",
      label: "Title",
      value_type: "text",
      suggest: null,
      operators: [
        { key: "equals", label: "is" },
        { key: "contains", label: "contains" },
        { key: "starts_with", label: "starts with" },
      ],
    },
    {
      key: "year",
      label: "Release year",
      value_type: "number",
      suggest: null,
      operators: [
        { key: "equals", label: "is" },
        { key: "greater_than", label: "is after" },
        { key: "less_than", label: "is before" },
        { key: "between", label: "is between" },
      ],
    },
    {
      key: "duration",
      label: "Duration",
      value_type: "duration",
      suggest: null,
      operators: [
        { key: "greater_than", label: "is longer than" },
        { key: "less_than", label: "is shorter than" },
        { key: "between", label: "is between" },
      ],
    },
    {
      key: "explicit",
      label: "Explicit",
      value_type: "boolean",
      suggest: null,
      operators: [{ key: "equals", label: "is" }],
    },
    {
      key: "date_added",
      label: "Date added",
      value_type: "date",
      suggest: null,
      operators: [
        { key: "in_the_last", label: "in the last" },
        { key: "greater_than", label: "is after" },
        { key: "between", label: "is between" },
      ],
    },
  ],
};
