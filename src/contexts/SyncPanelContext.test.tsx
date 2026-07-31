import { describe, it, expect, afterEach } from "vitest";
import type { ReactNode } from "react";
import { render, screen, renderHook, act } from "@testing-library/react";
import {
  SyncPanelProvider,
  useOwnsSyncDisplay,
  useSyncPanel,
} from "./SyncPanelContext";

const STORAGE_KEY = "genre-orb-sync-panel";

const wrapper = ({ children }: { children: ReactNode }) => (
  <SyncPanelProvider>{children}</SyncPanelProvider>
);

function Panel() {
  const { isSuppressed } = useSyncPanel();
  return isSuppressed ? null : <div>Sync panel</div>;
}

function InlinePage() {
  useOwnsSyncDisplay();
  return <div>Inline sync</div>;
}

describe("SyncPanelProvider", () => {
  afterEach(() => localStorage.clear());

  it("starts collapsed and persists an expand", () => {
    const { result } = renderHook(() => useSyncPanel(), { wrapper });
    expect(result.current.isExpanded).toBe(false);

    act(() => result.current.expand());
    expect(result.current.isExpanded).toBe(true);
    expect(localStorage.getItem(STORAGE_KEY)).toBe("expanded");
  });

  it("reads the stored state on mount", () => {
    localStorage.setItem(STORAGE_KEY, "expanded");
    const { result } = renderHook(() => useSyncPanel(), { wrapper });
    expect(result.current.isExpanded).toBe(true);
  });

  it("throws when used outside a provider", () => {
    expect(() => render(<Panel />)).toThrow(
      /useSyncPanel must be used within a SyncPanelProvider/
    );
  });
});

describe("useOwnsSyncDisplay", () => {
  afterEach(() => localStorage.clear());

  it("leaves the panel visible when no page claims sync display", () => {
    render(
      <SyncPanelProvider>
        <Panel />
        <div>Some page</div>
      </SyncPanelProvider>
    );
    expect(screen.getByText("Sync panel")).toBeInTheDocument();
  });

  it("suppresses the panel while a claiming page is mounted", () => {
    render(
      <SyncPanelProvider>
        <Panel />
        <InlinePage />
      </SyncPanelProvider>
    );
    expect(screen.queryByText("Sync panel")).not.toBeInTheDocument();
    expect(screen.getByText("Inline sync")).toBeInTheDocument();
  });

  it("restores the panel once the claiming page unmounts", () => {
    function App({ inline }: { inline: boolean }) {
      return (
        <SyncPanelProvider>
          <Panel />
          {inline && <InlinePage />}
        </SyncPanelProvider>
      );
    }

    const { rerender } = render(<App inline />);
    expect(screen.queryByText("Sync panel")).not.toBeInTheDocument();

    rerender(<App inline={false} />);
    expect(screen.getByText("Sync panel")).toBeInTheDocument();
  });
});
