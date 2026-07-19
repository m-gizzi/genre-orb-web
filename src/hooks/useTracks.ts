import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { tracksApi, type TrackFilters } from "@/api/client";
import { queryKeys } from "@/lib/queryKeys";

export function useTracks(filters: TrackFilters = {}) {
  return useQuery({
    queryKey: queryKeys.tracks(filters),
    queryFn: () => tracksApi.list(filters),
    placeholderData: keepPreviousData,
  });
}

export function useTrack(id: number) {
  return useQuery({
    queryKey: queryKeys.track(id),
    queryFn: () => tracksApi.get(id),
    enabled: Number.isFinite(id),
  });
}
