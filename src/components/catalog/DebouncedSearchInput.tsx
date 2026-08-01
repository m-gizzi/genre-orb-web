import { useDebouncedCommit } from "@/hooks/useDebouncedCommit";
import { SearchInput } from "./SearchInput";

export function DebouncedSearchInput({
  value,
  onCommit,
  placeholder,
  className,
  delay = 350,
}: {
  value: string;
  onCommit: (value: string) => void;
  placeholder?: string;
  className?: string;
  delay?: number;
}) {
  const [local, setLocal] = useDebouncedCommit(value, onCommit, delay);

  return (
    <SearchInput
      value={local}
      onChange={setLocal}
      placeholder={placeholder}
      className={className}
    />
  );
}
