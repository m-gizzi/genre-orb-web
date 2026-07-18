import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { ApiCollection, Genre, TrackFilters } from "@/api/client";
import { useGenres } from "@/hooks/useGenres";
import { TrackFilterBar } from "./TrackFilterBar";

vi.mock("@/hooks/useGenres", () => ({ useGenres: vi.fn() }));

const emptyGenres: ApiCollection<Genre> = {
  data: [],
  meta: { page: 1, per_page: 8, total: 0, total_pages: 1 },
};

vi.mocked(useGenres).mockReturnValue({
  data: emptyGenres,
} as ReturnType<typeof useGenres>);

function renderBar(filters: TrackFilters = {}, onClear = vi.fn()) {
  return render(
    <TrackFilterBar filters={filters} onChange={vi.fn()} onClear={onClear} />
  );
}

describe("TrackFilterBar", () => {
  afterEach(() => vi.clearAllMocks());

  it("converts a duration filter from ms to minutes for display", () => {
    renderBar({ duration_min: 180000 });
    expect(screen.getByPlaceholderText("Duration ≥")).toHaveValue(3);
  });

  it("shows the year filter value", () => {
    renderBar({ year_min: 1990 });
    expect(screen.getByPlaceholderText("Year ≥")).toHaveValue(1990);
  });

  it("hides the clear button when no filters are active", () => {
    renderBar({});
    expect(
      screen.queryByRole("button", { name: /Clear/ })
    ).not.toBeInTheDocument();
  });

  it("shows and fires clear when a filter is active", () => {
    const onClear = vi.fn();
    renderBar({ title: "war" }, onClear);
    fireEvent.click(screen.getByRole("button", { name: /Clear/ }));
    expect(onClear).toHaveBeenCalled();
  });
});
