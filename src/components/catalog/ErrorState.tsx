import { AlertCircleIcon, RefreshCwIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

function messageFor(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong. Please try again.";
}

export function ErrorState({
  error,
  title = "Couldn't load this",
  description,
  onRetry,
}: {
  error?: unknown;
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 py-12 text-center">
      <AlertCircleIcon className="size-6 text-destructive" />
      <p className="font-medium">{title}</p>
      <p className="max-w-md text-sm text-muted-foreground">
        {description ?? messageFor(error)}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
          <RefreshCwIcon /> Try again
        </Button>
      )}
    </div>
  );
}
