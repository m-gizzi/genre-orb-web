import { useState } from "react";
import type { SourcedGenre } from "@/api/client";
import { useGenres } from "@/hooks/useGenres";
import { useGenreOverrides } from "@/hooks/useGenreCuration";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { GenreChip } from "@/components/catalog";
import { SuggestCombobox } from "@/components/catalog/SuggestCombobox";
import { groupGenres, type GroupedGenre } from "@/lib/genres";

interface GenreEditorProps {
  subject: "track" | "artist";
  subjectId: number;
  genres: SourcedGenre[];
  emptyMessage: string;
}

/**
 * A genre nobody but you claimed is reverted rather than hidden — same visible result, but
 * it clears the override instead of stacking a second one on top of it. Anything a provider
 * also claims has to be hidden, or the provider's claim would simply come back.
 */
function isYoursAlone(genre: GroupedGenre): boolean {
  return genre.sources.length === 1 && genre.sources[0] === "user";
}

export function GenreEditor({
  subject,
  subjectId,
  genres,
  emptyMessage,
}: GenreEditorProps) {
  const [query, setQuery] = useState("");
  const debounced = useDebouncedValue(query, 250);
  const overrides = useGenreOverrides(subject, subjectId);
  const suggestions = useGenres({
    search: debounced || undefined,
    per_page: 8,
  });

  const grouped = groupGenres(genres);
  const present = new Set(grouped.map((genre) => genre.name));

  return (
    <div className="space-y-3">
      {grouped.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {grouped.map((genre) => (
            <GenreChip
              key={genre.genre_id}
              genre={genre}
              removeLabel={isYoursAlone(genre) ? "Undo adding" : "Hide"}
              onRemove={() =>
                isYoursAlone(genre)
                  ? overrides.revert(genre.genre_id)
                  : overrides.hide(genre.genre_id)
              }
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      )}

      <SuggestCombobox
        query={query}
        onQueryChange={setQuery}
        options={(suggestions.data?.data ?? [])
          .filter((genre) => !present.has(genre.name))
          .map((genre) => ({ id: genre.id, label: genre.name }))}
        onSelect={(option) => overrides.add(option.label)}
        onCommitText={(text) => overrides.add(text)}
        loading={suggestions.isFetching || query.trim() !== debounced.trim()}
        ariaLabel={`Add a genre to this ${subject}`}
        placeholder="Add a genre…"
        className="max-w-[16rem]"
      />

      {overrides.error && (
        <p className="text-sm text-destructive">
          That genre could not be saved. Please try again.
        </p>
      )}
    </div>
  );
}
