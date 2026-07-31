import { useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

export function useDebouncedCommit(
  value: string,
  onCommit: (next: string) => void,
  delay = 350
): readonly [string, (next: string) => void] {
  const [local, setLocal] = useState(value);
  const debounced = useDebouncedValue(local, delay);
  const settledRef = useRef(value);

  useEffect(() => {
    if (value === settledRef.current) return;
    settledRef.current = value;
    setLocal(value);
  }, [value]);

  useEffect(() => {
    if (debounced === settledRef.current) return;
    settledRef.current = debounced;
    onCommit(debounced);
  }, [debounced, onCommit]);

  return [local, setLocal];
}
