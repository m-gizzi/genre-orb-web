import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { ArtistMetadataSession, SyncSession } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLibrarySync } from "@/hooks/useLibrarySync";
import { useArtistSync } from "@/hooks/useArtistSync";
import { useAutoDismissSession } from "@/hooks/useAutoDismissSession";
import {
  useTransientMessage,
  type TransientMessage,
} from "@/hooks/useTransientMessage";
import { SYNC_NOTICE_TIMEOUT_MS } from "@/lib/config";

interface LibrarySyncState {
  visibleSession: SyncSession | null;
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
  hasArtistsToSync: boolean;
  start: () => void;
  isStarting: boolean;
  resyncAll: () => void;
  isResyncing: boolean;
  refetchStatus: () => void;
  dismissSession: () => void;
}

interface SyncStatusContextType {
  library: LibrarySyncState;
  artist: ArtistSyncState;
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

  const [visibleLibrarySession, dismissLibrarySession] = useAutoDismissSession(
    librarySync.currentSession,
    SYNC_NOTICE_TIMEOUT_MS
  );
  const [visibleArtistSession, dismissArtistSession] = useAutoDismissSession(
    artistSync.currentSession,
    SYNC_NOTICE_TIMEOUT_MS
  );

  const library = useMemo<LibrarySyncState>(
    () => ({
      visibleSession: visibleLibrarySession,
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
      artistSync.hasArtistsToSync,
      artistSync.sync,
      artistSync.isSyncing,
      artistSync.resyncAll,
      artistSync.isResyncing,
      artistSync.refetch,
      dismissArtistSession,
    ]
  );

  const value = useMemo<SyncStatusContextType>(
    () => ({ library, artist, message, show }),
    [library, artist, message, show]
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
