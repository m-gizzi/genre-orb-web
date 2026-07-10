import type { SyncSessionStatus } from "@/api/client";

export const syncStatusColor: Record<SyncSessionStatus, string> = {
  pending: "bg-yellow-100 border-yellow-300 text-yellow-800",
  running: "bg-blue-100 border-blue-300 text-blue-800",
  completed: "bg-green-100 border-green-300 text-green-800",
  failed: "bg-red-100 border-red-300 text-red-800",
};

export function isSyncActive(status: SyncSessionStatus): boolean {
  return status === "pending" || status === "running";
}
