import { useCallback, useEffect, useState } from "react";
import type { SyncSessionStatus } from "@/api/client";
import { isSyncActive, shouldAutoDismiss } from "@/components/library/statusStyles";

type DismissableSession = {
  id: number;
  status: SyncSessionStatus;
  completed_at: string | null;
};

export function useAutoDismissSession<T extends DismissableSession>(
  session: T | null,
  timeoutMs: number
): readonly [T | null, () => void] {
  const [dismissedId, setDismissedId] = useState<number | null>(null);

  const active = session ? isSyncActive(session.status) : false;
  const autoDismiss = session ? shouldAutoDismiss(session.status) : false;

  useEffect(() => {
    if (!session || active || !autoDismiss) return;
    if (dismissedId === session.id) return;

    const deadline = session.completed_at
      ? Date.parse(session.completed_at)
      : Date.now();
    const remaining = deadline + timeoutMs - Date.now();
    if (remaining <= 0) {
      setDismissedId(session.id);
      return;
    }
    const timer = setTimeout(() => setDismissedId(session.id), remaining);
    return () => clearTimeout(timer);
  }, [session, active, autoDismiss, dismissedId, timeoutMs]);

  const dismiss = useCallback(() => {
    if (session) setDismissedId(session.id);
  }, [session]);

  const visible = session && dismissedId !== session.id ? session : null;
  return [visible, dismiss];
}
