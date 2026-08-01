import { Outlet } from "react-router-dom";
import { SyncStatusProvider } from "@/contexts/SyncStatusContext";
import { SyncPanelProvider } from "@/contexts/SyncPanelContext";
import { Sidebar } from "./Sidebar";
import { SyncPanel } from "./SyncPanel";

export function AppLayout() {
  return (
    <SyncPanelProvider>
      <SyncStatusProvider>
        <div className="flex min-h-screen bg-background">
          <Sidebar />
          <main className="min-w-0 flex-1">
            <div className="mx-auto max-w-6xl p-6">
              <Outlet />
            </div>
          </main>
          <SyncPanel />
        </div>
      </SyncStatusProvider>
    </SyncPanelProvider>
  );
}
