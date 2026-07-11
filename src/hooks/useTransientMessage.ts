import { useCallback, useEffect, useState } from "react";
import { MESSAGE_TIMEOUT_MS } from "@/lib/config";

export interface TransientMessage {
  type: "success" | "error";
  text: string;
}

export function useTransientMessage(timeoutMs: number = MESSAGE_TIMEOUT_MS) {
  const [message, setMessage] = useState<TransientMessage | null>(null);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), timeoutMs);
    return () => clearTimeout(timer);
  }, [message, timeoutMs]);

  const show = useCallback(
    (next: TransientMessage) => setMessage(next),
    []
  );
  const showSuccess = useCallback(
    (text: string) => setMessage({ type: "success", text }),
    []
  );
  const showError = useCallback(
    (text: string) => setMessage({ type: "error", text }),
    []
  );
  const clear = useCallback(() => setMessage(null), []);

  return { message, show, showSuccess, showError, clear };
}
