import { useEffect, useState } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
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
  const [local, setLocal] = useState(value);
  const debounced = useDebouncedValue(local, delay);

  useEffect(() => setLocal(value), [value]);
  useEffect(() => {
    if (debounced !== value) onCommit(debounced);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced]);

  return (
    <SearchInput
      value={local}
      onChange={setLocal}
      placeholder={placeholder}
      className={className}
    />
  );
}
