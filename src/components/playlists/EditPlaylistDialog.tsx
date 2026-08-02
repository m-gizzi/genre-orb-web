import { useEffect, useState } from "react";
import { apiErrorMessage, type Playlist } from "@/api/client";
import { useUpdatePlaylist } from "@/hooks/usePlaylistMutations";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlaylistFormFields, type PlaylistFormValues } from "./PlaylistFormFields";

interface EditPlaylistDialogProps {
  playlist: Playlist;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function valuesFrom(playlist: Playlist): PlaylistFormValues {
  return {
    name: playlist.name,
    description: playlist.description ?? "",
  };
}

export function EditPlaylistDialog({
  playlist,
  open,
  onOpenChange,
}: EditPlaylistDialogProps) {
  const [values, setValues] = useState<PlaylistFormValues>(() => valuesFrom(playlist));
  const update = useUpdatePlaylist(playlist.id);

  useEffect(() => {
    if (open) setValues(valuesFrom(playlist));
  }, [open, playlist]);

  function submit() {
    update.mutate(
      {
        name: values.name.trim(),
        description: values.description.trim() || null,
      },
      { onSuccess: () => onOpenChange(false) }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit playlist</DialogTitle>
          <DialogDescription>
            Saving pushes these details to Spotify.
          </DialogDescription>
        </DialogHeader>

        <PlaylistFormFields
          idPrefix={`edit-playlist-${playlist.id}`}
          values={values}
          onChange={setValues}
        />

        {update.isError && (
          <p className="text-sm text-destructive">{apiErrorMessage(update.error)}</p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={update.isPending}
          >
            Cancel
          </Button>
          <Button onClick={submit} disabled={update.isPending || !values.name.trim()}>
            {update.isPending ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
