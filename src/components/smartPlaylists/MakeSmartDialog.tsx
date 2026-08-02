import { useState } from "react";
import { AlertTriangleIcon } from "lucide-react";
import { apiErrorMessage, type Playlist } from "@/api/client";
import { useCreateSmartPlaylist } from "@/hooks/useSmartPlaylists";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { SourcePlaylistPicker } from "./SourcePlaylistPicker";

interface MakeSmartDialogProps {
  playlist: Playlist;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MakeSmartDialog({
  playlist,
  open,
  onOpenChange,
}: MakeSmartDialogProps) {
  const [sourceIds, setSourceIds] = useState<number[]>([]);
  const create = useCreateSmartPlaylist();

  function submit() {
    create.mutate(
      { target_playlist_id: playlist.id, source_playlist_ids: sourceIds },
      {
        onSuccess: () => {
          onOpenChange(false);
          setSourceIds([]);
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Make “{playlist.name}” a smart playlist</DialogTitle>
          <DialogDescription>
            Pick the playlists whose tracks the rules will filter.
          </DialogDescription>
        </DialogHeader>

        <div
          className="flex gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm"
          role="note"
        >
          <AlertTriangleIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
          <div className="space-y-1">
            <p>
              This playlist becomes rule-managed. Once rules are evaluated and pushed,
              its contents on Spotify are replaced by the rule results.
            </p>
            <p className="text-muted-foreground">
              Syncing will be turned on and locked so Genre Orb can see what Spotify holds.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Source playlists</Label>
          <SourcePlaylistPicker
            selectedIds={sourceIds}
            onChange={setSourceIds}
            excludePlaylistId={playlist.id}
          />
        </div>

        {create.isError && (
          <p className="text-sm text-destructive">{apiErrorMessage(create.error)}</p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={create.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={create.isPending || sourceIds.length === 0}
          >
            {create.isPending ? "Creating…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
