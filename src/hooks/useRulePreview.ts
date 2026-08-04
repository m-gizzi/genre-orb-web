import { useMemo } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  smartPlaylistsApi,
  type RuleGroup,
  type RulePreviewMeta,
  type Track,
} from "@/api/client";
import { canonicalRules } from "@/lib/ruleTree";
import { queryKeys } from "@/lib/queryKeys";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

const DEBOUNCE_MS = 400;
export const PREVIEW_PER_PAGE = 25;

export interface RulePreviewOptions {
  /** Omit to preview the saved rules. */
  rules?: RuleGroup;
  page?: number;
  perPage?: number;
  enabled?: boolean;
}

export interface RulePreviewResult {
  tracks: Track[];
  meta: RulePreviewMeta | undefined;
  isPending: boolean;
  isError: boolean;
  error: unknown;
}

export function useRulePreview(
  id: number,
  { rules, page = 1, perPage = PREVIEW_PER_PAGE, enabled = true }: RulePreviewOptions = {}
): RulePreviewResult {
  const canonical = useMemo(() => (rules ? canonicalRules(rules) : ""), [rules]);
  const debounced = useDebouncedValue(canonical, DEBOUNCE_MS);
  const settled = debounced === canonical;

  const query = useQuery({
    queryKey: queryKeys.rulePreview(id, debounced, page),
    queryFn: () => smartPlaylistsApi.preview(id, { rules, page, per_page: perPage }),
    enabled: enabled && Number.isFinite(id) && settled,
    placeholderData: keepPreviousData,
  });

  return {
    tracks: query.data?.data ?? [],
    meta: query.data?.meta,
    isPending: enabled && (!settled || query.isFetching),
    isError: query.isError,
    error: query.error,
  };
}
