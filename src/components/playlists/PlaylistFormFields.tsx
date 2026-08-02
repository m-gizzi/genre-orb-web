import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PLAYLIST_DESCRIPTION_LIMIT } from "@/lib/config";

export interface PlaylistFormValues {
  name: string;
  description: string;
}

interface PlaylistFormFieldsProps {
  idPrefix: string;
  values: PlaylistFormValues;
  onChange: (values: PlaylistFormValues) => void;
  namePlaceholder?: string;
}

export function PlaylistFormFields({
  idPrefix,
  values,
  onChange,
  namePlaceholder,
}: PlaylistFormFieldsProps) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-name`}>Name</Label>
        <Input
          id={`${idPrefix}-name`}
          value={values.name}
          onChange={(event) => onChange({ ...values, name: event.target.value })}
          placeholder={namePlaceholder}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${idPrefix}-description`}>Description</Label>
        <Input
          id={`${idPrefix}-description`}
          value={values.description}
          maxLength={PLAYLIST_DESCRIPTION_LIMIT}
          onChange={(event) =>
            onChange({ ...values, description: event.target.value })
          }
          placeholder="Optional"
        />
      </div>
    </>
  );
}
