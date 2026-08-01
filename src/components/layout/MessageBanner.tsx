import type { TransientMessage } from "@/hooks/useTransientMessage";
import { cn } from "@/lib/utils";

export function MessageBanner({ message }: { message: TransientMessage | null }) {
  if (!message) return null;
  return (
    <div
      className={cn(
        "mb-4 rounded-md p-3 text-sm",
        message.type === "error"
          ? "bg-destructive/10 text-destructive"
          : "bg-primary/10 text-primary"
      )}
    >
      {message.text}
    </div>
  );
}
