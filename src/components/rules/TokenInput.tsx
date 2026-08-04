import { useState } from "react";
import { XIcon } from "lucide-react";
import type { RuleFieldSpec } from "@/api/client";
import { useRuleSuggestions } from "@/hooks/useRuleSuggestions";
import { Badge } from "@/components/ui/badge";
import { SuggestCombobox } from "@/components/catalog/SuggestCombobox";

interface TokenInputProps {
  values: string[];
  suggest: RuleFieldSpec["suggest"];
  label: string;
  onChange: (values: string[]) => void;
}

export function TokenInput({
  values,
  suggest,
  label,
  onChange,
}: TokenInputProps) {
  const [query, setQuery] = useState("");
  const options = useRuleSuggestions(suggest, query);

  function add(value: string) {
    const trimmed = value.trim();
    if (!trimmed || values.includes(trimmed)) return;
    onChange([...values, trimmed]);
  }

  function removeAt(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  return (
    <div className="w-full max-w-[22rem] space-y-1.5">
      <SuggestCombobox
        query={query}
        onQueryChange={setQuery}
        options={options.filter((option) => !values.includes(option.label))}
        onSelect={(option) => add(option.label)}
        onCommitText={add}
        onBackspaceEmpty={() => removeAt(values.length - 1)}
        ariaLabel={`${label} values`}
        placeholder={values.length ? "Add another…" : `${label}…`}
      />
      {values.length > 0 && (
        <ul className="flex flex-wrap gap-1">
          {values.map((value, index) => (
            <li key={value}>
              <Badge variant="secondary" className="gap-1 px-2">
                <span className="max-w-[12rem] truncate">{value}</span>
                <button
                  type="button"
                  aria-label={`Remove ${value}`}
                  onClick={() => removeAt(index)}
                  className="shrink-0 rounded-full hover:text-foreground"
                >
                  <XIcon className="size-3" />
                </button>
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
