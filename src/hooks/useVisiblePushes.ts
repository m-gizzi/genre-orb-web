import { useCallback, useEffect, useState } from "react";
import type { PushSession } from "@/api/client";
import { isSyncActive, shouldAutoDismiss } from "@/components/library/statusStyles";

export function useVisiblePushes(
  recentPushes: PushSession[],
  activePushes: PushSession[],
  timeoutMs: number
): readonly [PushSession[], (id: number) => void] {
  const [watchedIds, setWatchedIds] = useState<ReadonlySet<number>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<ReadonlySet<number>>(new Set());

  useEffect(() => {
    setWatchedIds((previous) => {
      const unseen = activePushes.filter((push) => !previous.has(push.id));
      if (unseen.length === 0) return previous;
      const next = new Set(previous);
      unseen.forEach((push) => next.add(push.id));
      return next;
    });
  }, [activePushes]);

  const dismiss = useCallback((id: number) => {
    setDismissedIds((previous) => {
      if (previous.has(id)) return previous;
      return new Set(previous).add(id);
    });
  }, []);

  useEffect(() => {
    const timers = recentPushes
      .filter(
        (push) =>
          watchedIds.has(push.id) &&
          !dismissedIds.has(push.id) &&
          !isSyncActive(push.status) &&
          shouldAutoDismiss(push.status)
      )
      .map((push) => {
        const deadline = push.completed_at
          ? Date.parse(push.completed_at)
          : Date.now();
        const remaining = deadline + timeoutMs - Date.now();
        return setTimeout(() => dismiss(push.id), Math.max(remaining, 0));
      });

    return () => timers.forEach(clearTimeout);
  }, [recentPushes, watchedIds, dismissedIds, timeoutMs, dismiss]);

  const visible = recentPushes.filter(
    (push) => watchedIds.has(push.id) && !dismissedIds.has(push.id)
  );

  return [visible, dismiss];
}
