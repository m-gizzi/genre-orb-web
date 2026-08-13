import { useMutation } from "@tanstack/react-query";
import {
  artistsApi,
  apiErrorMessage,
  EMPTY_ENRICHMENT_COVERAGE,
  type ArtistMetadataSession,
  type ArtistSyncStatus,
} from "@/api/client";
import { queryKeys } from "@/lib/queryKeys";
import { invalidateLibraryQueries } from "@/lib/invalidate";
import { usePolledSession } from "@/hooks/usePolledSession";
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
  needs_reauth: false,
  enrichment: EMPTY_ENRICHMENT_COVERAGE,
};

export function useArtistSync({ enabled, onMessage }: UseArtistSyncOptions) {
  const {
    query: statusQuery,
    active: hasActiveSync,
    startAwaiting,
    queryClient,
  } = usePolledSession({
    queryKey: queryKeys.artistSyncStatus,
    queryFn: artistsApi.getSyncStatus,
    enabled,
    isActive: (status) => status.has_active_sync,
    onFinished: invalidateLibraryQueries,
  });

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

  const reportError = (error: unknown) => {
    onMessage?.({ type: "error", text: apiErrorMessage(error) });
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
  const enrichment = statusQuery.data?.enrichment ?? EMPTY_ENRICHMENT_COVERAGE;

  return {
    status: statusQuery.data,
    isLoading: statusQuery.isLoading,
    isError: statusQuery.isError,
    refetch: statusQuery.refetch,
    hasActiveSync,
    currentSession: statusQuery.data?.current_session ?? null,
    artistsTotal,
    artistsSynced,
    enrichment,
    hasArtistsToSync: artistsTotal > artistsSynced,
    sync: syncMutation.mutate,
    isSyncing: syncMutation.isPending,
    resyncAll: resyncAllMutation.mutate,
    isResyncing: resyncAllMutation.isPending,
  };
}
