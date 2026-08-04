import { useId, useState } from "react";
import { cn } from "@/lib/utils";
import { SearchInput } from "./SearchInput";

export interface SuggestOption {
  id: string | number;
  label: string;
}

interface SuggestComboboxProps {
  query: string;
  onQueryChange: (query: string) => void;
  options: SuggestOption[];
  onSelect: (option: SuggestOption) => void;
  onCommitText?: (text: string) => void;
  onBackspaceEmpty?: () => void;
  ariaLabel: string;
  placeholder?: string;
  className?: string;
  prefix?: React.ReactNode;
}

export function SuggestCombobox({
  query,
  onQueryChange,
  options,
  onSelect,
  onCommitText,
  onBackspaceEmpty,
  ariaLabel,
  placeholder = "Search…",
  className,
  prefix,
}: SuggestComboboxProps) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const listboxId = useId();
  const optionId = (index: number) => `${listboxId}-option-${index}`;
  const isOpen = open && query.length > 0 && options.length > 0;
  const active = isOpen && activeIndex >= 0 ? options[activeIndex] : undefined;

  function choose(option: SuggestOption) {
    onSelect(option);
    onQueryChange("");
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setOpen(true);
        setActiveIndex((i) => (i >= options.length - 1 ? 0 : i + 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setOpen(true);
        setActiveIndex((i) => (i <= 0 ? options.length - 1 : i - 1));
        break;
      case "Enter":
        if (active) {
          event.preventDefault();
          choose(active);
        } else if (onCommitText && query.trim()) {
          event.preventDefault();
          onCommitText(query.trim());
          onQueryChange("");
          setOpen(false);
        }
        break;
      case "Escape":
        setOpen(false);
        setActiveIndex(-1);
        break;
      case "Backspace":
        if (query === "") onBackspaceEmpty?.();
        break;
    }
  }

  return (
    <div className={cn("relative", className)}>
      {prefix}
      <SearchInput
        value={query}
        onChange={(value) => {
          onQueryChange(value);
          setOpen(true);
          setActiveIndex(-1);
        }}
        placeholder={placeholder}
        inputProps={{
          role: "combobox",
          "aria-label": ariaLabel,
          "aria-haspopup": "listbox",
          "aria-expanded": isOpen,
          "aria-controls": listboxId,
          "aria-autocomplete": "list",
          "aria-activedescendant": active ? optionId(activeIndex) : undefined,
          onKeyDown: handleKeyDown,
          onBlur: () => setOpen(false),
        }}
      />
      {isOpen && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={ariaLabel}
          className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg bg-popover p-1 text-sm shadow-md ring-1 ring-foreground/10"
        >
          {options.map((option, index) => (
            <li
              key={option.id}
              id={optionId(index)}
              role="option"
              aria-selected={index === activeIndex}
              className={cn(
                "cursor-pointer rounded-md px-2 py-1 hover:bg-accent hover:text-accent-foreground",
                index === activeIndex && "bg-accent text-accent-foreground",
              )}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(option);
              }}
              onMouseEnter={() => setActiveIndex(index)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
