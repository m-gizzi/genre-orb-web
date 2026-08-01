import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SortControlProps<S extends string> {
  sort: S;
  order: "asc" | "desc";
  options: Record<S, string>;
  onSortChange: (sort: S) => void;
  onOrderChange: (order: "asc" | "desc") => void;
}

export function SortControl<S extends string>({
  sort,
  order,
  options,
  onSortChange,
  onOrderChange,
}: SortControlProps<S>) {
  const keys = Object.keys(options) as S[];
  const toggle = () => onOrderChange(order === "desc" ? "asc" : "desc");

  return (
    <div className="flex items-center gap-1">
      {keys.length > 1 && (
        <Select
          items={options}
          value={sort}
          onValueChange={(value) => onSortChange((value as S | null) ?? sort)}
        >
          <SelectTrigger className="w-[9rem]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {keys.map((key) => (
              <SelectItem key={key} value={key}>
                {options[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <Button
        variant="outline"
        size="icon"
        aria-label={`Sort ${order === "desc" ? "descending" : "ascending"}`}
        onClick={toggle}
      >
        {order === "desc" ? <ArrowDownIcon /> : <ArrowUpIcon />}
      </Button>
    </div>
  );
}
