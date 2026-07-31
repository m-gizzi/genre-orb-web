import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ErrorState } from "./ErrorState";

interface QueryLike {
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  isPlaceholderData?: boolean;
  refetch: () => unknown;
}

interface QueryStateProps {
  query: QueryLike;
  skeleton: ReactNode;
  isEmpty?: boolean;
  empty?: ReactNode;
  errorTitle?: string;
  children: ReactNode;
}

export function QueryState({
  query,
  skeleton,
  isEmpty = false,
  empty = null,
  errorTitle,
  children,
}: QueryStateProps) {
  if (query.isLoading) return <>{skeleton}</>;
  if (query.isError) {
    return (
      <ErrorState
        error={query.error}
        title={errorTitle}
        onRetry={() => query.refetch()}
      />
    );
  }
  if (isEmpty) return <>{empty}</>;

  return (
    <div
      className={cn(
        query.isPlaceholderData && "opacity-60 transition-opacity"
      )}
    >
      {children}
    </div>
  );
}
