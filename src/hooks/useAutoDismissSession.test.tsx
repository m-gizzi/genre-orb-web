import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { SyncSession } from "@/api/client";
import { useAutoDismissSession } from "./useAutoDismissSession";

const NOW = new Date("2020-01-01T00:00:00.000Z");
const TIMEOUT = 5000;

function makeSession(overrides: Partial<SyncSession> = {}): SyncSession {
  return {
    id: 1,
    status: "running",
    progress: { total: 1, completed: 0, skipped: 0, failed: 0, percent: 0 },
    error_message: null,
    started_at: null,
    completed_at: null,
    playlists: [],
    ...overrides,
  };
}

describe("useAutoDismissSession", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  it("keeps an active session visible indefinitely", () => {
    const session = makeSession({ status: "running" });
    const { result } = renderHook(() =>
      useAutoDismissSession(session, TIMEOUT)
    );

    expect(result.current[0]).toBe(session);
    act(() => vi.advanceTimersByTime(TIMEOUT * 3));
    expect(result.current[0]).toBe(session);
  });

  it("auto-dismisses a completed session after the timeout", () => {
    const session = makeSession({
      status: "completed",
      completed_at: NOW.toISOString(),
    });
    const { result } = renderHook(() =>
      useAutoDismissSession(session, TIMEOUT)
    );

    expect(result.current[0]).toBe(session);
    act(() => vi.advanceTimersByTime(TIMEOUT - 1));
    expect(result.current[0]).toBe(session);
    act(() => vi.advanceTimersByTime(1));
    expect(result.current[0]).toBeNull();
  });

  it("hides a completed session immediately when its deadline already passed", () => {
    const session = makeSession({
      status: "completed",
      completed_at: new Date(NOW.getTime() - TIMEOUT - 1000).toISOString(),
    });
    const { result } = renderHook(() =>
      useAutoDismissSession(session, TIMEOUT)
    );

    act(() => vi.advanceTimersByTime(0));
    expect(result.current[0]).toBeNull();
  });

  it("keeps error notices until dismissed manually", () => {
    const session = makeSession({
      status: "completed_with_errors",
      completed_at: NOW.toISOString(),
    });
    const { result } = renderHook(() =>
      useAutoDismissSession(session, TIMEOUT)
    );

    act(() => vi.advanceTimersByTime(TIMEOUT * 3));
    expect(result.current[0]).toBe(session);

    act(() => result.current[1]());
    expect(result.current[0]).toBeNull();
  });
});
