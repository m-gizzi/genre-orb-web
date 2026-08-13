import type { GenreSource, TrackGenre } from "@/api/client";

export interface GroupedGenre {
  genre_id: number;
  name: string;
  sources: GenreSource[];
  /** The strongest claim any source made, used to rank within an agreement tier. */
  confidence: number;
}

/** Display order, and the order sources are listed in within a chip. */
const SOURCE_ORDER: GenreSource[] = [
  "spotify",
  "musicbrainz",
  "lastfm",
  "user",
];

const SOURCE_LABEL: Record<GenreSource, string> = {
  spotify: "Spotify",
  musicbrainz: "MusicBrainz",
  lastfm: "Last.fm",
  user: "you",
};

function sourceRank(source: GenreSource): number {
  const index = SOURCE_ORDER.indexOf(source);
  return index === -1 ? SOURCE_ORDER.length : index;
}

export function groupGenres(genres: TrackGenre[]): GroupedGenre[] {
  const byGenre = new Map<number, GroupedGenre>();

  for (const genre of genres) {
    const existing = byGenre.get(genre.genre_id);
    if (existing) {
      if (!existing.sources.includes(genre.source))
        existing.sources.push(genre.source);
      existing.confidence = Math.max(
        existing.confidence,
        genre.confidence ?? 0,
      );
    } else {
      byGenre.set(genre.genre_id, {
        genre_id: genre.genre_id,
        name: genre.name,
        sources: [genre.source],
        confidence: genre.confidence ?? 0,
      });
    }
  }

  return [...byGenre.values()]
    .map((genre) => ({
      ...genre,
      sources: [...genre.sources].sort((a, b) => sourceRank(a) - sourceRank(b)),
    }))
    .sort(
      (a, b) =>
        b.sources.length - a.sources.length ||
        b.confidence - a.confidence ||
        a.name.localeCompare(b.name),
    );
}

export function describeSources(sources: GenreSource[]): string {
  const labels = sources.map((source) => SOURCE_LABEL[source] ?? source);
  if (labels.length === 0) return "Source unknown";
  if (labels.length === 1)
    return labels[0] === "you" ? "Added by you" : `From ${labels[0]}`;

  const last = labels[labels.length - 1];
  return `From ${labels.slice(0, -1).join(", ")} and ${last}`;
}
