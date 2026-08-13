import { createContext, useContext, useMemo, type ReactNode } from "react";
import type {
  ArtistMetadataSession,
  EnrichmentCoverage,
  EnrichmentSource,
  PushSession,
  SyncSession,
} from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLibrarySync } from "@/hooks/useLibrarySync";
import { useArtistSync } from "@/hooks/useArtistSync";
import { usePushStatus } from "@/hooks/usePushStatus";
import { useAutoDismissSession } from "@/hooks/useAutoDismissSession";
import { useVisiblePushes } from "@/hooks/useVisiblePushes";
import {
  useTransientMessage,
  type TransientMessage,
} from "@/hooks/useTransientMessage";
import { SYNC_NOTICE_TIMEOUT_MS } from "@/lib/config";

interface LibrarySyncState {
  visibleSession: SyncSession | null;
  nextScheduledRunAt: string | null;
  hasActiveSync: boolean;
  isError: boolean;
  start: () => void;
  isStarting: boolean;
  fetchPlaylists: () => void;
  isFetchingPlaylists: boolean;
  dismissSession: () => void;
}

interface ArtistSyncState {
  visibleSession: ArtistMetadataSession | null;
  hasActiveSync: boolean;
  isError: boolean;
  artistsTotal: number;
  artistsSynced: number;
  enrichment: Record<EnrichmentSource, EnrichmentCoverage>;
  hasArtistsToSync: boolean;
  start: () => void;
  isStarting: boolean;
  resyncAll: () => void;
  isResyncing: boolean;
  refetchStatus: () => void;
  dismissSession: () => void;
}

interface PushState {
  activePushes: PushSession[];
  finishedPushes: PushSession[];
  hasActivePush: boolean;
  isError: boolean;
  activePushFor: (id: number) => PushSession | undefined;
  isPushing: (id: number) => boolean;
  start: (id: number) => void;
  dismissFinished: (id: number) => void;
}

interface SyncStatusContextType {
  library: LibrarySyncState;
  artist: ArtistSyncState;
  push: PushState;
  message: TransientMessage | null;
  show: (message: TransientMessage) => void;
}

const SyncStatusContext = createContext<SyncStatusContextType | null>(null);

export function SyncStatusProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const enabled = !!user?.spotify_connected;

  const { message, show } = useTransientMessage();

  const librarySync = useLibrarySync({ enabled, onMessage: show });
  const artistSync = useArtistSync({ enabled, onMessage: show });
  const pushStatus = usePushStatus({ enabled, onMessage: show });

  const [visibleLibrarySession, dismissLibrarySession] = useAutoDismissSession(
    librarySync.currentSession,
    SYNC_NOTICE_TIMEOUT_MS
  );
  const [visibleArtistSession, dismissArtistSession] = useAutoDismissSession(
    artistSync.currentSession,
    SYNC_NOTICE_TIMEOUT_MS
  );
  const manualActivePushes = useMemo(
    () => pushStatus.activePushes.filter((push) => push.trigger === "manual"),
    [pushStatus.activePushes]
  );

  const [visibleFinishedPushes, dismissFinishedPush] = useVisiblePushes(
    pushStatus.recentPushes,
    pushStatus.activePushes,
    SYNC_NOTICE_TIMEOUT_MS
  );

  const library = useMemo<LibrarySyncState>(
    () => ({
      visibleSession: visibleLibrarySession,
      nextScheduledRunAt: librarySync.nextScheduledRunAt,
      hasActiveSync: librarySync.hasActiveSync,
      isError: librarySync.isError,
      start: librarySync.sync,
      isStarting: librarySync.isSyncing,
      fetchPlaylists: librarySync.fetchPlaylists,
      isFetchingPlaylists: librarySync.isFetchingPlaylists,
      dismissSession: dismissLibrarySession,
    }),
    [
      visibleLibrarySession,
      librarySync.nextScheduledRunAt,
      librarySync.hasActiveSync,
      librarySync.isError,
      librarySync.sync,
      librarySync.isSyncing,
      librarySync.fetchPlaylists,
      librarySync.isFetchingPlaylists,
      dismissLibrarySession,
    ]
  );

  const artist = useMemo<ArtistSyncState>(
    () => ({
      visibleSession: visibleArtistSession,
      hasActiveSync: artistSync.hasActiveSync,
      isError: artistSync.isError,
      artistsTotal: artistSync.artistsTotal,
      artistsSynced: artistSync.artistsSynced,
      enrichment: artistSync.enrichment,
      hasArtistsToSync: artistSync.hasArtistsToSync,
      start: artistSync.sync,
      isStarting: artistSync.isSyncing,
      resyncAll: artistSync.resyncAll,
      isResyncing: artistSync.isResyncing,
      refetchStatus: artistSync.refetch,
      dismissSession: dismissArtistSession,
    }),
    [
      visibleArtistSession,
      artistSync.hasActiveSync,
      artistSync.isError,
      artistSync.artistsTotal,
      artistSync.artistsSynced,
      artistSync.enrichment,
      artistSync.hasArtistsToSync,
      artistSync.sync,
      artistSync.isSyncing,
      artistSync.resyncAll,
      artistSync.isResyncing,
      artistSync.refetch,
      dismissArtistSession,
    ]
  );

  const push = useMemo<PushState>(
    () => ({
      activePushes: manualActivePushes,
      finishedPushes: visibleFinishedPushes,
      hasActivePush: pushStatus.hasActivePush,
      isError: pushStatus.isError,
      activePushFor: pushStatus.activePushFor,
      isPushing: pushStatus.isPushing,
      start: pushStatus.push,
      dismissFinished: dismissFinishedPush,
    }),
    [
      manualActivePushes,
      visibleFinishedPushes,
      pushStatus.hasActivePush,
      pushStatus.isError,
      pushStatus.activePushFor,
      pushStatus.isPushing,
      pushStatus.push,
      dismissFinishedPush,
    ]
  );

  const value = useMemo<SyncStatusContextType>(
    () => ({ library, artist, push, message, show }),
    [library, artist, push, message, show]
  );

  return (
    <SyncStatusContext.Provider value={value}>
      {children}
    </SyncStatusContext.Provider>
  );
}

export function useSyncStatus() {
  const context = useContext(SyncStatusContext);
  if (!context) {
    throw new Error("useSyncStatus must be used within a SyncStatusProvider");
  }
  return context;
}
