import type { PaginationMeta } from "@/api/client";

export function pageStartIndex(meta: PaginationMeta | undefined): number {
  return meta ? (meta.page - 1) * meta.per_page : 0;
}
