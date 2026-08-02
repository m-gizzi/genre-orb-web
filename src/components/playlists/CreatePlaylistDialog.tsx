import { useState } from "react";
import { apiErrorMessage } from "@/api/client";
import { useCreatePlaylist } from "@/hooks/usePlaylistMutations";
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

const EMPTY: PlaylistFormValues = { name: "", description: "" };

interface CreatePlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePlaylistDialog({
  open,
  onOpenChange,
}: CreatePlaylistDialogProps) {
  const [values, setValues] = useState<PlaylistFormValues>(EMPTY);
  const create = useCreatePlaylist();

  function submit() {
    create.mutate(
      {
        name: values.name.trim(),
        description: values.description.trim() || undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setValues(EMPTY);
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New playlist</DialogTitle>
          <DialogDescription>
            Genre Orb creates this on Spotify straight away.
          </DialogDescription>
        </DialogHeader>

        <PlaylistFormFields idPrefix="new-playlist" values={values} onChange={setValues} />

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
          <Button onClick={submit} disabled={create.isPending || !values.name.trim()}>
            {create.isPending ? "Creating…" : "Create on Spotify"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
