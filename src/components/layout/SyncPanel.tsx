import { useEffect, useRef } from "react";
import { PanelRightCloseIcon, PanelRightOpenIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SyncActivity } from "@/components/library";
import { useSyncPanel } from "@/contexts/SyncPanelContext";
import { useSyncStatus } from "@/contexts/SyncStatusContext";
import { cn } from "@/lib/utils";

export function SyncPanel() {
  const { isExpanded, isSuppressed, expand, collapse } = useSyncPanel();
  const { library, artist } = useSyncStatus();

  const expandBtnRef = useRef<HTMLButtonElement>(null);
  const collapseBtnRef = useRef<HTMLButtonElement>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (isExpanded) collapseBtnRef.current?.focus();
    else expandBtnRef.current?.focus();
  }, [isExpanded]);

  if (isSuppressed) return null;

  const hasActiveSync = library.hasActiveSync || artist.hasActiveSync;

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-l border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex",
        isExpanded ? "w-80" : "w-12"
      )}
    >
      {isExpanded ? (
        <>
          <div className="flex items-center justify-between px-4 pt-5 pb-3">
            <span className="font-heading text-sm font-semibold">Sync</span>
            <Button
              ref={collapseBtnRef}
              variant="ghost"
              size="icon-sm"
              onClick={collapse}
              aria-label="Minimize sync panel"
              aria-expanded
              aria-controls="sync-panel-body"
            >
              <PanelRightCloseIcon />
            </Button>
          </div>
          <div
            id="sync-panel-body"
            aria-label="Sync activity"
            className="flex-1 overflow-y-auto px-3 py-2"
          >
            <SyncActivity
              variant="panel"
              librarySession={library.visibleSession}
              artistSession={artist.visibleSession}
              onDismissLibrary={library.dismissSession}
              onDismissArtist={artist.dismissSession}
            />
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-3 pt-4">
          <Button
            ref={expandBtnRef}
            variant="ghost"
            size="icon-sm"
            onClick={expand}
            aria-label="Expand sync panel"
            aria-expanded={false}
            aria-controls="sync-panel-body"
          >
            <PanelRightOpenIcon />
          </Button>
          {hasActiveSync && (
            <div
              className="size-2 animate-pulse rounded-full bg-primary"
              aria-label="Sync in progress"
            />
          )}
          <span className="text-xs text-sidebar-foreground/70 [writing-mode:vertical-rl] rotate-180">
            Sync
          </span>
        </div>
      )}
    </aside>
  );
}
