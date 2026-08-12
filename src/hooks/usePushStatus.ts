import { useMutation, useMutationState } from "@tanstack/react-query";
import {
  smartPlaylistsApi,
  apiErrorMessage,
  type PushSession,
  type PushStatus,
} from "@/api/client";
import { queryKeys } from "@/lib/queryKeys";
import { invalidateSmartPlaylists } from "@/hooks/useSmartPlaylists";
import { usePolledSession } from "@/hooks/usePolledSession";
import type { TransientMessage } from "@/hooks/useTransientMessage";

interface UsePushStatusOptions {
  enabled: boolean;
  onMessage?: (message: TransientMessage) => void;
}

const EMPTY_STATUS: PushStatus = {
  active_pushes: [],
  recent_pushes: [],
  rate_limited: false,
  rate_limit_resume_at: null,
};

export function usePushStatus({ enabled, onMessage }: UsePushStatusOptions) {
  const {
    query: statusQuery,
    active: hasActivePush,
    startAwaiting,
    queryClient,
  } = usePolledSession({
    queryKey: queryKeys.pushStatus,
    queryFn: smartPlaylistsApi.pushStatus,
    enabled,
    isActive: (status) => status.active_pushes.length > 0,
    onFinished: invalidateSmartPlaylists,
  });

  const activePushes = statusQuery.data?.active_pushes ?? [];

  const pushMutation = useMutation({
    mutationKey: queryKeys.pushMutation,
    mutationFn: (id: number) => smartPlaylistsApi.push(id),
    onSuccess: async ({ session }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.pushStatus });
      queryClient.setQueryData<PushStatus>(queryKeys.pushStatus, (old) => {
        const previous = old ?? EMPTY_STATUS;
        return {
          ...previous,
          active_pushes: [
            session,
            ...previous.active_pushes.filter(
              (push) => push.smart_playlist_id !== session.smart_playlist_id
            ),
          ],
        };
      });
      startAwaiting();
      onMessage?.({
        type: "success",
        text: `Pushing ${session.smart_playlist_name} to Spotify…`,
      });
    },
    onError: (error) => {
      onMessage?.({ type: "error", text: apiErrorMessage(error) });
    },
  });

  const pendingIds = useMutationState({
    filters: { mutationKey: queryKeys.pushMutation, status: "pending" },
    select: (mutation) => mutation.state.variables as number,
  });

  return {
    status: statusQuery.data,
    isLoading: statusQuery.isLoading,
    isError: statusQuery.isError,
    refetch: statusQuery.refetch,
    activePushes,
    recentPushes: statusQuery.data?.recent_pushes ?? [],
    hasActivePush,
    activePushFor: (id: number): PushSession | undefined =>
      activePushes.find((push) => push.smart_playlist_id === id),
    isPushing: (id: number) =>
      pendingIds.includes(id) ||
      activePushes.some((push) => push.smart_playlist_id === id),
    push: pushMutation.mutate,
  };
}
