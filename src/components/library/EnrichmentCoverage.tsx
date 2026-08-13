import { ProgressBar } from "@/components/library/ProgressBar";
import { SOURCE_LABEL } from "@/lib/genres";
import {
  ENRICHMENT_SOURCES,
  type EnrichmentCoverage as Coverage,
  type EnrichmentSource,
} from "@/api/client";

function percentOf(coverage: Coverage): number {
  if (coverage.total === 0) return 0;
  return (coverage.fetched * 100) / coverage.total;
}

function summarize(coverage: Coverage): string {
  const parts = [`${coverage.fetched} enriched`];
  if (coverage.unmatched > 0) parts.push(`${coverage.unmatched} not found`);
  if (coverage.errored > 0) parts.push(`${coverage.errored} failed`);
  return parts.join(" · ");
}

function isUpToDate(coverage: Coverage): boolean {
  return coverage.total > 0 && coverage.pending === 0 && coverage.errored === 0;
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
                {isUpToDate(sourceCoverage)
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
