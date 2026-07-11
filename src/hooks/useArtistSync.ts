import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  artistsApi,
  extractApiError,
  type ArtistMetadataSession,
  type ArtistSyncStatus,
} from "@/api/client";
import { queryKeys } from "@/lib/queryKeys";
import { POLL_INTERVAL_MS, SYNC_START_TIMEOUT_MS } from "@/lib/config";
import { useTemporaryFlag } from "@/hooks/useTemporaryFlag";
import type { TransientMessage } from "@/hooks/useTransientMessage";

interface UseArtistSyncOptions {
  enabled: boolean;
  onMessage?: (message: TransientMessage) => void;
}

const EMPTY_STATUS: ArtistSyncStatus = {
  has_active_sync: false,
  current_session: null,
  rate_limited: false,
  rate_limit_resume_at: null,
  artists_total: 0,
  artists_synced: 0,
};

export function useArtistSync({ enabled, onMessage }: UseArtistSyncOptions) {
  const queryClient = useQueryClient();

  const [awaitingStart, startAwaiting, stopAwaiting] =
    useTemporaryFlag(SYNC_START_TIMEOUT_MS);

  const statusQuery = useQuery({
    queryKey: queryKeys.artistSyncStatus,
    queryFn: artistsApi.getSyncStatus,
    enabled,
    refetchInterval: (query) => {
      if (query.state.data?.has_active_sync) return POLL_INTERVAL_MS;
      if (awaitingStart) return POLL_INTERVAL_MS;
      return false;
    },
  });

  const hasActiveSync = statusQuery.data?.has_active_sync ?? false;

  useEffect(() => {
    if (awaitingStart && hasActiveSync) stopAwaiting();
  }, [awaitingStart, hasActiveSync, stopAwaiting]);

  const applyStartedSession = async (session: ArtistMetadataSession) => {
    await queryClient.cancelQueries({ queryKey: queryKeys.artistSyncStatus });
    queryClient.setQueryData<ArtistSyncStatus>(
      queryKeys.artistSyncStatus,
      (old) => ({
        ...(old ?? EMPTY_STATUS),
        has_active_sync: true,
        current_session: session,
      })
    );
    startAwaiting();
  };

  const reportError = async (error: unknown) => {
    onMessage?.({ type: "error", text: await extractApiError(error) });
  };

  const syncMutation = useMutation({
    mutationFn: () => artistsApi.sync(),
    onSuccess: async ({ session }) => {
      await applyStartedSession(session);
      onMessage?.({ type: "success", text: "Artist metadata sync started!" });
    },
    onError: reportError,
  });

  const resyncAllMutation = useMutation({
    mutationFn: () => artistsApi.sync({ syncAll: true }),
    onSuccess: async ({ session }) => {
      await applyStartedSession(session);
      onMessage?.({ type: "success", text: "Resyncing all artist metadata..." });
    },
    onError: reportError,
  });

  const artistsTotal = statusQuery.data?.artists_total ?? 0;
  const artistsSynced = statusQuery.data?.artists_synced ?? 0;

  return {
    status: statusQuery.data,
    isLoading: statusQuery.isLoading,
    isError: statusQuery.isError,
    refetch: statusQuery.refetch,
    hasActiveSync,
    currentSession: statusQuery.data?.current_session ?? null,
    artistsTotal,
    artistsSynced,
    hasArtistsToSync: artistsTotal > artistsSynced,
    sync: syncMutation.mutate,
    isSyncing: syncMutation.isPending,
    resyncAll: resyncAllMutation.mutate,
    isResyncing: resyncAllMutation.isPending,
  };
}
