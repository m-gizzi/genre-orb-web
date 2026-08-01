import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

interface StatTileProps {
  label: string;
  value: number | null | undefined;
  icon?: ReactNode;
  to?: string;
  isLoading?: boolean;
}

export function StatTile({ label, value, icon, to, isLoading }: StatTileProps) {
  const inner = (
    <Card
      className={cn(
        "gap-1 p-4 transition-colors",
        to && "hover:ring-primary/40"
      )}
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="font-heading text-3xl font-semibold tabular-nums">
        {isLoading ? "—" : formatNumber(value)}
      </div>
    </Card>
  );

  return to ? (
    <Link to={to} className="block">
      {inner}
    </Link>
  ) : (
    inner
  );
}
