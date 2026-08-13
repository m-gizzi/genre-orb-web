import { ExternalLinkIcon } from "lucide-react";
import type { ArtistMetadataSource } from "@/api/client";
import { formatDate } from "@/lib/format";
import { SOURCE_LABEL } from "@/lib/genres";

function describeState(source: ArtistMetadataSource): string {
  switch (source.state) {
    case "matched":
      return source.fetched_at
        ? `Genres imported ${formatDate(source.fetched_at)}`
        : "Matched — genres not read yet";
    case "unmatched":
      return "No genres for this artist";
    case "errored":
      return "Lookup failed — will retry";
    case "pending":
      return "Not checked yet";
  }
}

export function ArtistSources({ sources }: { sources: ArtistMetadataSource[] }) {
  if (sources.length === 0) return null;

  return (
    <section className="mb-8">
      <h2 className="mb-3 font-heading text-lg font-medium">Genre sources</h2>
      <dl className="divide-y rounded-lg border bg-card text-sm">
        {sources.map((source) => (
          <div
            key={source.source}
            className="flex items-center justify-between gap-4 px-4 py-2"
          >
            <dt className="font-medium">{SOURCE_LABEL[source.source]}</dt>
            <dd className="flex items-center gap-2 text-muted-foreground">
              {describeState(source)}
              {source.external_url && (
                <a
                  href={source.external_url}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-primary"
                  aria-label={`Open on ${SOURCE_LABEL[source.source]}`}
                >
                  <ExternalLinkIcon className="size-3.5" />
                </a>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
