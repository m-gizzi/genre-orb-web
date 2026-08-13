import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import type { ArtistMetadataSource } from "@/api/client";
import { ArtistSources } from "./ArtistSources";

function source(overrides: Partial<ArtistMetadataSource> = {}): ArtistMetadataSource {
  return {
    source: "musicbrainz",
    state: "pending",
    external_id: null,
    external_url: null,
    fetched_at: null,
    ...overrides,
  };
}

describe("ArtistSources", () => {
  it("renders nothing when the artist has no source rows yet", () => {
    const { container } = render(<ArtistSources sources={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("distinguishes 'no genres there' from 'not looked yet'", () => {
    render(
      <ArtistSources
        sources={[
          source({ source: "musicbrainz", state: "unmatched" }),
          source({ source: "lastfm", state: "pending" }),
        ]}
      />
    );

    expect(screen.getByText("No genres for this artist")).toBeInTheDocument();
    expect(screen.getByText("Not checked yet")).toBeInTheDocument();
  });

  it("dates a source whose genres have been read", () => {
    render(
      <ArtistSources
        sources={[source({ state: "matched", fetched_at: "2026-08-11T10:00:00Z" })]}
      />
    );

    expect(screen.getByText(/Genres imported Aug 11, 2026/)).toBeInTheDocument();
  });

  it("marks a match whose genres have not been read yet", () => {
    render(<ArtistSources sources={[source({ state: "matched" })]} />);

    expect(screen.getByText("Matched — genres not read yet")).toBeInTheDocument();
  });

  it("says a failed lookup will come back around", () => {
    render(<ArtistSources sources={[source({ state: "errored" })]} />);

    expect(screen.getByText("Lookup failed — will retry")).toBeInTheDocument();
  });

  it("links out to the provider when it gave us a URL", () => {
    render(
      <ArtistSources
        sources={[
          source({
            source: "lastfm",
            state: "matched",
            external_url: "https://www.last.fm/music/Muse",
          }),
        ]}
      />
    );

    expect(screen.getByRole("link", { name: "Open on Last.fm" })).toHaveAttribute(
      "href",
      "https://www.last.fm/music/Muse"
    );
  });

  it("shows no link for a source that never matched", () => {
    render(<ArtistSources sources={[source({ state: "unmatched" })]} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
