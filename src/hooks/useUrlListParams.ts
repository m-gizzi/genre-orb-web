import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";

interface Paged {
  page?: number;
}

export function useUrlListParams<T extends Paged>(
  parse: (params: URLSearchParams) => T,
  serialize: (filters: T) => Record<string, string>
) {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parse(searchParams);

  const applyPatch = useCallback(
    (patch: Partial<T>) => {
      const next = { ...parse(searchParams), ...patch };
      if (!("page" in patch)) next.page = 1;
      setSearchParams(serialize(next), { replace: true });
    },
    [parse, serialize, searchParams, setSearchParams]
  );

  const clear = useCallback(
    () => setSearchParams({}, { replace: true }),
    [setSearchParams]
  );

  return { filters, applyPatch, clear };
}
