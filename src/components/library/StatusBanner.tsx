import type { ReactNode } from "react";
import { XIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusBannerProps {
  colorClass: string;
  active: boolean;
  label: string;
  headerRight?: ReactNode;
  onDismiss?: () => void;
  children?: ReactNode;
}

export function StatusBanner({
  colorClass,
  active,
  label,
  headerRight,
  onDismiss,
  children,
}: StatusBannerProps) {
  return (
    <div className={cn("rounded-lg border p-4", colorClass)}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {active && (
            <div className="h-3 w-3 animate-pulse rounded-full bg-current" />
          )}
          <span className="font-medium" aria-live="polite">
            {label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {headerRight != null && <span className="text-sm">{headerRight}</span>}
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss notice"
              className="rounded-full p-0.5 opacity-70 transition-opacity hover:opacity-100"
            >
              <XIcon className="size-4" />
            </button>
          )}
        </div>
      </div>
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
