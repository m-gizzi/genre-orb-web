import { useState } from "react";
import { ChevronRightIcon } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

/** Whole tenths — a finer floor than this is false precision over a tag count. */
const FLOOR_STEP = 0.1;

function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

/** What the header says while collapsed, so you can tell the list is being filtered. */
function summarize(preferences: GenrePreferences): string {
  const off = CONFIGURABLE_GENRE_SOURCES.filter(
    (source) => !preferences.sources[source].enabled,
  ).length;
  const floored = CONFIGURABLE_GENRE_SOURCES.filter(
    (source) => preferences.sources[source].min_confidence > 0,
  ).length;
  const blocked = preferences.blocked_genres.length;

  const parts = [
    off > 0 && `${off} source${off === 1 ? "" : "s"} off`,
    floored > 0 && `${floored} filtered`,
    blocked > 0 && `${blocked} blocked`,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" · ") : "All sources on";
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

/**
 * Collapsed by default: the genre cloud is what the page is for, and a long blocklist would
 * otherwise push it below the fold. The summary keeps the state visible while closed, so
 * you can tell at a glance whether anything is filtering the list underneath.
 */
export function GenrePreferencesPanel() {
  const [open, setOpen] = useState(false);
  const query = useGenrePreferences();
  const update = useUpdateGenrePreferences();
  const blocked = useToggleBlockedGenre();

  if (query.isLoading) return <Skeleton className="h-14 w-full" />;
  if (!query.data) return null;

  const preferences = query.data;

  return (
    <section className="rounded-lg border bg-card">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 p-4 text-left"
      >
        <ChevronRightIcon
          aria-hidden="true"
          className={cn("size-4 shrink-0 transition-transform", open && "rotate-90")}
        />
        <span className="font-heading text-lg font-medium">Genre sources</span>
        <span className="ml-auto text-sm text-muted-foreground">
          {summarize(preferences)}
        </span>
      </button>

      {open && (
        <div className="space-y-4 border-t p-4">
          <p className="text-sm text-muted-foreground">
            Turning a source off, or raising its minimum confidence, removes those
            genres everywhere — including from what your smart playlists match.
          </p>

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
                Nothing blocked. Use the × on a genre to remove it from your whole
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
        </div>
      )}
    </section>
  );
}
