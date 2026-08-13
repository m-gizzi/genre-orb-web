import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { PlaylistSummary } from "@/api/client";

interface PlaylistNames {
  nameOf: (id: number) => string | undefined;
  hasNothingToMatch: (id: number) => boolean;
  remember: (id: number, name: string) => void;
}

const PlaylistNamesContext = createContext<PlaylistNames | null>(null);

interface PlaylistNamesProviderProps {
  known: PlaylistSummary[];
  children: React.ReactNode;
}

export function PlaylistNamesProvider({
  known,
  children,
}: PlaylistNamesProviderProps) {
  const [learned, setLearned] = useState<Record<number, string>>({});

  const remember = useCallback((id: number, name: string) => {
    setLearned((current) =>
      current[id] === name ? current : { ...current, [id]: name },
    );
  }, []);

  const value = useMemo(() => {
    const names = new Map<number, string>();
    for (const [id, name] of Object.entries(learned)) {
      names.set(Number(id), name);
    }
    for (const playlist of known) {
      names.set(playlist.id, playlist.name);
    }

    const empty = new Set(
      known.filter(({ track_count }) => track_count === 0).map(({ id }) => id),
    );
    return {
      nameOf: (id: number) => names.get(id),
      hasNothingToMatch: (id: number) => empty.has(id),
      remember,
    };
  }, [known, learned, remember]);

  return (
    <PlaylistNamesContext.Provider value={value}>
      {children}
    </PlaylistNamesContext.Provider>
  );
}

const NO_NAMES: PlaylistNames = {
  nameOf: () => undefined,
  hasNothingToMatch: () => false,
  remember: () => {},
};

export function usePlaylistNames(): PlaylistNames {
  return useContext(PlaylistNamesContext) ?? NO_NAMES;
}

export function playlistLabel(id: number, name: string | undefined): string {
  return name ?? `Playlist #${id}`;
}
