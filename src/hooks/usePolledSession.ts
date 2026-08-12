import { useEffect, useRef } from "react";
import {
  useQuery,
  useQueryClient,
  type QueryKey,
  type QueryClient,
} from "@tanstack/react-query";
import { POLL_INTERVAL_MS, SYNC_START_TIMEOUT_MS } from "@/lib/config";
import { useTemporaryFlag } from "@/hooks/useTemporaryFlag";

interface UsePolledSessionOptions<T> {
  queryKey: QueryKey;
  queryFn: () => Promise<T>;
  enabled: boolean;
  isActive: (data: T) => boolean;
  onFinished?: (queryClient: QueryClient) => void;
  alsoPollWhile?: boolean;
}

export function usePolledSession<T>({
  queryKey,
  queryFn,
  enabled,
  isActive,
  onFinished,
  alsoPollWhile = false,
}: UsePolledSessionOptions<T>) {
  const queryClient = useQueryClient();

  const [awaitingStart, startAwaiting, stopAwaiting] =
    useTemporaryFlag(SYNC_START_TIMEOUT_MS);

  const query = useQuery({
    queryKey,
    queryFn,
    enabled,
    refetchInterval: (q) => {
      if (q.state.data !== undefined && isActive(q.state.data)) {
        return POLL_INTERVAL_MS;
      }
      if (awaitingStart || alsoPollWhile) return POLL_INTERVAL_MS;
      return false;
    },
  });

  const active = query.data !== undefined && isActive(query.data);

  useEffect(() => {
    if (awaitingStart && active) stopAwaiting();
  }, [awaitingStart, active, stopAwaiting]);

  const wasActiveRef = useRef(false);
  const onFinishedRef = useRef(onFinished);
  onFinishedRef.current = onFinished;

  useEffect(() => {
    if (wasActiveRef.current && !active) {
      onFinishedRef.current?.(queryClient);
    }
    wasActiveRef.current = active;
  }, [active, queryClient]);

  return { query, active, startAwaiting, queryClient };
}
