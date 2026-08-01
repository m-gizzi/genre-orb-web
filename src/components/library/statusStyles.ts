import type { SyncSessionStatus } from "@/api/client";

export const syncStatusColor: Record<SyncSessionStatus, string> = {
  pending: "bg-muted border-border text-muted-foreground",
  running: "bg-primary/10 border-primary/30 text-primary",
  completed:
    "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400",
  completed_with_errors:
    "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400",
  failed: "bg-destructive/10 border-destructive/30 text-destructive",
};

export function isSyncActive(status: SyncSessionStatus): boolean {
  return status === "pending" || status === "running";
}

export function shouldAutoDismiss(status: SyncSessionStatus): boolean {
  return status === "completed";
}
