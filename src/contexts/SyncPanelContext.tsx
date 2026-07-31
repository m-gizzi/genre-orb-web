import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type PanelState = "expanded" | "collapsed";

const STORAGE_KEY = "genre-orb-sync-panel";

interface SyncPanelContextType {
  state: PanelState;
  isExpanded: boolean;
  isSuppressed: boolean;
  expand: () => void;
  collapse: () => void;
  toggle: () => void;
  claimSyncDisplay: () => () => void;
}

const SyncPanelContext = createContext<SyncPanelContextType | null>(null);

function readStoredState(): PanelState {
  if (typeof window === "undefined") return "collapsed";
  return window.localStorage.getItem(STORAGE_KEY) === "expanded"
    ? "expanded"
    : "collapsed";
}

export function SyncPanelProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PanelState>(readStoredState);
  const [claims, setClaims] = useState(0);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, state);
  }, [state]);

  const expand = useCallback(() => setState("expanded"), []);
  const collapse = useCallback(() => setState("collapsed"), []);
  const toggle = useCallback(
    () => setState((prev) => (prev === "expanded" ? "collapsed" : "expanded")),
    []
  );

  const claimSyncDisplay = useCallback(() => {
    setClaims((prev) => prev + 1);
    return () => setClaims((prev) => prev - 1);
  }, []);

  const value = useMemo<SyncPanelContextType>(
    () => ({
      state,
      isExpanded: state === "expanded",
      isSuppressed: claims > 0,
      expand,
      collapse,
      toggle,
      claimSyncDisplay,
    }),
    [state, claims, expand, collapse, toggle, claimSyncDisplay]
  );

  return (
    <SyncPanelContext.Provider value={value}>
      {children}
    </SyncPanelContext.Provider>
  );
}

export function useSyncPanel() {
  const context = useContext(SyncPanelContext);
  if (!context) {
    throw new Error("useSyncPanel must be used within a SyncPanelProvider");
  }
  return context;
}

export function useOwnsSyncDisplay() {
  const { claimSyncDisplay } = useSyncPanel();
  useLayoutEffect(() => claimSyncDisplay(), [claimSyncDisplay]);
}
