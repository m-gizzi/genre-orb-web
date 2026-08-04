import { ChevronDownIcon, ChevronUpIcon, CopyIcon, GroupIcon, MoreVerticalIcon, Trash2Icon } from "lucide-react";
import type { RuleCondition, RuleSchema, RuleValue } from "@/api/client";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { arityOf, coerceValue, fieldSpec, isConditionComplete, newCondition } from "@/lib/ruleTree";
import { cn } from "@/lib/utils";
import { RuleValueInput } from "./RuleValueInput";
import { describeCondition } from "./describe";

export interface RowActions {
  onMove: (delta: number) => void;
  onWrap: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canWrap: boolean;
}

interface RuleConditionRowProps {
  condition: RuleCondition;
  schema: RuleSchema;
  editable: boolean;
  onChange: (condition: RuleCondition) => void;
  actions: RowActions;
}

export function RuleConditionRow({
  condition,
  schema,
  editable,
  onChange,
  actions,
}: RuleConditionRowProps) {
  const field = fieldSpec(schema, condition.field);

  if (!editable) {
    return (
      <li className="text-sm">
        <span className="text-muted-foreground">•</span>{" "}
        {describeCondition(condition, schema)}
      </li>
    );
  }

  if (!field) {
    return (
      <li className="flex items-center gap-2 rounded-lg border border-destructive/40 p-2 text-sm">
        <span className="text-destructive">
          Unknown field “{condition.field}” — remove this rule to continue.
        </span>
        <Button
          size="sm"
          variant="ghost"
          className="ml-auto"
          onClick={actions.onRemove}
        >
          <Trash2Icon /> Remove
        </Button>
      </li>
    );
  }

  const complete = isConditionComplete(condition, schema);
  const arity = arityOf(schema, condition.operator);
  const operatorLabels = Object.fromEntries(
    field.operators.map((op) => [op.key, op.label]),
  );
  const fieldLabels = Object.fromEntries(
    schema.fields.map((f) => [f.key, f.label]),
  );

  function changeField(key: string | null) {
    const next = key ? fieldSpec(schema, key) : undefined;
    if (next) onChange(newCondition(next));
  }

  function changeOperator(operator: string | null) {
    if (!operator) return;

    onChange({
      ...condition,
      operator,
      value: coerceValue(condition.value, arity, arityOf(schema, operator)),
    });
  }

  function changeValue(value: RuleValue) {
    onChange({ ...condition, value });
  }

  return (
    <li
      className={cn(
        "flex flex-wrap items-start gap-2 rounded-lg p-1.5",
        !complete && "bg-destructive/5 ring-1 ring-destructive/30",
      )}
    >
      <Select items={fieldLabels} value={condition.field} onValueChange={changeField}>
        <SelectTrigger className="w-[9.5rem]" aria-label="Field">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {schema.fields.map((f) => (
            <SelectItem key={f.key} value={f.key}>
              {f.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        items={operatorLabels}
        value={condition.operator}
        onValueChange={changeOperator}
      >
        <SelectTrigger className="w-[10rem]" aria-label="Operator">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {field.operators.map((op) => (
            <SelectItem key={op.key} value={op.key}>
              {op.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <RuleValueInput
        field={field}
        arity={arity}
        value={condition.value}
        relativeUnits={schema.relative_units}
        onChange={changeValue}
      />

      {!complete && (
        <span className="self-center text-xs text-destructive">Needs a value</span>
      )}

      <RowMenu label={`${field.label} rule`} actions={actions} />
    </li>
  );
}

export function RowMenu({ label, actions }: { label: string; actions: RowActions }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto shrink-0"
            aria-label={`Actions for ${label}`}
          >
            <MoreVerticalIcon />
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          disabled={!actions.canMoveUp}
          onClick={() => actions.onMove(-1)}
        >
          <ChevronUpIcon /> Move up
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={!actions.canMoveDown}
          onClick={() => actions.onMove(1)}
        >
          <ChevronDownIcon /> Move down
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!actions.canWrap} onClick={actions.onWrap}>
          <GroupIcon /> Wrap in group
        </DropdownMenuItem>
        <DropdownMenuItem onClick={actions.onDuplicate}>
          <CopyIcon /> Duplicate
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={actions.onRemove}>
          <Trash2Icon /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
