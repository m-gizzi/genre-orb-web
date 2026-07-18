import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type PanelState = "expanded" | "collapsed";

const STORAGE_KEY = "genre-orb-sync-panel";

interface SyncPanelContextType {
  state: PanelState;
  isExpanded: boolean;
  expand: () => void;
  collapse: () => void;
  toggle: () => void;
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

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, state);
  }, [state]);

  const expand = useCallback(() => setState("expanded"), []);
  const collapse = useCallback(() => setState("collapsed"), []);
  const toggle = useCallback(
    () => setState((prev) => (prev === "expanded" ? "collapsed" : "expanded")),
    []
  );

  const value = useMemo<SyncPanelContextType>(
    () => ({ state, isExpanded: state === "expanded", expand, collapse, toggle }),
    [state, expand, collapse, toggle]
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
