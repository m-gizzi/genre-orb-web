import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { PlaylistSummary } from "@/api/client";

export interface KnownPlaylist {
  id: number;
  name: string;
  trackCount: number;
}

interface RulePlaylists {
  nameOf: (id: number) => string | undefined;
  hasNothingToMatch: (id: number) => boolean;
  /** The playlist this rule set fills, which cannot also be a rule reference. */
  excludedId: number | undefined;
  remember: (playlist: KnownPlaylist) => void;
}

const RulePlaylistsContext = createContext<RulePlaylists | null>(null);

interface RulePlaylistsProviderProps {
  known: PlaylistSummary[];
  excludedId?: number;
  children: React.ReactNode;
}

export function RulePlaylistsProvider({
  known,
  excludedId,
  children,
}: RulePlaylistsProviderProps) {
  const [learned, setLearned] = useState<Record<number, KnownPlaylist>>({});

  const remember = useCallback((playlist: KnownPlaylist) => {
    setLearned((current) => {
      const held = current[playlist.id];
      if (held?.name === playlist.name && held.trackCount === playlist.trackCount) {
        return current;
      }
      return { ...current, [playlist.id]: playlist };
    });
  }, []);

  const value = useMemo(() => {
    const byId = new Map<number, KnownPlaylist>();
    for (const playlist of Object.values(learned)) {
      byId.set(playlist.id, playlist);
    }
    // The server's own answer wins over anything picked up along the way.
    for (const { id, name, track_count } of known) {
      byId.set(id, { id, name, trackCount: track_count });
    }
    return {
      nameOf: (id: number) => byId.get(id)?.name,
      hasNothingToMatch: (id: number) => byId.get(id)?.trackCount === 0,
      excludedId,
      remember,
    };
  }, [known, learned, excludedId, remember]);

  return (
    <RulePlaylistsContext.Provider value={value}>
      {children}
    </RulePlaylistsContext.Provider>
  );
}

const NOTHING_KNOWN: RulePlaylists = {
  nameOf: () => undefined,
  hasNothingToMatch: () => false,
  excludedId: undefined,
  remember: () => {},
};

export function useRulePlaylists(): RulePlaylists {
  return useContext(RulePlaylistsContext) ?? NOTHING_KNOWN;
}

export function playlistLabel(id: number, name: string | undefined): string {
  return name ?? `Playlist #${id}`;
}
