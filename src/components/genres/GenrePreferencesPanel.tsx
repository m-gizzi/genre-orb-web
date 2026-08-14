import {
  CONFIGURABLE_GENRE_SOURCES,
  type ConfigurableGenreSource,
  type GenrePreferences,
} from "@/api/client";
import {
  useGenrePreferences,
  useToggleBlockedGenre,
  useUpdateGenrePreferences,
} from "@/hooks/useGenreCuration";
import { SOURCE_LABEL } from "@/lib/genres";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

/** Whole tenths — a finer floor than this is false precision over a tag count. */
const FLOOR_STEP = 0.1;

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function SourceRow({
  source,
  preferences,
  onChange,
}: {
  source: ConfigurableGenreSource;
  preferences: GenrePreferences;
  onChange: (update: Partial<{ enabled: boolean; min_confidence: number }>) => void;
}) {
  const setting = preferences.sources[source];

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <label className="flex min-w-[9rem] items-center gap-2 text-sm">
        <Switch
          checked={setting.enabled}
          onCheckedChange={(enabled: boolean) => onChange({ enabled })}
        />
        {SOURCE_LABEL[source]}
      </label>

      <label className="flex flex-1 items-center gap-2 text-sm text-muted-foreground">
        <span className="whitespace-nowrap">Minimum confidence</span>
        <input
          type="range"
          min={0}
          max={1}
          step={FLOOR_STEP}
          value={setting.min_confidence}
          disabled={!setting.enabled}
          onChange={(event) =>
            onChange({ min_confidence: Number(event.target.value) })
          }
          aria-label={`${SOURCE_LABEL[source]} minimum confidence`}
          className="max-w-[12rem] flex-1 disabled:opacity-40"
        />
        <span className="w-10 tabular-nums">{percent(setting.min_confidence)}</span>
      </label>
    </div>
  );
}

export function GenrePreferencesPanel() {
  const query = useGenrePreferences();
  const update = useUpdateGenrePreferences();
  const blocked = useToggleBlockedGenre();

  if (query.isLoading) return <Skeleton className="h-40 w-full" />;
  if (!query.data) return null;

  const preferences = query.data;

  return (
    <section className="space-y-3 rounded-lg border bg-card p-4">
      <div>
        <h2 className="font-heading text-lg font-medium">Genre sources</h2>
        <p className="text-sm text-muted-foreground">
          Turning a source off, or raising its minimum confidence, removes those
          genres everywhere — including from what your smart playlists match.
        </p>
      </div>

      <div className="space-y-3">
        {CONFIGURABLE_GENRE_SOURCES.map((source) => (
          <SourceRow
            key={source}
            source={source}
            preferences={preferences}
            onChange={(setting) =>
              update.mutate({ sources: { [source]: setting } })
            }
          />
        ))}
      </div>

      <div>
        <h3 className="text-sm font-medium">Blocked genres</h3>
        {preferences.blocked_genres.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing blocked. Use “Block” on a genre to remove it from your whole
            library — useful for tags like “seen live”.
          </p>
        ) : (
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {preferences.blocked_genres.map((genre) => (
              <Badge key={genre.id} variant="outline" className="gap-1">
                {genre.name}
                <button
                  type="button"
                  aria-label={`Unblock ${genre.name}`}
                  onClick={() => blocked.toggle(genre.id, false)}
                  className="ml-0.5 text-xs opacity-70 hover:opacity-100"
                >
                  Unblock
                </button>
              </Badge>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
