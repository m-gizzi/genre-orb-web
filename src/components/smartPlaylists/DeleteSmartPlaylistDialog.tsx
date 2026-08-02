import { useNavigate } from "react-router-dom";
import { apiErrorMessage, type SmartPlaylist } from "@/api/client";
import { useDeleteSmartPlaylist } from "@/hooks/useSmartPlaylists";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface DeleteSmartPlaylistDialogProps {
  smartPlaylist: SmartPlaylist;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteSmartPlaylistDialog({
  smartPlaylist,
  open,
  onOpenChange,
}: DeleteSmartPlaylistDialogProps) {
  const navigate = useNavigate();
  const remove = useDeleteSmartPlaylist();

  function submit() {
    remove.mutate(smartPlaylist.id, {
      onSuccess: () => {
        onOpenChange(false);
        navigate("/smart-playlists");
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete this smart playlist?</DialogTitle>
          <DialogDescription>
            The rules and source list are removed. “{smartPlaylist.name}” itself is kept,
            both in Genre Orb and on Spotify, and becomes a regular playlist again.
          </DialogDescription>
        </DialogHeader>

        {remove.isError && (
          <p className="text-sm text-destructive">{apiErrorMessage(remove.error)}</p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={remove.isPending}
          >
            Cancel
          </Button>
          <Button variant="destructive" onClick={submit} disabled={remove.isPending}>
            {remove.isPending ? "Deleting…" : "Delete rules"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
