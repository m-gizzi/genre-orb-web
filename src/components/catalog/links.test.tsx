import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test/utils";
import type { GroupedGenre } from "@/lib/genres";
import { ArtistLink, ArtistLinks, AlbumLink, GenreChip } from "./links";

describe("ArtistLink", () => {
  it("links to the artist detail page", () => {
    renderWithProviders(<ArtistLink artist={{ id: 3, name: "Muse" }} />);
    const link = screen.getByRole("link", { name: "Muse" });
    expect(link).toHaveAttribute("href", "/artists/3");
  });
});

describe("ArtistLinks", () => {
  it("renders a dash for an empty list", () => {
    renderWithProviders(<ArtistLinks artists={[]} />);
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders comma-separated links for multiple artists", () => {
    const { container } = renderWithProviders(
      <ArtistLinks
        artists={[
          { id: 1, name: "A" },
          { id: 2, name: "B" },
        ]}
      />
    );
    expect(screen.getByRole("link", { name: "A" })).toHaveAttribute(
      "href",
      "/artists/1"
    );
    expect(screen.getByRole("link", { name: "B" })).toHaveAttribute(
      "href",
      "/artists/2"
    );
    expect(container).toHaveTextContent("A, B");
  });
});

describe("AlbumLink", () => {
  it("renders a dash for a null album", () => {
    renderWithProviders(<AlbumLink album={null} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("links to the album detail page", () => {
    renderWithProviders(<AlbumLink album={{ id: 8, title: "OK Computer" }} />);
    expect(screen.getByRole("link", { name: "OK Computer" })).toHaveAttribute(
      "href",
      "/albums/8"
    );
  });
});

describe("GenreChip", () => {
  function grouped(overrides: Partial<GroupedGenre> = {}): GroupedGenre {
    return {
      genre_id: 3,
      name: "Metal",
      sources: ["spotify"],
      confidence: 1,
      ...overrides,
    };
  }

  it("links to the genre by genre_id and marks the source", () => {
    renderWithProviders(
      <GenreChip genre={grouped({ genre_id: 12, name: "Jazz" })} />
    );
    const link = screen.getByRole("link", { name: "Jazz" });
    expect(link).toHaveAttribute("href", "/genres/12");
    expect(link).toHaveAttribute("title", "From Spotify");
  });

  it("labels a user-added genre", () => {
    renderWithProviders(
      <GenreChip genre={grouped({ genre_id: 5, name: "Chill", sources: ["user"] })} />
    );
    expect(screen.getByRole("link", { name: "Chill" })).toHaveAttribute(
      "title",
      "Added by you"
    );
  });

  it("names every source that agreed on the genre", () => {
    renderWithProviders(
      <GenreChip genre={grouped({ sources: ["spotify", "musicbrainz"] })} />
    );
    expect(screen.getByRole("link", { name: "Metal" })).toHaveAttribute(
      "title",
      "From Spotify and MusicBrainz"
    );
  });

  it("shows how many sources agreed, so corroboration reads as a signal", () => {
    renderWithProviders(
      <GenreChip genre={grouped({ sources: ["spotify", "musicbrainz", "lastfm"] })} />
    );
    expect(screen.getByRole("link", { name: "Metal" })).toHaveTextContent("3");
  });

  it("keeps the count out of the link's accessible name", () => {
    renderWithProviders(
      <GenreChip genre={grouped({ sources: ["spotify", "musicbrainz", "lastfm"] })} />
    );
    expect(
      screen.queryByRole("link", { name: "Metal 3" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Metal" })).toBeInTheDocument();
  });

  it("shows no count for a genre only one source claimed", () => {
    renderWithProviders(<GenreChip genre={grouped()} />);
    expect(screen.getByRole("link", { name: "Metal" })).toHaveTextContent(/^Metal$/);
  });
});
