import { cn } from "@/lib/utils";
import "./orb.css";

interface OrbProps {
  size?: number;
  className?: string;
  label?: string;
}

export function Orb({ size = 300, className, label }: OrbProps) {
  return (
    <div
      className={cn("orb", className)}
      style={{ "--orb-size": `${size}px` } as React.CSSProperties}
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <div className="orb__pedestal">
        <div className="orb__ped-body" />
        <div className="orb__ped-bottom" />
        <div className="orb__ped-top" />
      </div>
      <div className="orb__sphere" />
    </div>
  );
}
