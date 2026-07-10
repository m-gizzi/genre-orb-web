import { describe, it, expect, vi, afterEach } from "vitest";
import type { ReactNode } from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { libraryApi, type LibraryStatus, type SyncSession } from "@/api/client";
import { queryKeys } from "@/lib/queryKeys";
import { useLibrarySync } from "./useLibrarySync";

vi.mock("@/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/client")>();
  return {
    ...actual,
    libraryApi: {
      getStatus: vi.fn(),
      sync: vi.fn(),
      fetchPlaylists: vi.fn(),
    },
  };
});

const mockedLibraryApi = vi.mocked(libraryApi);

const inactiveStatus: LibraryStatus = {
  has_active_sync: false,
  current_session: null,
  rate_limited: false,
  rate_limit_resume_at: null,
  playlists_metadata_fetched_at: null,
};

const runningSession: SyncSession = {
  id: 1,
  status: "running",
  progress: { total: 2, completed: 0, skipped: 0, percent: 0 },
  started_at: null,
  completed_at: null,
  playlists: [],
};

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { queryClient, wrapper };
}

describe("useLibrarySync", () => {
  afterEach(() => vi.clearAllMocks());

  it("shows the created session immediately after sync, even while status polling still reports none", async () => {
    mockedLibraryApi.getStatus.mockResolvedValue(inactiveStatus);
    mockedLibraryApi.sync.mockResolvedValue({
      status: "queued",
      session: runningSession,
    });

    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useLibrarySync({ enabled: true }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.status).toBeDefined());
    expect(result.current.hasActiveSync).toBe(false);

    act(() => {
      result.current.sync();
    });

    await waitFor(() => {
      expect(result.current.currentSession).toEqual(runningSession);
      expect(result.current.hasActiveSync).toBe(true);
    });
  });

  it("refreshes playlists and artist counts when a sync finishes", async () => {
    const activeStatus: LibraryStatus = {
      ...inactiveStatus,
      has_active_sync: true,
      current_session: runningSession,
    };
    mockedLibraryApi.getStatus.mockResolvedValue(activeStatus);

    const { queryClient, wrapper } = makeWrapper();
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useLibrarySync({ enabled: true }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.hasActiveSync).toBe(true));
    invalidateSpy.mockClear();

    act(() => {
      queryClient.setQueryData<LibraryStatus>(queryKeys.libraryStatus, {
        ...activeStatus,
        has_active_sync: false,
        current_session: { ...runningSession, status: "completed" },
      });
    });

    await waitFor(() =>
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: queryKeys.playlists,
      })
    );
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.artistSyncStatus,
    });
  });
});
