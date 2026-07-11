import { cn } from "@/lib/utils";

interface ProgressBarProps {
  percent: number;
  className?: string;
  barClassName?: string;
  label?: string;
}

export function ProgressBar({ percent, className, barClassName, label }: ProgressBarProps) {
  const clamped = Number.isFinite(percent)
    ? Math.max(0, Math.min(100, percent))
    : 0;
  const rounded = Math.round(clamped);

  return (
    <div
      role="progressbar"
      aria-valuenow={rounded}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? "Progress"}
      className={cn("h-2 overflow-hidden rounded-full bg-muted", className)}
    >
      <div
        className={cn("h-full bg-primary transition-all duration-500", barClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
