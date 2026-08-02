import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiErrorMessage } from "@/api/client";
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
import {
  PlaylistFormFields,
  type PlaylistFormValues,
} from "@/components/playlists/PlaylistFormFields";
import { SourcePlaylistPicker } from "./SourcePlaylistPicker";

const EMPTY: PlaylistFormValues = { name: "", description: "" };

interface NewSmartPlaylistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NewSmartPlaylistDialog({
  open,
  onOpenChange,
}: NewSmartPlaylistDialogProps) {
  const navigate = useNavigate();
  const [values, setValues] = useState<PlaylistFormValues>(EMPTY);
  const [sourceIds, setSourceIds] = useState<number[]>([]);
  const create = useCreateSmartPlaylist();

  function submit() {
    create.mutate(
      {
        target_playlist_attributes: {
          name: values.name.trim(),
          description: values.description.trim() || undefined,
        },
        source_playlist_ids: sourceIds,
      },
      {
        onSuccess: (smartPlaylist) => {
          onOpenChange(false);
          navigate(`/smart-playlists/${smartPlaylist.id}`);
        },
      }
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New smart playlist</DialogTitle>
          <DialogDescription>
            This creates a real playlist on Spotify and points a rule set at it.
          </DialogDescription>
        </DialogHeader>

        <PlaylistFormFields
          idPrefix="new-smart-playlist"
          values={values}
          onChange={setValues}
          namePlaceholder="Death metal since 2020"
        />

        <div className="space-y-2">
          <Label>Source playlists</Label>
          <SourcePlaylistPicker selectedIds={sourceIds} onChange={setSourceIds} />
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
            disabled={create.isPending || !values.name.trim() || sourceIds.length === 0}
          >
            {create.isPending ? "Creating…" : "Create on Spotify"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
