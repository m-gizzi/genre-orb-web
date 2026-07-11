import { useCallback, useEffect, useState } from "react";

export function useTemporaryFlag(
  timeoutMs: number
): readonly [boolean, () => void, () => void] {
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!active) return;
    const timer = setTimeout(() => setActive(false), timeoutMs);
    return () => clearTimeout(timer);
  }, [active, timeoutMs]);

  const start = useCallback(() => setActive(true), []);
  const stop = useCallback(() => setActive(false), []);

  return [active, start, stop];
}
