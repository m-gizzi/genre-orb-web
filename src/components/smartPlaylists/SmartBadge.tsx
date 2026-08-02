import { Link } from "react-router-dom";
import { SparklesIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SmartBadgeProps {
  smartPlaylistId: number;
}

export function SmartBadge({ smartPlaylistId }: SmartBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className="shrink-0"
      render={<Link to={`/smart-playlists/${smartPlaylistId}`} />}
    >
      <SparklesIcon className="size-3" />
      Smart
    </Badge>
  );
}
