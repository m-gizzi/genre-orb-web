import { useEffect, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  extractApiError,
  libraryApi,
  type LibraryStatus,
} from "@/api/client";
import { queryKeys } from "@/lib/queryKeys";
import {
  METADATA_FETCH_TIMEOUT_MS,
  POLL_INTERVAL_MS,
  SYNC_START_TIMEOUT_MS,
} from "@/lib/config";
import { useTemporaryFlag } from "@/hooks/useTemporaryFlag";
import type { TransientMessage } from "@/hooks/useTransientMessage";

interface UseLibrarySyncOptions {
  enabled: boolean;
  onMessage?: (message: TransientMessage) => void;
}

const EMPTY_STATUS: LibraryStatus = {
  has_active_sync: false,
  current_session: null,
  rate_limited: false,
  rate_limit_resume_at: null,
  playlists_metadata_fetched_at: null,
};

export function useLibrarySync({ enabled, onMessage }: UseLibrarySyncOptions) {
  const queryClient = useQueryClient();

  const [awaitingStart, startAwaiting, stopAwaiting] =
    useTemporaryFlag(SYNC_START_TIMEOUT_MS);
  const [fetchingMetadata, startFetchingMetadata, stopFetchingMetadata] =
    useTemporaryFlag(METADATA_FETCH_TIMEOUT_MS);
  const metadataBaselineRef = useRef<string | null>(null);

  const statusQuery = useQuery({
    queryKey: queryKeys.libraryStatus,
    queryFn: libraryApi.getStatus,
    enabled,
    refetchInterval: (query) => {
      if (query.state.data?.has_active_sync) return POLL_INTERVAL_MS;
      if (awaitingStart || fetchingMetadata) return POLL_INTERVAL_MS;
      return false;
    },
  });

  const hasActiveSync = statusQuery.data?.has_active_sync ?? false;
  const metadataFetchedAt = statusQuery.data?.playlists_metadata_fetched_at ?? null;

  useEffect(() => {
    if (awaitingStart && hasActiveSync) stopAwaiting();
  }, [awaitingStart, hasActiveSync, stopAwaiting]);

  const wasActiveRef = useRef(false);
  useEffect(() => {
    if (wasActiveRef.current && !hasActiveSync) {
      queryClient.invalidateQueries({ queryKey: queryKeys.playlists });
      queryClient.invalidateQueries({ queryKey: queryKeys.artistSyncStatus });
    }
    wasActiveRef.current = hasActiveSync;
  }, [hasActiveSync, queryClient]);

  useEffect(() => {
    if (!fetchingMetadata) return;
    if (metadataFetchedAt !== metadataBaselineRef.current) {
      stopFetchingMetadata();
      queryClient.invalidateQueries({ queryKey: queryKeys.playlists });
      onMessage?.({ type: "success", text: "Playlists loaded!" });
    }
  }, [
    fetchingMetadata,
    metadataFetchedAt,
    queryClient,
    stopFetchingMetadata,
    onMessage,
  ]);

  const syncMutation = useMutation({
    mutationFn: libraryApi.sync,
    onSuccess: ({ session }) => {
      queryClient.setQueryData<LibraryStatus>(queryKeys.libraryStatus, (old) => ({
        ...(old ?? EMPTY_STATUS),
        has_active_sync: true,
        current_session: session,
      }));
      startAwaiting();
      onMessage?.({ type: "success", text: "Sync started!" });
    },
    onError: async (error) => {
      onMessage?.({ type: "error", text: await extractApiError(error) });
    },
  });

  const fetchPlaylistsMutation = useMutation({
    mutationFn: libraryApi.fetchPlaylists,
    onSuccess: () => {
      metadataBaselineRef.current = metadataFetchedAt;
      startFetchingMetadata();
      onMessage?.({ type: "success", text: "Fetching playlists from Spotify..." });
    },
    onError: async (error) => {
      onMessage?.({ type: "error", text: await extractApiError(error) });
    },
  });

  return {
    status: statusQuery.data,
    isLoading: statusQuery.isLoading,
    isError: statusQuery.isError,
    refetch: statusQuery.refetch,
    hasActiveSync,
    currentSession: statusQuery.data?.current_session ?? null,
    sync: syncMutation.mutate,
    isSyncing: syncMutation.isPending,
    fetchPlaylists: fetchPlaylistsMutation.mutate,
    isFetchingPlaylists: fetchPlaylistsMutation.isPending || fetchingMetadata,
  };
}
