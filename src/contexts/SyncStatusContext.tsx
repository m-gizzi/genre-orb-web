import {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
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

interface SyncStatusContextType {
  visibleLibrarySession: SyncSession | null;
  hasActiveLibrarySync: boolean;
  librarySyncError: boolean;
  startLibrarySync: () => void;
  isStartingLibrarySync: boolean;
  fetchPlaylists: () => void;
  isFetchingPlaylists: boolean;
  dismissLibrarySession: () => void;
  visibleArtistSession: ArtistMetadataSession | null;
  hasActiveArtistSync: boolean;
  artistSyncError: boolean;
  artistsTotal: number;
  artistsSynced: number;
  hasArtistsToSync: boolean;
  startArtistSync: () => void;
  isStartingArtistSync: boolean;
  resyncAllArtists: () => void;
  isResyncingArtists: boolean;
  refetchArtistStatus: () => void;
  dismissArtistSession: () => void;
  message: TransientMessage | null;
  show: (message: TransientMessage) => void;
}

const SyncStatusContext = createContext<SyncStatusContextType | null>(null);

export function SyncStatusProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const enabled = !!user?.spotify_connected;

  const { message, show } = useTransientMessage();

  const library = useLibrarySync({ enabled, onMessage: show });
  const artist = useArtistSync({ enabled, onMessage: show });

  const [visibleLibrarySession, dismissLibrarySession] = useAutoDismissSession(
    library.currentSession,
    SYNC_NOTICE_TIMEOUT_MS
  );
  const [visibleArtistSession, dismissArtistSession] = useAutoDismissSession(
    artist.currentSession,
    SYNC_NOTICE_TIMEOUT_MS
  );

  const value = useMemo<SyncStatusContextType>(
    () => ({
      visibleLibrarySession,
      hasActiveLibrarySync: library.hasActiveSync,
      librarySyncError: library.isError,
      startLibrarySync: library.sync,
      isStartingLibrarySync: library.isSyncing,
      fetchPlaylists: library.fetchPlaylists,
      isFetchingPlaylists: library.isFetchingPlaylists,
      dismissLibrarySession,
      visibleArtistSession,
      hasActiveArtistSync: artist.hasActiveSync,
      artistSyncError: artist.isError,
      artistsTotal: artist.artistsTotal,
      artistsSynced: artist.artistsSynced,
      hasArtistsToSync: artist.hasArtistsToSync,
      startArtistSync: artist.sync,
      isStartingArtistSync: artist.isSyncing,
      resyncAllArtists: artist.resyncAll,
      isResyncingArtists: artist.isResyncing,
      refetchArtistStatus: artist.refetch,
      dismissArtistSession,
      message,
      show,
    }),
    [
      visibleLibrarySession,
      library.hasActiveSync,
      library.isError,
      library.sync,
      library.isSyncing,
      library.fetchPlaylists,
      library.isFetchingPlaylists,
      dismissLibrarySession,
      visibleArtistSession,
      artist.hasActiveSync,
      artist.isError,
      artist.artistsTotal,
      artist.artistsSynced,
      artist.hasArtistsToSync,
      artist.sync,
      artist.isSyncing,
      artist.resyncAll,
      artist.isResyncing,
      artist.refetch,
      dismissArtistSession,
      message,
      show,
    ]
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
