import type {
  RelativeUnit,
  RelativeValue,
  RuleArity,
  RuleFieldSpec,
  RuleSchema,
  RuleScalar,
  RuleValue,
} from "@/api/client";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isRelative, isScalar } from "@/lib/ruleTree";
import { minutesToMs, msToMinutes, toNumber } from "@/lib/parse";
import { EntityAutocomplete } from "./EntityAutocomplete";
import { TokenInput } from "./TokenInput";

const EXPLICIT_LABELS: Record<string, string> = {
  true: "Explicit",
  false: "Clean",
};

const UNIT_LABELS: Record<RelativeUnit, string> = {
  days: "days",
  weeks: "weeks",
  months: "months",
  years: "years",
};

const MS_PER_MINUTE = 60_000;

interface RuleValueInputProps {
  field: RuleFieldSpec;
  arity: RuleArity;
  value: RuleValue;
  schema: RuleSchema;
  invalid: boolean;
  describedBy?: string;
  onChange: (value: RuleValue) => void;
}

export function RuleValueInput({
  field,
  arity,
  value,
  schema,
  invalid,
  describedBy,
  onChange,
}: RuleValueInputProps) {
  const flags = { invalid, describedBy };

  if (arity === "many") {
    return (
      <TokenInput
        values={asStrings(value)}
        suggest={field.suggest}
        label={field.label}
        maxValues={schema.max_list_size}
        maxLength={field.constraints.max_length}
        {...flags}
        onChange={onChange}
      />
    );
  }

  if (arity === "relative") {
    return (
      <RelativeDateInput
        value={isRelative(value) ? value : partialRelative(value)}
        units={schema.relative_units}
        label={field.label}
        {...flags}
        onChange={onChange}
      />
    );
  }

  if (arity === "two") {
    const pair = Array.isArray(value) ? value : [];
    const setBound = (index: 0 | 1) => (next: RuleScalar | null) => {
      const updated: RuleScalar[] = [pair[0] ?? "", pair[1] ?? ""];
      updated[index] = next ?? "";
      onChange(updated);
    };

    return (
      <div className="flex items-center gap-1.5">
        <ScalarInput
          field={field}
          value={pair[0] ?? null}
          bound="lower"
          {...flags}
          onChange={setBound(0)}
        />
        <span className="text-sm text-muted-foreground">and</span>
        <ScalarInput
          field={field}
          value={pair[1] ?? null}
          bound="upper"
          {...flags}
          onChange={setBound(1)}
        />
      </div>
    );
  }

  return (
    <ScalarInput
      field={field}
      value={isScalar(value) ? value : null}
      {...flags}
      onChange={onChange}
    />
  );
}

interface ScalarInputProps {
  field: RuleFieldSpec;
  value: RuleScalar | null;
  bound?: "lower" | "upper";
  invalid: boolean;
  describedBy?: string;
  onChange: (value: RuleScalar | null) => void;
}

function ScalarInput({
  field,
  value,
  bound,
  invalid,
  describedBy,
  onChange,
}: ScalarInputProps) {
  const label = bound ? `${field.label} ${bound} bound` : `${field.label} value`;
  const { constraints } = field;
  const flags = {
    "aria-label": label,
    "aria-invalid": invalid || undefined,
    "aria-describedby": describedBy,
  };

  switch (field.value_type) {
    case "boolean":
      return (
        <Select
          items={EXPLICIT_LABELS}
          value={value == null ? "" : String(value)}
          onValueChange={(next) => onChange(next === "true")}
        >
          <SelectTrigger className="w-[9rem]" {...flags}>
            <SelectValue placeholder="Choose…" />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(EXPLICIT_LABELS).map(([key, text]) => (
              <SelectItem key={key} value={key}>
                {text}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );

    case "number":
      return (
        <Input
          type="number"
          inputMode="numeric"
          min={constraints.min}
          max={constraints.max}
          className="w-28"
          value={value == null ? "" : String(value)}
          {...flags}
          onChange={(e) => onChange(toNumber(e.target.value) ?? null)}
        />
      );

    case "duration":
      return (
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            inputMode="numeric"
            min={toMinutes(constraints.min, Math.ceil)}
            max={toMinutes(constraints.max, Math.floor)}
            className="w-24"
            value={msToMinutes(typeof value === "number" ? value : undefined)}
            {...flags}
            aria-label={`${label} in minutes`}
            onChange={(e) => onChange(minutesToMs(e.target.value) ?? null)}
          />
          <span className="text-sm text-muted-foreground">min</span>
        </div>
      );

    case "date":
      return (
        <Input
          type="date"
          className="w-[10.5rem]"
          value={typeof value === "string" ? value : ""}
          {...flags}
          onChange={(e) => onChange(e.target.value || null)}
        />
      );

    case "text":
      return field.suggest ? (
        <EntityAutocomplete
          value={typeof value === "string" ? value : ""}
          suggest={field.suggest}
          label={field.label}
          maxLength={constraints.max_length}
          invalid={invalid}
          describedBy={describedBy}
          onChange={(next) => onChange(next || null)}
        />
      ) : (
        <Input
          className="w-full max-w-[16rem]"
          placeholder={`${field.label}…`}
          maxLength={constraints.max_length}
          value={typeof value === "string" ? value : ""}
          {...flags}
          onChange={(e) => onChange(e.target.value || null)}
        />
      );

    default: {
      const unhandled: never = field.value_type;
      return (
        <span className="self-center text-sm text-destructive">
          This build can't edit “{String(unhandled)}” values — update the app.
        </span>
      );
    }
  }
}

interface RelativeDateInputProps {
  value: Partial<RelativeValue> | null;
  units: RelativeUnit[];
  label: string;
  invalid: boolean;
  describedBy?: string;
  onChange: (value: RuleValue) => void;
}

function RelativeDateInput({
  value,
  units,
  label,
  invalid,
  describedBy,
  onChange,
}: RelativeDateInputProps) {
  const unit = value?.unit ?? units[0] ?? "days";
  const items = Object.fromEntries(units.map((u) => [u, UNIT_LABELS[u]]));

  function emit(count: number | undefined, nextUnit: RelativeUnit) {
    onChange(count == null ? null : { count, unit: nextUnit });
  }

  return (
    <div className="flex items-center gap-1.5">
      <Input
        type="number"
        inputMode="numeric"
        min="1"
        step="1"
        className="w-20"
        value={value?.count == null ? "" : String(value.count)}
        aria-label={`${label} count`}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        onChange={(e) => {
          const count = toNumber(e.target.value);
          emit(count == null ? undefined : Math.round(count), unit);
        }}
      />
      <Select
        items={items}
        value={unit}
        onValueChange={(next) => emit(value?.count, next as RelativeUnit)}
      >
        <SelectTrigger
          className="w-[7.5rem]"
          aria-label={`${label} unit`}
          aria-invalid={invalid || undefined}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {units.map((u) => (
            <SelectItem key={u} value={u}>
              {UNIT_LABELS[u]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function toMinutes(
  ms: number | undefined,
  round: (value: number) => number,
): number | undefined {
  return ms == null ? undefined : round(ms / MS_PER_MINUTE);
}

function asStrings(value: RuleValue): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function partialRelative(value: RuleValue): Partial<RelativeValue> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value;
}
