import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import type { PushSession } from "@/api/client";
import { useVisiblePushes } from "./useVisiblePushes";

const NOW = new Date("2020-01-01T00:00:00.000Z");
const TIMEOUT = 5000;

function pushSession(overrides: Partial<PushSession> = {}): PushSession {
  return {
    id: 1,
    status: "running",
    trigger: "manual",
    progress: { total: 2, completed: 0, percent: 0 },
    error_message: null,
    started_at: null,
    completed_at: null,
    smart_playlist_id: 7,
    smart_playlist_name: "Metal Mix",
    strategy: "diff",
    tracks_added: 0,
    tracks_removed: 0,
    match_count: 0,
    sampled: false,
    ...overrides,
  };
}

function renderVisiblePushes(
  initialProps: { recent: PushSession[]; active: PushSession[] } = {
    recent: [],
    active: [],
  }
) {
  return renderHook(
    ({ recent, active }) => useVisiblePushes(recent, active, TIMEOUT),
    { initialProps }
  );
}

describe("useVisiblePushes", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  it("surfaces a push once it finishes", () => {
    const running = pushSession({ id: 1, status: "running" });
    const { result, rerender } = renderVisiblePushes({
      recent: [],
      active: [running],
    });

    expect(result.current[0]).toEqual([]);

    const completed = pushSession({
      id: 1,
      status: "completed",
      completed_at: NOW.toISOString(),
    });
    rerender({ recent: [completed], active: [] });

    expect(result.current[0]).toEqual([completed]);
  });

  it("never surfaces a push the scheduler started", () => {
    const running = pushSession({ id: 1, status: "running", trigger: "scheduled" });
    const { result, rerender } = renderVisiblePushes({
      recent: [],
      active: [running],
    });

    const completed = pushSession({
      id: 1,
      status: "completed",
      trigger: "scheduled",
      completed_at: NOW.toISOString(),
    });
    rerender({ recent: [completed], active: [] });

    expect(result.current[0]).toEqual([]);
  });

  it("keeps an earlier finished push visible when a later one finishes", () => {
    const first = pushSession({ id: 1, smart_playlist_id: 7 });
    const second = pushSession({ id: 2, smart_playlist_id: 9 });
    const { result, rerender } = renderVisiblePushes({
      recent: [],
      active: [first, second],
    });

    const firstDone = {
      ...first,
      status: "failed" as const,
      error_message: "Spotify rejected the request",
      completed_at: NOW.toISOString(),
    };
    rerender({ recent: [firstDone], active: [second] });
    expect(result.current[0]).toEqual([firstDone]);

    const secondDone = {
      ...second,
      status: "completed" as const,
      completed_at: new Date(NOW.getTime() + 1000).toISOString(),
    };

    rerender({ recent: [secondDone, firstDone], active: [] });

    expect(result.current[0]).toEqual([secondDone, firstDone]);
  });

  it("auto-dismisses each completed push on its own deadline", () => {
    const first = pushSession({ id: 1, smart_playlist_id: 7 });
    const second = pushSession({ id: 2, smart_playlist_id: 9 });
    const { result, rerender } = renderVisiblePushes({
      recent: [],
      active: [first, second],
    });

    const firstDone = {
      ...first,
      status: "completed" as const,
      completed_at: NOW.toISOString(),
    };
    const secondDone = {
      ...second,
      status: "completed" as const,
      completed_at: new Date(NOW.getTime() + 2000).toISOString(),
    };
    rerender({ recent: [secondDone, firstDone], active: [] });
    expect(result.current[0]).toHaveLength(2);

    act(() => vi.advanceTimersByTime(TIMEOUT));
    expect(result.current[0]).toEqual([secondDone]);

    act(() => vi.advanceTimersByTime(2000));
    expect(result.current[0]).toEqual([]);
  });

  it("keeps a failed push until it is dismissed manually", () => {
    const running = pushSession({ id: 1 });
    const { result, rerender } = renderVisiblePushes({
      recent: [],
      active: [running],
    });

    const failed = {
      ...running,
      status: "failed" as const,
      error_message: "Spotify rejected the request",
      completed_at: NOW.toISOString(),
    };
    rerender({ recent: [failed], active: [] });

    act(() => vi.advanceTimersByTime(TIMEOUT * 3));
    expect(result.current[0]).toEqual([failed]);

    act(() => result.current[1](1));
    expect(result.current[0]).toEqual([]);
  });

  it("dismisses only the push it was given", () => {
    const first = pushSession({ id: 1, smart_playlist_id: 7 });
    const second = pushSession({ id: 2, smart_playlist_id: 9 });
    const { result, rerender } = renderVisiblePushes({
      recent: [],
      active: [first, second],
    });

    const firstDone = { ...first, status: "failed" as const };
    const secondDone = { ...second, status: "failed" as const };
    rerender({ recent: [secondDone, firstDone], active: [] });

    act(() => result.current[1](2));

    expect(result.current[0]).toEqual([firstDone]);
  });

  it("ignores history for pushes it never saw running", () => {
    const stale = pushSession({
      id: 99,
      status: "failed",
      error_message: "Spotify rejected the request",
      completed_at: new Date(NOW.getTime() - 60_000).toISOString(),
    });

    const { result } = renderVisiblePushes({ recent: [stale], active: [] });

    act(() => vi.advanceTimersByTime(TIMEOUT * 3));
    expect(result.current[0]).toEqual([]);
  });
});
