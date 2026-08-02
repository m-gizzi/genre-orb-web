import { NavLink } from "react-router-dom";
import {
  LayoutDashboardIcon,
  ListMusicIcon,
  SparklesIcon,
  Music2Icon,
  UsersIcon,
  Disc3Icon,
  TagsIcon,
  LibraryBigIcon,
  LogOutIcon,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Orb } from "@/components/orb/Orb";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./ThemeToggle";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  end?: boolean;
}

const BROWSE: NavItem[] = [
  { to: "/", label: "Home", icon: LayoutDashboardIcon, end: true },
  { to: "/playlists", label: "Playlists", icon: ListMusicIcon },
  { to: "/smart-playlists", label: "Smart Playlists", icon: SparklesIcon },
  { to: "/tracks", label: "Tracks", icon: Music2Icon },
  { to: "/artists", label: "Artists", icon: UsersIcon },
  { to: "/albums", label: "Albums", icon: Disc3Icon },
  { to: "/genres", label: "Genres", icon: TagsIcon },
];

const MANAGE: NavItem[] = [
  { to: "/library", label: "Library", icon: LibraryBigIcon },
];

function NavItemLink({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
        )
      }
    >
      <Icon className="size-4 shrink-0" />
      {item.label}
    </NavLink>
  );
}

export function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="sticky top-0 flex h-screen w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="flex items-center gap-1 px-4 pt-5 pb-3">
        <Orb size={26} label="Genre Orb" />
        <span className="font-heading text-lg font-semibold">Genre Orb</span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {BROWSE.map((item) => (
          <NavItemLink key={item.to} item={item} />
        ))}
        <div className="my-2 border-t border-sidebar-border" />
        {MANAGE.map((item) => (
          <NavItemLink key={item.to} item={item} />
        ))}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="min-w-0 flex-1 truncate text-xs text-sidebar-foreground/70">
            {user?.email}
          </span>
          <ThemeToggle />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full justify-start"
          onClick={logout}
        >
          <LogOutIcon /> Log out
        </Button>
      </div>
    </aside>
  );
}
