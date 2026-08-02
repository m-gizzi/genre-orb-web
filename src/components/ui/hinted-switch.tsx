import { useId } from "react";
import { Switch as SwitchPrimitive } from "@base-ui/react/switch";

import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";

interface HintedSwitchProps extends SwitchPrimitive.Root.Props {
  hint?: string;
}

export function HintedSwitch({
  hint,
  className,
  onCheckedChange,
  ...props
}: HintedSwitchProps) {
  const hintId = useId();
  const blocked = hint != null;

  const control = (
    <Switch
      {...props}
      className={cn(blocked && "cursor-not-allowed opacity-50", className)}
      aria-disabled={blocked || undefined}
      aria-describedby={blocked ? hintId : undefined}
      onCheckedChange={blocked ? undefined : onCheckedChange}
    />
  );

  if (!blocked) return control;

  return (
    <span className="inline-flex items-center" title={hint}>
      {control}
      <span id={hintId} className="sr-only">
        {hint}
      </span>
    </span>
  );
}
