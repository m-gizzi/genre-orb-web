import { vi } from "vitest";
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
      visibleFinished: null,
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
