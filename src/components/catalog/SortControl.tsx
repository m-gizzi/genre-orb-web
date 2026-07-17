import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface SortControlProps {
  sort: string;
  order: "asc" | "desc";
  options: Record<string, string>;
  onSortChange: (sort: string) => void;
  onOrderChange: (order: "asc" | "desc") => void;
}

export function SortControl({
  sort,
  order,
  options,
  onSortChange,
  onOrderChange,
}: SortControlProps) {
  const keys = Object.keys(options);
  const toggle = () => onOrderChange(order === "desc" ? "asc" : "desc");

  return (
    <div className="flex items-center gap-1">
      {keys.length > 1 && (
        <Select
          items={options}
          value={sort}
          onValueChange={(value) => onSortChange(value ?? sort)}
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
