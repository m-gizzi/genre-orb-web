import { useState } from "react";
import { XIcon } from "lucide-react";
import { useGenres } from "@/hooks/useGenres";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { SearchInput } from "./SearchInput";

interface GenreAutocompleteProps {
  valueId?: number;
  valueName?: string;
  onSelect: (genre: { id: number; name: string } | null) => void;
}

const LISTBOX_ID = "genre-autocomplete-listbox";
const optionId = (genreId: number) => `genre-autocomplete-option-${genreId}`;

export function GenreAutocomplete({
  valueId,
  valueName,
  onSelect,
}: GenreAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounced = useDebouncedValue(query, 250);
  const { data } = useGenres({ search: debounced || undefined, per_page: 8 });
  const results = data?.data ?? [];
  const isOpen = open && query.length > 0 && results.length > 0;

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

  function choose(genre: { id: number; name: string }) {
    onSelect({ id: genre.id, name: genre.name });
    setQuery("");
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setOpen(true);
        setActiveIndex((i) => Math.min(i + 1, results.length - 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        if (isOpen && results[activeIndex]) {
          event.preventDefault();
          choose(results[activeIndex]);
        }
        break;
      case "Escape":
        setOpen(false);
        setActiveIndex(-1);
        break;
    }
  }

  return (
    <div className="relative">
      <SearchInput
        value={query}
        onChange={(value) => {
          setQuery(value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        placeholder="Genre…"
        className="max-w-[12rem]"
        inputProps={{
          role: "combobox",
          "aria-label": "Filter by genre",
          "aria-expanded": isOpen,
          "aria-controls": LISTBOX_ID,
          "aria-autocomplete": "list",
          "aria-activedescendant":
            isOpen && results[activeIndex]
              ? optionId(results[activeIndex].id)
              : undefined,
          onKeyDown: handleKeyDown,
          onBlur: () => setOpen(false),
        }}
      />
      {isOpen && (
        <ul
          id={LISTBOX_ID}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg bg-popover p-1 text-sm shadow-md ring-1 ring-foreground/10"
        >
          {results.map((genre, index) => (
            <li
              key={genre.id}
              id={optionId(genre.id)}
              role="option"
              aria-selected={index === activeIndex}
              className={cn(
                "cursor-pointer rounded-md px-2 py-1 hover:bg-accent hover:text-accent-foreground",
                index === activeIndex && "bg-accent text-accent-foreground"
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(genre);
              }}
              onMouseEnter={() => setActiveIndex(index)}
            >
              {genre.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
