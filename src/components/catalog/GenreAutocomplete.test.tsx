import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { ApiCollection, Genre } from "@/api/client";
import { useGenres } from "@/hooks/useGenres";
import { GenreAutocomplete } from "./GenreAutocomplete";

vi.mock("@/hooks/useGenres", () => ({ useGenres: vi.fn() }));

const mockedUseGenres = vi.mocked(useGenres);

function mockResults(genres: Genre[]) {
  const collection: ApiCollection<Genre> = {
    data: genres,
    meta: { page: 1, per_page: 8, total: genres.length, total_pages: 1 },
  };
  mockedUseGenres.mockReturnValue({
    data: collection,
  } as ReturnType<typeof useGenres>);
}

describe("GenreAutocomplete", () => {
  afterEach(() => vi.clearAllMocks());

  it("renders a removable chip when a genre is selected", () => {
    mockResults([]);
    const onSelect = vi.fn();
    render(
      <GenreAutocomplete valueId={5} valueName="Jazz" onSelect={onSelect} />
    );

    expect(screen.getByText("Jazz")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear genre filter" }));
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it("opens results as the user types and selects one", () => {
    mockResults([
      { id: 1, name: "Jazz" },
      { id: 2, name: "Jungle" },
    ]);
    const onSelect = vi.fn();
    render(<GenreAutocomplete onSelect={onSelect} />);

    expect(screen.queryByText("Jungle")).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("Genre…"), {
      target: { value: "j" },
    });
    fireEvent.mouseDown(screen.getByText("Jungle"));

    expect(onSelect).toHaveBeenCalledWith({ id: 2, name: "Jungle" });
  });
});
