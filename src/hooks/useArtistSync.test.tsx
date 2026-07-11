import { describe, it, expect, vi, afterEach } from "vitest";
import type { ReactNode } from "react";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  artistsApi,
  type ArtistMetadataSession,
  type ArtistSyncStatus,
} from "@/api/client";
import { useArtistSync } from "./useArtistSync";

vi.mock("@/api/client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/api/client")>();
  return {
    ...actual,
    artistsApi: {
      getSyncStatus: vi.fn(),
      sync: vi.fn(),
    },
  };
});

const mockedArtistsApi = vi.mocked(artistsApi);

const idleStatus: ArtistSyncStatus = {
  has_active_sync: false,
  current_session: null,
  rate_limited: false,
  rate_limit_resume_at: null,
  artists_total: 10,
  artists_synced: 4,
};

const runningSession: ArtistMetadataSession = {
  id: 1,
  status: "running",
  progress: { total: 5, completed: 0, percent: 0 },
  error_message: null,
  started_at: null,
  completed_at: null,
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

describe("useArtistSync", () => {
  afterEach(() => vi.clearAllMocks());

  it("derives artist counts and whether any artists still need syncing", async () => {
    mockedArtistsApi.getSyncStatus.mockResolvedValue(idleStatus);

    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useArtistSync({ enabled: true }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.status).toBeDefined());
    expect(result.current.artistsTotal).toBe(10);
    expect(result.current.artistsSynced).toBe(4);
    expect(result.current.hasArtistsToSync).toBe(true);
    expect(result.current.hasActiveSync).toBe(false);
  });

  it("reports no work remaining once every artist is synced", async () => {
    mockedArtistsApi.getSyncStatus.mockResolvedValue({
      ...idleStatus,
      artists_synced: 10,
    });

    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useArtistSync({ enabled: true }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.status).toBeDefined());
    expect(result.current.hasArtistsToSync).toBe(false);
  });

  it("shows the created session immediately after sync, before polling reports it", async () => {
    mockedArtistsApi.getSyncStatus.mockResolvedValue(idleStatus);
    mockedArtistsApi.sync.mockResolvedValue({
      status: "queued",
      session: runningSession,
    });

    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useArtistSync({ enabled: true }), {
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

  it("passes sync_all when resyncing everything", async () => {
    mockedArtistsApi.getSyncStatus.mockResolvedValue(idleStatus);
    mockedArtistsApi.sync.mockResolvedValue({
      status: "queued",
      session: runningSession,
    });

    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useArtistSync({ enabled: true }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.status).toBeDefined());

    act(() => {
      result.current.resyncAll();
    });

    await waitFor(() =>
      expect(mockedArtistsApi.sync).toHaveBeenCalledWith({ syncAll: true })
    );
  });

  it("surfaces a failure through onMessage", async () => {
    mockedArtistsApi.getSyncStatus.mockResolvedValue(idleStatus);
    mockedArtistsApi.sync.mockRejectedValue(new Error("Spotify is down"));
    const onMessage = vi.fn();

    const { wrapper } = makeWrapper();
    const { result } = renderHook(
      () => useArtistSync({ enabled: true, onMessage }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.status).toBeDefined());

    act(() => {
      result.current.sync();
    });

    await waitFor(() =>
      expect(onMessage).toHaveBeenCalledWith({
        type: "error",
        text: "Spotify is down",
      })
    );
  });
});
