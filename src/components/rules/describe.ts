import type { RuleCondition, RuleFieldSpec, RuleSchema } from "@/api/client";
import { arityOf, fieldSpec, isRelative } from "@/lib/ruleTree";
import { msToMinutes } from "@/lib/parse";
import { booleanLabel } from "./booleanLabels";

export function describeCondition(
  condition: RuleCondition,
  schema: RuleSchema,
): string {
  const field = fieldSpec(schema, condition.field);
  if (!field) return `Unknown field “${condition.field}”`;

  const operator = field.operators.find((op) => op.key === condition.operator);
  const label = operator?.label ?? condition.operator;

  return `${field.label} ${label} ${describeValue(condition, schema)}`.trim();
}

function describeValue(condition: RuleCondition, schema: RuleSchema): string {
  const field = fieldSpec(schema, condition.field);
  const { value } = condition;

  switch (arityOf(schema, condition.operator)) {
    case "many":
      return Array.isArray(value) ? value.map(quote).join(", ") : "—";
    case "two":
      return Array.isArray(value) && value.length === 2
        ? `${scalar(value[0], field)} and ${scalar(value[1], field)}`
        : "—";
    case "relative":
      return isRelative(value) ? `${value.count} ${value.unit}` : "—";
    default:
      return scalar(value, field);
  }
}

function scalar(value: unknown, field?: RuleFieldSpec): string {
  if (value == null || value === "") return "—";
  if (field?.value_type === "duration" && typeof value === "number") {
    return `${msToMinutes(value)} min`;
  }
  if (typeof value === "boolean") return booleanLabel(field?.key ?? "", value);
  if (typeof value === "number") return String(value);
  return quote(value);
}

function quote(value: unknown): string {
  return `“${String(value)}”`;
}
