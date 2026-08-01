import type { ReactNode } from "react";
import { Orb } from "@/components/orb/Orb";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  showOrb?: boolean;
}

export function EmptyState({
  title,
  description,
  action,
  showOrb = true,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      {showOrb && <Orb size={110} />}
      <div className="space-y-1">
        <p className="text-lg font-medium">{title}</p>
        {description && (
          <p className="max-w-md text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
