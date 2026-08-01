import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDebouncedCommit } from "./useDebouncedCommit";

const DELAY = 350;

describe("useDebouncedCommit", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("does not commit on first render", () => {
    const onCommit = vi.fn();
    renderHook(() => useDebouncedCommit("hello", onCommit, DELAY));
    act(() => vi.advanceTimersByTime(DELAY * 3));
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("commits once the delay elapses", () => {
    const onCommit = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedCommit("", onCommit, DELAY)
    );

    act(() => result.current[1]("war"));
    act(() => vi.advanceTimersByTime(DELAY - 1));
    expect(onCommit).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(onCommit).toHaveBeenCalledExactlyOnceWith("war");
  });

  it("adopts a value changed externally without committing it back", () => {
    const onCommit = vi.fn();
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedCommit(value, onCommit, DELAY),
      { initialProps: { value: "a" } }
    );

    rerender({ value: "b" });
    expect(result.current[0]).toBe("b");

    act(() => vi.advanceTimersByTime(DELAY * 2));
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("keeps keystrokes typed while the commit is in flight", () => {
    const onCommit = vi.fn();
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedCommit(value, onCommit, DELAY),
      { initialProps: { value: "" } }
    );

    act(() => result.current[1]("war"));
    act(() => vi.advanceTimersByTime(DELAY));
    expect(onCommit).toHaveBeenCalledWith("war");

    act(() => result.current[1]("warp"));
    rerender({ value: "war" });

    expect(result.current[0]).toBe("warp");

    act(() => vi.advanceTimersByTime(DELAY));
    expect(onCommit).toHaveBeenLastCalledWith("warp");
  });

  it("clears local state when the owner clears the value", () => {
    const onCommit = vi.fn();
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedCommit(value, onCommit, DELAY),
      { initialProps: { value: "" } }
    );

    act(() => result.current[1]("war"));
    act(() => vi.advanceTimersByTime(DELAY));
    rerender({ value: "war" });

    rerender({ value: "" });
    expect(result.current[0]).toBe("");

    act(() => vi.advanceTimersByTime(DELAY * 2));
    expect(onCommit).toHaveBeenCalledExactlyOnceWith("war");
  });
});
