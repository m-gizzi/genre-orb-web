import { cn } from "@/lib/utils";

interface ProgressBarProps {
  percent: number;
  className?: string;
  barClassName?: string;
}

export function ProgressBar({ percent, className, barClassName }: ProgressBarProps) {
  const clamped = Number.isFinite(percent)
    ? Math.max(0, Math.min(100, percent))
    : 0;

  return (
    <div className={cn("h-2 overflow-hidden rounded-full bg-muted", className)}>
      <div
        className={cn("h-full bg-primary transition-all duration-500", barClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
