import type { GenreSource, SourcedGenre } from "@/api/client";

export interface GroupedGenre {
  genre_id: number;
  name: string;
  /** Every source that claimed the genre, in SOURCE_ORDER. */
  sources: GenreSource[];
  /** The strongest claim any source made, used to rank within an agreement tier. */
  confidence: number;
}

/** The order sources are listed in within a chip. */
const SOURCE_ORDER: GenreSource[] = [
  "spotify",
  "musicbrainz",
  "lastfm",
  "user",
];

export const SOURCE_LABEL: Record<GenreSource, string> = {
  spotify: "Spotify",
  musicbrainz: "MusicBrainz",
  lastfm: "Last.fm",
  user: "You",
};

/** In a sentence the user is a person rather than a provider: "From Spotify and you". */
const PROSE_LABEL: Record<GenreSource, string> = { ...SOURCE_LABEL, user: "you" };

function sourceRank(source: GenreSource): number {
  const index = SOURCE_ORDER.indexOf(source);
  return index === -1 ? SOURCE_ORDER.length : index;
}

function addedByUser(genre: GroupedGenre): boolean {
  return genre.sources.includes("user");
}

export function groupGenres(genres: SourcedGenre[]): GroupedGenre[] {
  const byGenre = new Map<number, GroupedGenre>();

  for (const genre of genres) {
    const existing = byGenre.get(genre.genre_id);
    if (existing) {
      if (!existing.sources.includes(genre.source))
        existing.sources.push(genre.source);
      existing.confidence = Math.max(existing.confidence, genre.confidence);
    } else {
      byGenre.set(genre.genre_id, {
        genre_id: genre.genre_id,
        name: genre.name,
        sources: [genre.source],
        confidence: genre.confidence,
      });
    }
  }

  const grouped = [...byGenre.values()];
  for (const genre of grouped) {
    genre.sources.sort((a, b) => sourceRank(a) - sourceRank(b));
  }

  // A genre you added yourself outranks anything a provider guessed, however well
  // corroborated — the truncated lists elsewhere must never hide your own work.
  return grouped.sort(
    (a, b) =>
      Number(addedByUser(b)) - Number(addedByUser(a)) ||
      b.sources.length - a.sources.length ||
      b.confidence - a.confidence ||
      a.name.localeCompare(b.name),
  );
}

export function describeSources(sources: GenreSource[]): string {
  const labels = sources.map((source) => PROSE_LABEL[source] ?? source);
  if (labels.length === 0) return "Source unknown";
  if (labels.length === 1)
    return labels[0] === "you" ? "Added by you" : `From ${labels[0]}`;

  const last = labels[labels.length - 1];
  return `From ${labels.slice(0, -1).join(", ")} and ${last}`;
}
