import type { RuleUsage } from "@/api/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "all";

const LABELS: Record<string, string> = {
  [ALL]: "All genres",
  used: "Used in rules",
  unused: "Not used in rules",
};

/**
 * "Not used in rules" is the one that earns its place: it is the list of genres you can
 * block without breaking a smart playlist.
 */
export function RuleUsageFilter({
  value,
  onChange,
}: {
  value?: RuleUsage;
  onChange: (value: RuleUsage | undefined) => void;
}) {
  return (
    <Select
      items={LABELS}
      value={value ?? ALL}
      onValueChange={(next) =>
        onChange(next === ALL || next == null ? undefined : (next as RuleUsage))
      }
    >
      <SelectTrigger className="w-[12rem]" aria-label="Filter by rule usage">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.keys(LABELS).map((key) => (
          <SelectItem key={key} value={key}>
            {LABELS[key]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
