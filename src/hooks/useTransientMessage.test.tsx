import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTransientMessage } from "./useTransientMessage";

const TIMEOUT = 5000;

describe("useTransientMessage", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("starts with no message", () => {
    const { result } = renderHook(() => useTransientMessage(TIMEOUT));
    expect(result.current.message).toBeNull();
  });

  it("shows a typed message via show", () => {
    const { result } = renderHook(() => useTransientMessage(TIMEOUT));
    act(() => result.current.show({ type: "error", text: "boom" }));
    expect(result.current.message).toEqual({ type: "error", text: "boom" });
  });

  it("shows success and error shortcuts", () => {
    const { result } = renderHook(() => useTransientMessage(TIMEOUT));
    act(() => result.current.showSuccess("ok"));
    expect(result.current.message).toEqual({ type: "success", text: "ok" });
    act(() => result.current.showError("bad"));
    expect(result.current.message).toEqual({ type: "error", text: "bad" });
  });

  it("clears manually", () => {
    const { result } = renderHook(() => useTransientMessage(TIMEOUT));
    act(() => result.current.showSuccess("ok"));
    act(() => result.current.clear());
    expect(result.current.message).toBeNull();
  });

  it("auto-clears after the timeout", () => {
    const { result } = renderHook(() => useTransientMessage(TIMEOUT));
    act(() => result.current.showSuccess("ok"));

    act(() => vi.advanceTimersByTime(TIMEOUT - 1));
    expect(result.current.message).not.toBeNull();

    act(() => vi.advanceTimersByTime(1));
    expect(result.current.message).toBeNull();
  });

  it("respects a custom timeout", () => {
    const { result } = renderHook(() => useTransientMessage(1000));
    act(() => result.current.showSuccess("ok"));
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.message).toBeNull();
  });
});
