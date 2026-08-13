import { useState } from "react";
import { AlertTriangleIcon, XIcon } from "lucide-react";
import { usePlaylistSuggestions } from "@/hooks/usePlaylistSuggestions";
import { Badge } from "@/components/ui/badge";
import { SuggestCombobox } from "@/components/catalog/SuggestCombobox";
import { playlistLabel, useRulePlaylists } from "./rulePlaylists";

interface PlaylistTokenInputProps {
  values: number[];
  label: string;
  maxValues: number;
  invalid?: boolean;
  describedBy?: string;
  onChange: (values: number[]) => void;
}

export function PlaylistTokenInput({
  values,
  label,
  maxValues,
  invalid,
  describedBy,
  onChange,
}: PlaylistTokenInputProps) {
  const [query, setQuery] = useState("");
  const suggestions = usePlaylistSuggestions(query);
  const { nameOf, hasNothingToMatch, excludedId, remember } = useRulePlaylists();
  const full = values.length >= maxValues;
  const anyEmpty = values.some((id) => hasNothingToMatch(id));

  function add(id: number) {
    if (full || values.includes(id)) return;

    const chosen = suggestions.options.find((option) => option.id === id);
    if (!chosen) return;

    remember({ id, name: chosen.label, trackCount: chosen.trackCount });
    onChange([...values, id]);
  }

  function removeAt(index: number) {
    if (index < 0 || index >= values.length) return;

    onChange(values.filter((_, i) => i !== index));
  }

  return (
    <div className="w-full max-w-[22rem] space-y-1.5">
      {full ? (
        <p className="text-xs text-muted-foreground">
          {maxValues} playlists is the most one rule can match.
        </p>
      ) : (
        <SuggestCombobox
          query={query}
          onQueryChange={setQuery}
          options={suggestions.options.filter(
            (option) => !values.includes(option.id) && option.id !== excludedId,
          )}
          loading={suggestions.isLoading}
          onSelect={(option) => add(Number(option.id))}
          onBackspaceEmpty={() => removeAt(values.length - 1)}
          ariaLabel={`${label} values`}
          placeholder={values.length ? "Add another…" : `${label}…`}
          invalid={invalid}
          describedBy={describedBy}
        />
      )}
      {values.length > 0 && (
        <ul className="flex flex-wrap gap-1">
          {values.map((id, index) => {
            const name = playlistLabel(id, nameOf(id));
            const empty = hasNothingToMatch(id);
            return (
              <li key={id}>
                <Badge variant="secondary" className="gap-1 px-2">
                  {empty && (
                    <>
                      <AlertTriangleIcon
                        aria-hidden
                        className="size-3 shrink-0 text-muted-foreground"
                      />
                      <span className="sr-only">
                        {name} has no synced tracks, so it changes nothing here.
                      </span>
                    </>
                  )}
                  <span className="max-w-[12rem] truncate">{name}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${name}`}
                    onClick={() => removeAt(index)}
                    className="shrink-0 rounded-full hover:text-foreground"
                  >
                    <XIcon className="size-3" />
                  </button>
                </Badge>
              </li>
            );
          })}
        </ul>
      )}
      {anyEmpty && (
        <p className="text-xs text-muted-foreground">
          Marked playlists have no synced tracks yet, so they change nothing here.
        </p>
      )}
    </div>
  );
}
