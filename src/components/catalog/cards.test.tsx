import { describe, it, expect } from "vitest";
import { screen } from "@testing-library/react";
import type { Artist, Album } from "@/api/client";
import { renderWithProviders } from "@/test/utils";
import { ArtistCard, AlbumCard } from "./cards";

function makeArtist(overrides: Partial<Artist> = {}): Artist {
  return {
    id: 1,
    name: "Muse",
    spotify_id: "sp1",
    image_url: null,
    genres: [
      { id: 1, name: "Rock" },
      { id: 2, name: "Alternative" },
    ],
    followers: null,
    popularity: null,
    ...overrides,
  };
}

function makeAlbum(overrides: Partial<Album> = {}): Album {
  return {
    id: 1,
    title: "Absolution",
    spotify_id: "sp1",
    release_year: 2003,
    artwork_url: null,
    total_tracks: 14,
    saved_tracks: 3,
    artists: [{ id: 1, name: "Muse", spotify_id: "sp1", image_url: null }],
    ...overrides,
  };
}

describe("ArtistCard", () => {
  it("links to the artist and joins genre names", () => {
    renderWithProviders(<ArtistCard artist={makeArtist()} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/artists/1");
    expect(screen.getByText("Rock, Alternative")).toBeInTheDocument();
  });

  it("renders the image when present", () => {
    renderWithProviders(
      <ArtistCard artist={makeArtist({ image_url: "http://img/a.jpg" })} />
    );
    expect(screen.getByRole("img", { name: "Muse" })).toHaveAttribute(
      "src",
      "http://img/a.jpg"
    );
  });

  it("falls back to a placeholder icon without an image", () => {
    renderWithProviders(<ArtistCard artist={makeArtist()} />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });
});

describe("AlbumCard", () => {
  it("shows artist and release year in the meta line", () => {
    renderWithProviders(<AlbumCard album={makeAlbum()} />);
    expect(screen.getByText("Muse · 2003")).toBeInTheDocument();
  });

  it("omits the year when unknown", () => {
    renderWithProviders(
      <AlbumCard album={makeAlbum({ release_year: null })} />
    );
    expect(screen.getByText("Muse")).toBeInTheDocument();
  });

  it("summarizes saved and total track counts", () => {
    renderWithProviders(<AlbumCard album={makeAlbum()} />);
    expect(screen.getByText("3 saved, 14 total")).toBeInTheDocument();
  });
});
