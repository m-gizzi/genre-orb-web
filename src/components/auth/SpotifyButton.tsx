import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { spotifyApi } from "@/api/client";

interface SpotifyButtonProps extends Omit<ComponentProps<typeof Button>, "onClick"> {
  label?: string;
}

export function SpotifyButton({
  label = "Continue with Spotify",
  variant = "outline",
  className = "w-full",
  ...props
}: SpotifyButtonProps) {
  return (
    <Button
      type="button"
      variant={variant}
      className={className}
      onClick={() => spotifyApi.connect()}
      {...props}
    >
      {label}
    </Button>
  );
}
