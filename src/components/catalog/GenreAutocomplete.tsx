import { useState } from "react";
import { XIcon } from "lucide-react";
import { useGenres } from "@/hooks/useGenres";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "./SearchInput";

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
  const [open, setOpen] = useState(false);
  const debounced = useDebouncedValue(query, 250);
  const { data } = useGenres({ search: debounced || undefined, per_page: 8 });
  const results = data?.data ?? [];

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
    <div className="relative">
      <SearchInput
        value={query}
        onChange={(value) => {
          setQuery(value);
          setOpen(true);
        }}
        placeholder="Genre…"
        className="max-w-[12rem]"
      />
      {open && query.length > 0 && results.length > 0 && (
        <ul className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg bg-popover p-1 text-sm shadow-md ring-1 ring-foreground/10">
          {results.map((genre) => (
            <li key={genre.id}>
              <button
                type="button"
                className="w-full rounded-md px-2 py-1 text-left hover:bg-accent hover:text-accent-foreground"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onSelect({ id: genre.id, name: genre.name });
                  setQuery("");
                  setOpen(false);
                }}
              >
                {genre.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
