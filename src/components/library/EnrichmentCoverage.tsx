import { ProgressBar } from "@/components/library/ProgressBar";
import {
  ENRICHMENT_SOURCES,
  type EnrichmentCoverage as Coverage,
  type EnrichmentSource,
} from "@/api/client";

const SOURCE_LABEL: Record<EnrichmentSource, string> = {
  musicbrainz: "MusicBrainz",
  lastfm: "Last.fm",
};

function percentOf(coverage: Coverage): number {
  if (coverage.total === 0) return 0;
  return ((coverage.fetched + coverage.unmatched) * 100) / coverage.total;
}

function summarize(coverage: Coverage): string {
  const parts = [`${coverage.fetched} enriched`];
  if (coverage.unmatched > 0) parts.push(`${coverage.unmatched} not found`);
  if (coverage.errored > 0) parts.push(`${coverage.errored} failed`);
  return parts.join(" · ");
}

export function EnrichmentCoverage({
  coverage,
}: {
  coverage: Record<EnrichmentSource, Coverage>;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-xl font-semibold">Genre Enrichment</h2>
      <p className="text-sm text-muted-foreground">
        Genres are pulled from MusicBrainz and Last.fm continuously in the
        background. There is nothing to start — coverage fills in over time.
      </p>

      <div className="space-y-3 rounded-lg border bg-card p-4">
        {ENRICHMENT_SOURCES.map((source) => {
          const sourceCoverage = coverage[source];
          const done = sourceCoverage.total > 0 && sourceCoverage.pending === 0;

          return (
            <div key={source}>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {SOURCE_LABEL[source]}
                </span>
                <span className="font-medium tabular-nums">
                  {sourceCoverage.fetched} / {sourceCoverage.total}
                </span>
              </div>
              <ProgressBar
                percent={percentOf(sourceCoverage)}
                className="mt-2"
                label={`${SOURCE_LABEL[source]} genre coverage`}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                {done
                  ? `Up to date — ${summarize(sourceCoverage)}`
                  : summarize(sourceCoverage)}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
