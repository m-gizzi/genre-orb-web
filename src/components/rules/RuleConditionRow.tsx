import { useId } from "react";
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
import {
  arityOf,
  blankCondition,
  coerceValue,
  fieldLabels,
  fieldSpec,
  isConditionComplete,
  operatorLabels,
  pathLabel,
  type RulePath,
} from "@/lib/ruleTree";
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
  canDuplicate: boolean;
}

interface ConditionShape {
  condition: RuleCondition;
  schema: RuleSchema;
  path: RulePath;
}

export type RuleConditionRowProps = ConditionShape &
  (
    | {
        editable: true;
        onChange: (condition: RuleCondition) => void;
        actions: RowActions;
      }
    | { editable: false }
  );

export function RuleConditionRow(props: RuleConditionRowProps) {
  if (!props.editable) {
    return (
      <li className="text-sm">
        <span className="text-muted-foreground">•</span>{" "}
        {describeCondition(props.condition, props.schema)}
      </li>
    );
  }

  return <EditableRow {...props} />;
}

function EditableRow({
  condition,
  schema,
  path,
  onChange,
  actions,
}: ConditionShape & {
  onChange: (condition: RuleCondition) => void;
  actions: RowActions;
}) {
  const errorId = useId();
  const position = pathLabel(path);
  const field = fieldSpec(schema, condition.field);

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

  const knownOperator = field.operators.some(
    (op) => op.key === condition.operator,
  );
  const operatorItems = knownOperator
    ? operatorLabels(field)
    : {
        ...operatorLabels(field),
        [condition.operator]: `“${condition.operator}” — unavailable`,
      };

  function changeField(key: string | null) {
    const next = key ? fieldSpec(schema, key) : undefined;
    if (next) onChange(blankCondition(next));
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
      <Select
        items={fieldLabels(schema)}
        value={condition.field}
        onValueChange={changeField}
      >
        <SelectTrigger className="w-[10.5rem]" aria-label={`Field for rule ${position}`}>
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
        items={operatorItems}
        value={condition.operator}
        onValueChange={changeOperator}
      >
        <SelectTrigger
          className="w-[11rem]"
          aria-label={`Operator for rule ${position}`}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {field.operators.map((op) => (
            <SelectItem key={op.key} value={op.key}>
              {op.label}
            </SelectItem>
          ))}
          {!knownOperator && (
            <SelectItem value={condition.operator} disabled>
              {operatorItems[condition.operator]}
            </SelectItem>
          )}
        </SelectContent>
      </Select>

      <RuleValueInput
        field={field}
        arity={arity}
        value={condition.value}
        schema={schema}
        invalid={!complete}
        describedBy={complete ? undefined : errorId}
        onChange={changeValue}
      />

      {!complete && (
        <span id={errorId} className="self-center text-xs text-destructive">
          {knownOperator ? "Needs a value" : "Pick an available operator"}
        </span>
      )}

      <RowMenu label={`rule ${position}, ${field.label}`} actions={actions} />
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
        <DropdownMenuItem
          disabled={!actions.canDuplicate}
          onClick={actions.onDuplicate}
        >
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
