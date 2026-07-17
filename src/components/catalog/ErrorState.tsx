import { AlertCircleIcon } from "lucide-react";

function messageFor(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Something went wrong. Please try again.";
}

export function ErrorState({
  error,
  title = "Couldn't load this",
}: {
  error: unknown;
  title?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 py-12 text-center">
      <AlertCircleIcon className="size-6 text-destructive" />
      <p className="font-medium">{title}</p>
      <p className="max-w-md text-sm text-muted-foreground">{messageFor(error)}</p>
    </div>
  );
}
