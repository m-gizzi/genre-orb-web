import { useCallback, useState } from "react";
import { DEFAULT_PER_PAGE } from "@/lib/config";

export function usePagination(defaultPerPage = DEFAULT_PER_PAGE) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPageState] = useState(defaultPerPage);

  const setPerPage = useCallback((next: number) => {
    setPerPageState(next);
    setPage(1);
  }, []);

  return { page, perPage, setPage, setPerPage };
}
