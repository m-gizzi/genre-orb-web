import { useCallback, useState } from "react";

export function useListFilters<T extends { page: number }>(initial: T) {
  const [filters, setFilters] = useState<T>(initial);

  const applyPatch = useCallback((patch: Partial<T>) => {
    setFilters((current) => ({
      ...current,
      ...patch,
      ...("page" in patch ? {} : { page: 1 }),
    }));
  }, []);

  return { filters, applyPatch };
}
