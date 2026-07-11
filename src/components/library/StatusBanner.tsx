import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface StatusBannerProps {
  colorClass: string;
  active: boolean;
  label: string;
  headerRight?: ReactNode;
  children?: ReactNode;
}

export function StatusBanner({
  colorClass,
  active,
  label,
  headerRight,
  children,
}: StatusBannerProps) {
  return (
    <div className={cn("rounded-lg border p-4", colorClass)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {active && (
            <div className="h-3 w-3 animate-pulse rounded-full bg-current" />
          )}
          <span className="font-medium" aria-live="polite">
            {label}
          </span>
        </div>
        {headerRight != null && <span className="text-sm">{headerRight}</span>}
      </div>
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
