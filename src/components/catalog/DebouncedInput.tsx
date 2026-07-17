import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";

export function DebouncedInput({
  value,
  onCommit,
  delay = 350,
  ...props
}: {
  value: string;
  onCommit: (value: string) => void;
  delay?: number;
} & Omit<React.ComponentProps<typeof Input>, "value" | "onChange">) {
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

  return <Input {...props} value={local} onChange={(e) => setLocal(e.target.value)} />;
}
