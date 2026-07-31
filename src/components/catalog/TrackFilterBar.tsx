import { XIcon } from "lucide-react";
import type { TrackFilters } from "@/api/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { minutesToMs, msToMinutes, toNumber } from "@/lib/parse";
import { DebouncedInput } from "./DebouncedInput";
import { DebouncedSearchInput } from "./DebouncedSearchInput";
import { GenreAutocomplete } from "./GenreAutocomplete";

const EXPLICIT_ANY = "any";
const EXPLICIT_ONLY = "explicit";
const EXPLICIT_CLEAN = "clean";

const EXPLICIT_LABELS: Record<string, string> = {
  [EXPLICIT_ANY]: "Any content",
  [EXPLICIT_ONLY]: "Explicit only",
  [EXPLICIT_CLEAN]: "Clean only",
};

interface TrackFilterBarProps {
  filters: TrackFilters;
  genreName?: string;
  onChange: (patch: Partial<TrackFilters>) => void;
  onClear: () => void;
}

export function TrackFilterBar({
  filters,
  genreName,
  onChange,
  onClear,
}: TrackFilterBarProps) {
  const explicitValue =
    filters.explicit === true
      ? EXPLICIT_ONLY
      : filters.explicit === false
        ? EXPLICIT_CLEAN
        : EXPLICIT_ANY;

  const hasActiveFilters =
    !!filters.title ||
    !!filters.artist ||
    !!filters.album ||
    filters.genre != null ||
    filters.year_min != null ||
    filters.year_max != null ||
    filters.duration_min != null ||
    filters.duration_max != null ||
    filters.explicit != null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <DebouncedSearchInput
        placeholder="Title…"
        className="max-w-[13.75rem]"
        value={filters.title ?? ""}
        onCommit={(value) => onChange({ title: value || undefined })}
      />

      <DebouncedSearchInput
        placeholder="Artist…"
        className="max-w-[13.75rem]"
        value={filters.artist ?? ""}
        onCommit={(value) => onChange({ artist: value || undefined })}
      />

      <DebouncedSearchInput
        placeholder="Album…"
        className="max-w-[13.75rem]"
        value={filters.album ?? ""}
        onCommit={(value) => onChange({ album: value || undefined })}
      />

      <GenreAutocomplete
        valueId={filters.genre != null ? Number(filters.genre) : undefined}
        valueName={genreName}
        onSelect={(genre) =>
          onChange({ genre: genre ? String(genre.id) : undefined })
        }
      />

      <div className="flex items-center gap-1">
        <DebouncedInput
          type="number"
          inputMode="numeric"
          placeholder="Year ≥"
          className="w-27"
          value={filters.year_min != null ? String(filters.year_min) : ""}
          onCommit={(value) => onChange({ year_min: toNumber(value) })}
        />
        <DebouncedInput
          type="number"
          inputMode="numeric"
          placeholder="Year ≤"
          className="w-27"
          value={filters.year_max != null ? String(filters.year_max) : ""}
          onCommit={(value) => onChange({ year_max: toNumber(value) })}
        />
      </div>

      <div className="flex items-center gap-1">
        <DebouncedInput
          type="number"
          inputMode="numeric"
          step="1"
          min="0"
          placeholder="Duration ≥"
          className="w-27"
          value={msToMinutes(filters.duration_min)}
          onCommit={(value) => onChange({ duration_min: minutesToMs(value) })}
        />
        <DebouncedInput
          type="number"
          inputMode="numeric"
          step="1"
          min="0"
          placeholder="Duration ≤"
          className="w-27"
          value={msToMinutes(filters.duration_max)}
          onCommit={(value) => onChange({ duration_max: minutesToMs(value) })}
        />
      </div>

      <Select
        items={EXPLICIT_LABELS}
        value={explicitValue}
        onValueChange={(value) =>
          onChange({
            explicit:
              value === EXPLICIT_ONLY
                ? true
                : value === EXPLICIT_CLEAN
                  ? false
                  : undefined,
          })
        }
      >
        <SelectTrigger className="w-[8.5rem]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(EXPLICIT_LABELS).map(([value, labelText]) => (
            <SelectItem key={value} value={value}>
              {labelText}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto"
          onClick={onClear}
        >
          <XIcon /> Clear
        </Button>
      )}
    </div>
  );
}
