const BY_FIELD: Record<string, Record<"true" | "false", string>> = {
  explicit: { true: "Explicit", false: "Clean" },
};

const GENERIC: Record<"true" | "false", string> = { true: "Yes", false: "No" };

export function booleanLabels(
  fieldKey: string,
): Record<"true" | "false", string> {
  return BY_FIELD[fieldKey] ?? GENERIC;
}

export function booleanLabel(fieldKey: string, value: boolean): string {
  return booleanLabels(fieldKey)[value ? "true" : "false"];
}
