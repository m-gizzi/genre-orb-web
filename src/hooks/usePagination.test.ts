import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { usePagination } from "./usePagination";
import { DEFAULT_PER_PAGE } from "@/lib/config";

describe("usePagination", () => {
  it("starts on page 1 with the default per-page", () => {
    const { result } = renderHook(() => usePagination());
    expect(result.current.page).toBe(1);
    expect(result.current.perPage).toBe(DEFAULT_PER_PAGE);
  });

  it("honours a custom default per-page", () => {
    const { result } = renderHook(() => usePagination(50));
    expect(result.current.perPage).toBe(50);
  });

  it("updates the page", () => {
    const { result } = renderHook(() => usePagination());
    act(() => result.current.setPage(4));
    expect(result.current.page).toBe(4);
  });

  it("resets to page 1 when per-page changes", () => {
    const { result } = renderHook(() => usePagination());
    act(() => result.current.setPage(4));
    act(() => result.current.setPerPage(100));
    expect(result.current.perPage).toBe(100);
    expect(result.current.page).toBe(1);
  });
});
