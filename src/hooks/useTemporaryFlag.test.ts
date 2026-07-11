import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTemporaryFlag } from "./useTemporaryFlag";

describe("useTemporaryFlag", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("starts false and turns true when started", () => {
    const { result } = renderHook(() => useTemporaryFlag(1000));
    expect(result.current[0]).toBe(false);

    act(() => result.current[1]());
    expect(result.current[0]).toBe(true);
  });

  it("auto-resets after the timeout", () => {
    const { result } = renderHook(() => useTemporaryFlag(1000));
    act(() => result.current[1]());

    act(() => vi.advanceTimersByTime(1000));
    expect(result.current[0]).toBe(false);
  });

  it("can be cleared early", () => {
    const { result } = renderHook(() => useTemporaryFlag(1000));
    act(() => result.current[1]());
    act(() => result.current[2]());

    expect(result.current[0]).toBe(false);
  });

  it("clears its timer on unmount", () => {
    const { result, unmount } = renderHook(() => useTemporaryFlag(1000));
    act(() => result.current[1]());
    unmount();

    expect(() => act(() => vi.advanceTimersByTime(1000))).not.toThrow();
  });
});
