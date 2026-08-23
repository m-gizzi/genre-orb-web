import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useListFilters } from "./useListFilters";

describe("useListFilters", () => {
  it("starts from the given defaults", () => {
    const { result } = renderHook(() => useListFilters({ page: 2, sort: "name" }));

    expect(result.current.filters).toEqual({ page: 2, sort: "name" });
  });

  it("merges a patch over the current filters", () => {
    const { result } = renderHook(() => useListFilters({ page: 1, sort: "name" }));

    act(() => result.current.applyPatch({ sort: "track_count" }));

    expect(result.current.filters).toEqual({ page: 1, sort: "track_count" });
  });

  it("returns to the first page when a patch doesn't name one", () => {
    const { result } = renderHook(() => useListFilters({ page: 4, sort: "name" }));

    act(() => result.current.applyPatch({ sort: "track_count" }));

    expect(result.current.filters.page).toBe(1);
  });

  it("honours an explicit page", () => {
    const { result } = renderHook(() => useListFilters({ page: 1, sort: "name" }));

    act(() => result.current.applyPatch({ page: 3 }));

    expect(result.current.filters.page).toBe(3);
  });
});
