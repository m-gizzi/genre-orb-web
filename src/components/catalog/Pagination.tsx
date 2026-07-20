import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import type { PaginationMeta } from "@/api/client";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PER_PAGE_OPTIONS } from "@/lib/config";
import { formatNumber } from "@/lib/format";

interface PaginationProps {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  label?: string;
  onPerPageChange?: (perPage: number) => void;
  perPageOptions?: number[];
}

export function Pagination({
  meta,
  onPageChange,
  label = "items",
  onPerPageChange,
  perPageOptions = PER_PAGE_OPTIONS,
}: PaginationProps) {
  const { page, per_page, total_pages, total } = meta;
  if (total === 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 text-sm text-muted-foreground">
      <div className="flex items-center gap-3">
        <span>
          {formatNumber(total)} {label}
        </span>
        {onPerPageChange && (
          <div className="flex items-center gap-1.5">
            <span>Per page</span>
            <Select
              value={String(per_page)}
              onValueChange={(value) => {
                if (value != null) onPerPageChange(Number(value));
              }}
            >
              <SelectTrigger size="sm" className="w-[4.5rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {perPageOptions.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <span>
          Page {page} of {total_pages}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeftIcon />
        </Button>
        <Button
          variant="outline"
          size="icon-sm"
          disabled={page >= total_pages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRightIcon />
        </Button>
      </div>
    </div>
  );
}
