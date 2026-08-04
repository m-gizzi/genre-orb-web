import { useState } from "react";
import { XIcon } from "lucide-react";
import type { RuleFieldSpec } from "@/api/client";
import { useRuleSuggestions } from "@/hooks/useRuleSuggestions";
import { Badge } from "@/components/ui/badge";
import { SuggestCombobox } from "@/components/catalog/SuggestCombobox";

interface EntityAutocompleteProps {
  value: string;
  suggest: RuleFieldSpec["suggest"];
  label: string;
  maxLength?: number;
  invalid?: boolean;
  describedBy?: string;
  onChange: (value: string) => void;
}

export function EntityAutocomplete({
  value,
  suggest,
  label,
  maxLength,
  invalid,
  describedBy,
  onChange,
}: EntityAutocompleteProps) {
  const [query, setQuery] = useState("");
  const suggestions = useRuleSuggestions(suggest, query);

  if (value) {
    return (
      <Badge variant="secondary" className="h-9 max-w-[16rem] gap-1 px-2.5">
        <span className="truncate">{value}</span>
        <button
          type="button"
          aria-label={`Clear ${label} value`}
          onClick={() => onChange("")}
          className="ml-0.5 shrink-0 rounded-full hover:text-foreground"
        >
          <XIcon className="size-3" />
        </button>
      </Badge>
    );
  }

  return (
    <SuggestCombobox
      query={query}
      onQueryChange={setQuery}
      options={suggestions.options}
      loading={suggestions.isLoading}
      onSelect={(option) => onChange(option.label)}
      onCommitText={onChange}
      ariaLabel={`${label} value`}
      placeholder={`${label}…`}
      className="w-full max-w-[16rem]"
      maxLength={maxLength}
      invalid={invalid}
      describedBy={describedBy}
    />
  );
}
