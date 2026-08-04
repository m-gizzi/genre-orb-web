import { useEffect, useMemo } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  smartPlaylistsApi,
  type RuleGroup,
  type RuleMatchesMeta,
  type SmartPlaylistDetail,
  type Track,
} from "@/api/client";
import { canonicalRules } from "@/lib/ruleTree";
import { queryKeys } from "@/lib/queryKeys";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const DEBOUNCE_MS = 400;
export const MATCHES_PER_PAGE = 25;

export interface RuleMatchesOptions {
  rules?: RuleGroup;
  page?: number;
  perPage?: number;
  enabled?: boolean;
}

export interface RuleMatchesResult {
  tracks: Track[];
  meta: RuleMatchesMeta | undefined;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => void;
}

export function useRuleMatches(
  id: number,
  { rules, page = 1, perPage = MATCHES_PER_PAGE, enabled = true }: RuleMatchesOptions = {}
): RuleMatchesResult {
  const canonical = useMemo(() => (rules ? canonicalRules(rules) : ""), [rules]);
  const debounced = useDebouncedValue(canonical, DEBOUNCE_MS);
  const settled = debounced === canonical;

  const query = useQuery({
    queryKey: queryKeys.ruleMatches(id, debounced, page, perPage),
    queryFn: () => smartPlaylistsApi.evaluate(id, { rules, page, per_page: perPage }),
    enabled: enabled && Number.isFinite(id) && settled,
    placeholderData: keepPreviousData,
  });

  useRecordedEvaluation(id, query.data?.meta);

  return {
    tracks: query.data?.data ?? [],
    meta: query.data?.meta,
    isPending: enabled && (!settled || query.isFetching),
    isError: query.isError,
    error: query.error,
    refetch: () => void query.refetch(),
  };
}

function useRecordedEvaluation(id: number, meta: RuleMatchesMeta | undefined) {
  const queryClient = useQueryClient();
  const evaluatedAt = meta?.evaluated_at;
  const matchCount = meta?.total;

  useEffect(() => {
    if (!evaluatedAt || matchCount === undefined) return;

    queryClient.setQueryData<SmartPlaylistDetail>(queryKeys.smartPlaylist(id), (current) => {
      if (!current) return current;
      if (current.last_evaluated_at === evaluatedAt && current.match_count === matchCount) {
        return current;
      }
      return { ...current, last_evaluated_at: evaluatedAt, match_count: matchCount };
    });
  }, [queryClient, id, evaluatedAt, matchCount]);
}
