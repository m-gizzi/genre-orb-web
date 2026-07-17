import { useEffect, useRef, useState } from "react";
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
  const first = useRef(true);

  useEffect(() => setLocal(value), [value]);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    onCommit(debounced);
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
