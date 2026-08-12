import { describe, it, expect, vi, afterEach } from "vitest";
import type { ReactNode } from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  smartPlaylistsApi,
  type PushSession,
  type PushStatus,
} from "@/api/client";
import { queryKeys } from "@/lib/queryKeys";
import { usePushStatus } from "./usePushStatus";

vi.mock("@/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/client")>();
  return {
    ...actual,
    smartPlaylistsApi: { push: vi.fn(), pushStatus: vi.fn() },
  };
});

const mockedApi = vi.mocked(smartPlaylistsApi);

const idleStatus: PushStatus = {
  active_pushes: [],
  recent_pushes: [],
  rate_limited: false,
  rate_limit_resume_at: null,
};

function pushSession(overrides: Partial<PushSession> = {}): PushSession {
  return {
    id: 1,
    status: "running",
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

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

describe("usePushStatus", () => {
  afterEach(() => vi.clearAllMocks());

  it("shows the started push immediately, before polling has seen it", async () => {
    mockedApi.pushStatus.mockResolvedValue(idleStatus);
    mockedApi.push.mockResolvedValue({
      session: pushSession(),
    });
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => usePushStatus({ enabled: true }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      result.current.push(7);
    });

    await waitFor(() => expect(result.current.hasActivePush).toBe(true));
    expect(result.current.isPushing(7)).toBe(true);
  });

  it("reports a push per smart playlist, not globally", async () => {
    mockedApi.pushStatus.mockResolvedValue({
      ...idleStatus,
      active_pushes: [pushSession({ smart_playlist_id: 7 })],
    });
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => usePushStatus({ enabled: true }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isPushing(7)).toBe(true));
    expect(result.current.isPushing(9)).toBe(false);
    expect(result.current.activePushFor(7)?.smart_playlist_name).toBe("Metal Mix");
  });

  it("tracks several pushes running at once", async () => {
    mockedApi.pushStatus.mockResolvedValue({
      ...idleStatus,
      active_pushes: [
        pushSession({ id: 1, smart_playlist_id: 7 }),
        pushSession({ id: 2, smart_playlist_id: 9 }),
      ],
    });
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => usePushStatus({ enabled: true }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.activePushes).toHaveLength(2));
    expect(result.current.isPushing(7)).toBe(true);
    expect(result.current.isPushing(9)).toBe(true);
  });

  it("keeps an in-flight push gated when a second push starts", async () => {
    mockedApi.pushStatus.mockResolvedValue(idleStatus);
    mockedApi.push.mockImplementation(
      () => new Promise<{ session: PushSession }>(() => {})
    );
    const { wrapper } = makeWrapper();

    const { result } = renderHook(() => usePushStatus({ enabled: true }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => result.current.push(7));
    await waitFor(() => expect(result.current.isPushing(7)).toBe(true));

    act(() => result.current.push(9));
    await waitFor(() => expect(result.current.isPushing(9)).toBe(true));

    expect(result.current.isPushing(7)).toBe(true);
  });

  it("invalidates smart playlist data once the last push finishes", async () => {
    mockedApi.pushStatus.mockResolvedValue({
      ...idleStatus,
      active_pushes: [pushSession()],
    });
    const { queryClient, wrapper } = makeWrapper();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    const { result, rerender } = renderHook(
      () => usePushStatus({ enabled: true }),
      { wrapper }
    );
    await waitFor(() => expect(result.current.hasActivePush).toBe(true));

    invalidate.mockClear();
    mockedApi.pushStatus.mockResolvedValue({
      ...idleStatus,
      recent_pushes: [pushSession({ status: "completed" })],
    });
    await act(async () => {
      await queryClient.refetchQueries({ queryKey: queryKeys.pushStatus });
    });
    rerender();

    await waitFor(() =>
      expect(invalidate).toHaveBeenCalledWith({
        queryKey: queryKeys.smartPlaylists,
      })
    );

    expect(invalidate).toHaveBeenCalledWith({
      queryKey: queryKeys.smartPlaylistDetails,
    });
  });

  it("does not invalidate while nothing has ever been pushed", async () => {
    mockedApi.pushStatus.mockResolvedValue(idleStatus);
    const { queryClient, wrapper } = makeWrapper();
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => usePushStatus({ enabled: true }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(invalidate).not.toHaveBeenCalledWith({
      queryKey: queryKeys.smartPlaylists,
    });
  });

  it("reports the failure through onMessage", async () => {
    mockedApi.pushStatus.mockResolvedValue(idleStatus);
    mockedApi.push.mockRejectedValue(new Error("Spotify not connected"));
    const onMessage = vi.fn();
    const { wrapper } = makeWrapper();

    const { result } = renderHook(
      () => usePushStatus({ enabled: true, onMessage }),
      { wrapper }
    );
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    await act(async () => {
      result.current.push(7);
    });

    await waitFor(() =>
      expect(onMessage).toHaveBeenCalledWith({
        type: "error",
        text: "Spotify not connected",
      })
    );
  });

  it("does not poll when Spotify is not connected", async () => {
    mockedApi.pushStatus.mockResolvedValue(idleStatus);
    const { wrapper } = makeWrapper();

    renderHook(() => usePushStatus({ enabled: false }), { wrapper });

    expect(mockedApi.pushStatus).not.toHaveBeenCalled();
  });
});
