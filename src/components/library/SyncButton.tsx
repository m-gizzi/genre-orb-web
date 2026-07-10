import { useMutation, useQueryClient } from "@tanstack/react-query";
import { libraryApi } from "@/api/client";
import { Button } from "@/components/ui/button";

interface SyncButtonProps {
  disabled?: boolean;
  hasActiveSyncOrNoPlaylists?: boolean;
}

export function SyncButton({
  disabled,
  hasActiveSyncOrNoPlaylists,
}: SyncButtonProps) {
  const queryClient = useQueryClient();

  const syncMutation = useMutation({
    mutationFn: libraryApi.sync,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["libraryStatus"] });
    },
  });

  return (
    <Button
      onClick={() => syncMutation.mutate()}
      disabled={disabled || hasActiveSyncOrNoPlaylists || syncMutation.isPending}
    >
      {syncMutation.isPending ? "Starting..." : "Sync Library"}
    </Button>
  );
}
