import type {
  RelativeUnit,
  RelativeValue,
  RuleArity,
  RuleFieldSpec,
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

interface RuleValueInputProps {
  field: RuleFieldSpec;
  arity: RuleArity;
  value: RuleValue;
  relativeUnits: RelativeUnit[];
  onChange: (value: RuleValue) => void;
}

export function RuleValueInput({
  field,
  arity,
  value,
  relativeUnits,
  onChange,
}: RuleValueInputProps) {
  if (arity === "many") {
    return (
      <TokenInput
        values={asStrings(value)}
        suggest={field.suggest}
        label={field.label}
        onChange={onChange}
      />
    );
  }

  if (arity === "relative") {
    return (
      <RelativeDateInput
        value={asRelative(value)}
        units={relativeUnits}
        label={field.label}
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
          onChange={setBound(0)}
        />
        <span className="text-sm text-muted-foreground">and</span>
        <ScalarInput
          field={field}
          value={pair[1] ?? null}
          bound="upper"
          onChange={setBound(1)}
        />
      </div>
    );
  }

  return <ScalarInput field={field} value={asScalar(value)} onChange={onChange} />;
}

interface ScalarInputProps {
  field: RuleFieldSpec;
  value: RuleScalar | null;
  bound?: "lower" | "upper";
  onChange: (value: RuleScalar | null) => void;
}

function ScalarInput({ field, value, bound, onChange }: ScalarInputProps) {
  const label = bound ? `${field.label} ${bound} bound` : `${field.label} value`;

  switch (field.value_type) {
    case "boolean":
      return (
        <Select
          items={EXPLICIT_LABELS}
          value={value == null ? "" : String(value)}
          onValueChange={(next) => onChange(next === "true")}
        >
          <SelectTrigger className="w-[9rem]" aria-label={label}>
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
          aria-label={label}
          className="w-28"
          value={value == null ? "" : String(value)}
          onChange={(e) => onChange(toNumber(e.target.value) ?? null)}
        />
      );

    case "duration":
      return (
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            inputMode="numeric"
            min="0"
            aria-label={`${label} in minutes`}
            className="w-24"
            value={msToMinutes(typeof value === "number" ? value : undefined)}
            onChange={(e) => onChange(minutesToMs(e.target.value) ?? null)}
          />
          <span className="text-sm text-muted-foreground">min</span>
        </div>
      );

    case "date":
      return (
        <Input
          type="date"
          aria-label={label}
          className="w-[10.5rem]"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value || null)}
        />
      );

    default:
      return field.suggest ? (
        <EntityAutocomplete
          value={typeof value === "string" ? value : ""}
          suggest={field.suggest}
          label={field.label}
          onChange={(next) => onChange(next || null)}
        />
      ) : (
        <Input
          aria-label={label}
          className="w-full max-w-[16rem]"
          placeholder={`${field.label}…`}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value || null)}
        />
      );
  }
}

interface RelativeDateInputProps {
  value: RelativeValue | null;
  units: RelativeUnit[];
  label: string;
  onChange: (value: RuleValue) => void;
}

function RelativeDateInput({
  value,
  units,
  label,
  onChange,
}: RelativeDateInputProps) {
  const unit = value?.unit ?? units[0] ?? "days";
  const items = Object.fromEntries(units.map((u) => [u, UNIT_LABELS[u]]));

  return (
    <div className="flex items-center gap-1.5">
      <Input
        type="number"
        inputMode="numeric"
        min="1"
        step="1"
        aria-label={`${label} count`}
        className="w-20"
        value={value?.count == null ? "" : String(value.count)}
        onChange={(e) => {
          const count = toNumber(e.target.value);
          onChange(count == null ? null : { count: Math.round(count), unit });
        }}
      />
      <Select
        items={items}
        value={unit}
        onValueChange={(next) =>
          onChange({ count: value?.count ?? 0, unit: next as RelativeUnit })
        }
      >
        <SelectTrigger className="w-[7.5rem]" aria-label={`${label} unit`}>
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

function asStrings(value: RuleValue): string[] {
  return Array.isArray(value) ? value.map(String) : [];
}

function asScalar(value: RuleValue): RuleScalar | null {
  if (typeof value === "string" || typeof value === "number") return value;
  return typeof value === "boolean" ? value : null;
}

function asRelative(value: RuleValue): RelativeValue | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value;
}
