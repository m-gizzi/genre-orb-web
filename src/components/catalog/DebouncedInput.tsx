import { Input } from "@/components/ui/input";
import { useDebouncedCommit } from "@/hooks/useDebouncedCommit";

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
  const [local, setLocal] = useDebouncedCommit(value, onCommit, delay);

  return (
    <Input {...props} value={local} onChange={(e) => setLocal(e.target.value)} />
  );
}
