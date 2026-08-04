import { useState } from "react";
import { XIcon } from "lucide-react";
import { useGenres } from "@/hooks/useGenres";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Badge } from "@/components/ui/badge";
import { SuggestCombobox } from "./SuggestCombobox";

interface GenreAutocompleteProps {
  valueId?: number;
  valueName?: string;
  onSelect: (genre: { id: number; name: string } | null) => void;
}

export function GenreAutocomplete({
  valueId,
  valueName,
  onSelect,
}: GenreAutocompleteProps) {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 250);
  const { data, isFetching } = useGenres(
    { search: debounced || undefined, per_page: 8 },
    valueId == null
  );

  if (valueId != null) {
    return (
      <Badge variant="secondary" className="h-8 gap-1 px-2.5">
        {valueName ?? "Genre"}
        <button
          type="button"
          aria-label="Clear genre filter"
          onClick={() => onSelect(null)}
          className="ml-0.5 rounded-full hover:text-foreground"
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
      options={(data?.data ?? []).map((genre) => ({
        id: genre.id,
        label: genre.name,
      }))}
      onSelect={(option) =>
        onSelect({ id: Number(option.id), name: option.label })
      }
      loading={isFetching || query.trim() !== debounced.trim()}
      ariaLabel="Filter by genre"
      placeholder="Genre…"
      className="max-w-[12rem]"
    />
  );
}
