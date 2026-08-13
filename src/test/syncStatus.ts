import { vi } from "vitest";
import { EMPTY_ENRICHMENT_COVERAGE } from "@/api/client";
import type { useSyncStatus } from "@/contexts/SyncStatusContext";

type SyncStatus = ReturnType<typeof useSyncStatus>;

export function syncStatusValue(
  overrides: {
    library?: Partial<SyncStatus["library"]>;
    artist?: Partial<SyncStatus["artist"]>;
    push?: Partial<SyncStatus["push"]>;
  } = {}
): SyncStatus {
  return {
    library: {
      visibleSession: null,
      nextScheduledRunAt: null,
      hasActiveSync: false,
      isError: false,
      start: vi.fn(),
      isStarting: false,
      fetchPlaylists: vi.fn(),
      isFetchingPlaylists: false,
      dismissSession: vi.fn(),
      ...overrides.library,
    },
    artist: {
      visibleSession: null,
      hasActiveSync: false,
      isError: false,
      artistsTotal: 10,
      artistsSynced: 4,
      enrichment: EMPTY_ENRICHMENT_COVERAGE,
      hasArtistsToSync: true,
      start: vi.fn(),
      isStarting: false,
      resyncAll: vi.fn(),
      isResyncing: false,
      refetchStatus: vi.fn(),
      dismissSession: vi.fn(),
      ...overrides.artist,
    },
    push: {
      activePushes: [],
      finishedPushes: [],
      hasActivePush: false,
      isError: false,
      activePushFor: vi.fn(),
      isPushing: vi.fn(() => false),
      start: vi.fn(),
      dismissFinished: vi.fn(),
      ...overrides.push,
    },
    message: null,
    show: vi.fn(),
  };
}
